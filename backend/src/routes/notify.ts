import { Router, Request, Response } from 'express';
import { notifyNewSignup } from '../lib/email';
import { supabaseAdmin } from '../lib/supabase';
import { runBillingReminders, verifyUnsubscribeToken } from '../lib/reminders';

const router = Router();

// POST /api/notify/signup — called by Supabase Auth webhook on new user INSERT
router.post('/signup', async (req: Request, res: Response): Promise<void> => {
  // Verify the shared secret so random people can't spam this endpoint
  const secret = req.headers['x-webhook-secret'];
  if (!process.env.WEBHOOK_SECRET || secret !== process.env.WEBHOOK_SECRET) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    // Supabase sends the new user record in req.body.record
    const email = req.body?.record?.email || req.body?.email || 'unknown';
    await notifyNewSignup(email);
    res.json({ ok: true });
  } catch (err) {
    console.error('Signup notification error:', err);
    res.status(500).json({ error: 'Notification failed' });
  }
});

// POST /api/notify/billing-reminders — manual trigger for the daily reminder run.
// The scheduler (src/lib/scheduler) also runs this automatically; this endpoint
// is handy for testing / sending now. Protected by the shared webhook secret.
// Configure lead times with ?days=3,1 (default 3).
router.post('/billing-reminders', async (req: Request, res: Response): Promise<void> => {
  const secret = req.headers['x-webhook-secret'];
  if (!process.env.WEBHOOK_SECRET || secret !== process.env.WEBHOOK_SECRET) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const targetDays = String(req.query.days || '3')
    .split(',')
    .map(d => parseInt(d.trim(), 10))
    .filter(d => Number.isFinite(d));

  try {
    const stats = await runBillingReminders(targetDays);
    res.json({ ok: true, targetDays, ...stats });
  } catch (err) {
    console.error('Billing reminder error:', err);
    res.status(500).json({ error: 'Reminder run failed' });
  }
});

// GET /api/notify/unsubscribe?u=<userId>&t=<token> — one-click opt-out from the
// email footer. Verifies the signed token, then flips the user's flag off.
router.get('/unsubscribe', async (req: Request, res: Response): Promise<void> => {
  const userId = String(req.query.u || '');
  const token = String(req.query.t || '');
  const ok = userId && token && verifyUnsubscribeToken(userId, token);

  if (!ok) {
    res.status(400).send('<p>Invalid or expired unsubscribe link.</p>');
    return;
  }

  try {
    await supabaseAdmin.from('users').update({ email_reminders: false }).eq('id', userId);
  } catch (err) {
    console.error('Unsubscribe error:', err);
  }

  res.send(`<!doctype html><html><body style="font-family:-apple-system,sans-serif;max-width:480px;margin:60px auto;text-align:center;color:#1a1a24">
    <div style="font-size:22px;font-weight:700"><span style="color:#e8734a">Stream</span>Rotate</div>
    <p style="margin-top:20px;font-size:16px">You've been unsubscribed from renewal reminder emails.</p>
    <p style="color:#888;font-size:14px">You can turn them back on anytime in the app's Reminders tab.</p>
  </body></html>`);
});

export default router;
