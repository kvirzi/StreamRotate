import { Router, Request, Response } from 'express';
import { notifyNewSignup, sendBillingReminder, BillingReminderItem } from '../lib/email';
import { supabaseAdmin } from '../lib/supabase';

const router = Router();

// Days until the next occurrence of a day-of-month billing date (mirrors the
// frontend getDaysUntilBilling so reminders line up with the in-app countdown).
function daysUntilBilling(billingDate: number | null): number | null {
  if (!billingDate) return null;
  const today = new Date();
  const next = new Date(today.getFullYear(), today.getMonth(), billingDate);
  if (next <= today) next.setMonth(next.getMonth() + 1);
  return Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// POST /api/notify/billing-reminders — daily cron target. Emails each user whose
// active paid subscriptions renew in exactly one of the target day-counts.
// Protected by the shared webhook secret. Configure the lead times with
// ?days=3,1 (default 3). Run this once per day (e.g. Railway cron / cron-job.org).
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
    const { data: services, error } = await supabaseAdmin
      .from('services')
      .select('user_id, name, cost_monthly, billing_date, cancel_url')
      .eq('active', true)
      .eq('is_free', false)
      .not('billing_date', 'is', null);

    if (error) throw error;

    // Group matching services by user.
    const byUser = new Map<string, BillingReminderItem[]>();
    for (const s of services || []) {
      const days = daysUntilBilling(s.billing_date);
      if (days === null || !targetDays.includes(days)) continue;
      const item: BillingReminderItem = {
        name: s.name,
        cost_monthly: s.cost_monthly,
        days,
        cancel_url: s.cancel_url,
      };
      const list = byUser.get(s.user_id) || [];
      list.push(item);
      byUser.set(s.user_id, list);
    }

    let emailed = 0;
    for (const [userId, items] of byUser) {
      const { data, error: uErr } = await supabaseAdmin.auth.admin.getUserById(userId);
      const email = data?.user?.email;
      if (uErr || !email) continue;
      await sendBillingReminder(email, items);
      emailed++;
    }

    res.json({ ok: true, targetDays, usersEmailed: emailed, servicesMatched: [...byUser.values()].flat().length });
  } catch (err) {
    console.error('Billing reminder error:', err);
    res.status(500).json({ error: 'Reminder run failed' });
  }
});

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

export default router;
