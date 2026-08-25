import crypto from 'crypto';
import { supabaseAdmin } from './supabase';
import { sendBillingReminder, BillingReminderItem } from './email';

const BASE_URL = process.env.PUBLIC_API_URL || process.env.FRONTEND_URL || 'https://streamrotate.com';

// Days until the next occurrence of a day-of-month billing date (mirrors the
// frontend getDaysUntilBilling so reminders line up with the in-app countdown).
export function daysUntilBilling(billingDate: number | null): number | null {
  if (!billingDate) return null;
  const today = new Date();
  const next = new Date(today.getFullYear(), today.getMonth(), billingDate);
  if (next <= today) next.setMonth(next.getMonth() + 1);
  return Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// Signed unsubscribe token so the one-click link can't be forged.
export function unsubscribeToken(userId: string): string {
  return crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET || 'dev-secret')
    .update(userId)
    .digest('hex')
    .slice(0, 32);
}

export function verifyUnsubscribeToken(userId: string, token: string): boolean {
  const expected = unsubscribeToken(userId);
  // constant-time compare
  return expected.length === token.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
}

function unsubscribeUrl(userId: string): string {
  return `${BASE_URL}/api/notify/unsubscribe?u=${userId}&t=${unsubscribeToken(userId)}`;
}

/**
 * Find every user whose active paid subscriptions renew in one of `targetDays`
 * lead times, and email them a renewal reminder (unless they've opted out).
 * Returns run stats. Shared by the daily cron and the manual HTTP endpoint.
 */
export async function runBillingReminders(targetDays: number[]): Promise<{
  usersEmailed: number;
  servicesMatched: number;
}> {
  const { data: services, error } = await supabaseAdmin
    .from('services')
    .select('user_id, name, cost_monthly, billing_date, cancel_url, users!inner(email, email_reminders)')
    .eq('active', true)
    .eq('is_free', false)
    .not('billing_date', 'is', null);

  if (error) throw error;

  // Group matching services by user (skipping opted-out users and those with no email).
  const byUser = new Map<string, { email: string; items: BillingReminderItem[] }>();
  for (const s of ((services || []) as any[])) {
    const days = daysUntilBilling(s.billing_date);
    if (days === null || !targetDays.includes(days)) continue;

    const user = Array.isArray(s.users) ? s.users[0] : s.users;
    if (!user || user.email_reminders === false || !user.email) continue;

    const renewal = new Date();
    renewal.setDate(renewal.getDate() + days);
    const renewalLabel = renewal.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    const item: BillingReminderItem = {
      name: s.name,
      cost_monthly: s.cost_monthly,
      days,
      renewalLabel,
      cancel_url: s.cancel_url,
    };
    const entry = byUser.get(s.user_id) || { email: user.email as string, items: [] as BillingReminderItem[] };
    entry.items.push(item);
    byUser.set(s.user_id, entry);
  }

  if (!byUser.size) return { usersEmailed: 0, servicesMatched: 0 };

  // "What to watch next": each user's currently-watching shows, soonest episode first.
  const userIds = [...byUser.keys()];
  const { data: shows } = await supabaseAdmin
    .from('shows')
    .select('user_id, title, next_air_date, status')
    .in('user_id', userIds)
    .eq('status', 'watching');

  const nextUpByUser = new Map<string, string[]>();
  for (const row of (shows || []) as any[]) {
    const list = nextUpByUser.get(row.user_id) || [];
    list.push(row.title);
    nextUpByUser.set(row.user_id, list);
  }

  let emailed = 0;
  let matched = 0;
  for (const [userId, { email, items }] of byUser) {
    matched += items.length;
    const nextUp = (nextUpByUser.get(userId) || []).slice(0, 3);
    await sendBillingReminder(email, items, nextUp, unsubscribeUrl(userId));
    emailed++;
  }

  return { usersEmailed: emailed, servicesMatched: matched };
}
