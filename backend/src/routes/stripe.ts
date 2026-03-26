import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { supabaseAdmin } from '../lib/supabase';
import { AuthRequest, requireAuth } from '../middleware/auth';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

// POST /api/stripe/checkout
router.post('/checkout', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { plan } = req.body; // 'monthly' or 'annual'

  const priceId = plan === 'annual'
    ? process.env.STRIPE_PRO_ANNUAL_PRICE_ID!
    : process.env.STRIPE_PRO_MONTHLY_PRICE_ID!;

  try {
    // Get or create Stripe customer
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('stripe_customer_id, email')
      .eq('id', req.userId)
      .single();

    let customerId = userData?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.userEmail!,
        metadata: { supabase_user_id: req.userId! },
      });
      customerId = customer.id;
      await supabaseAdmin
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', req.userId);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/app?upgraded=true`,
      cancel_url: `${process.env.FRONTEND_URL}/app`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// GET /api/stripe/portal
router.get('/portal', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('stripe_customer_id')
      .eq('id', req.userId)
      .single();

    if (!userData?.stripe_customer_id) {
      res.status(404).json({ error: 'No billing account found' });
      return;
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: userData.stripe_customer_id,
      return_url: `${process.env.FRONTEND_URL}/app`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe portal error:', err);
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

// POST /api/stripe/webhook
router.post('/webhook', async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    res.status(400).json({ error: 'Invalid webhook signature' });
    return;
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const isActive = subscription.status === 'active' || subscription.status === 'trialing';

        await supabaseAdmin
          .from('users')
          .update({ plan: isActive ? 'pro' : 'free' })
          .eq('stripe_customer_id', customerId);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        await supabaseAdmin
          .from('users')
          .update({ plan: 'free' })
          .eq('stripe_customer_id', customerId);
        break;
      }
    }
    res.json({ received: true });
  } catch (err) {
    console.error('Webhook processing error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
