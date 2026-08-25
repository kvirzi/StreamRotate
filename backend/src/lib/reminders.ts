import crypto from 'crypto';
import { supabaseAdmin } from './supabase';
import { sendBillingReminder, BillingReminderItem, NextUp } from './email';
import { catalogCancelUrl, catalogSignupUrl } from './serviceCatalog';

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
export async function runBillingReminders(targetDays: number[], onlyEmail?: string, debug = false): Promise<{
  usersEmailed: number;
  servicesMatched: number;
  debug?: any;
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
    // Test-mode: restrict the run to a single address.
    if (onlyEmail && user.email.toLowerCase() !== onlyEmail.toLowerCase()) continue;

    const renewal = new Date();
    renewal.setDate(renewal.getDate() + days);
    const renewalLabel = renewal.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    const item: BillingReminderItem = {
      name: s.name,
      cost_monthly: s.cost_monthly,
      days,
      renewalLabel,
      // Fall back to a known cancel URL when the user didn't save one.
      cancel_url: s.cancel_url || catalogCancelUrl(s.name),
    };
    const entry = byUser.get(s.user_id) || { email: user.email as string, items: [] as BillingReminderItem[] };
    entry.items.push(item);
    byUser.set(s.user_id, entry);
  }

  if (!byUser.size) return { usersEmailed: 0, servicesMatched: 0 };

  // "What to watch next" = the next service in the rotation to reactivate: the
  // service (other than the one being cancelled) with the biggest unwatched
  // backlog, plus a few of its shows and a reactivation link.
  const userIds = [...byUser.keys()];
  const [{ data: allServices }, { data: allShows }] = await Promise.all([
    supabaseAdmin.from('services').select('id, user_id, name, active, is_free').in('user_id', userIds),
    supabaseAdmin.from('shows').select('user_id, service_id, title, status, episodes_remaining').in('user_id', userIds).neq('status', 'done'),
  ]);

  // Index shows by service.
  const showsByService = new Map<string, { title: string; status: string }[]>();
  for (const row of (allShows || []) as any[]) {
    if (!row.service_id) continue;
    const list = showsByService.get(row.service_id) || [];
    list.push({ title: row.title, status: row.status });
    showsByService.set(row.service_id, list);
  }

  const servicesByUser = new Map<string, any[]>();
  for (const svc of (allServices || []) as any[]) {
    const list = servicesByUser.get(svc.user_id) || [];
    list.push(svc);
    servicesByUser.set(svc.user_id, list);
  }

  function pickNextUp(userId: string, renewingNames: Set<string>): NextUp | null {
    const services = servicesByUser.get(userId) || [];
    let best: { name: string; count: number; inactive: boolean; shows: { title: string; status: string }[] } | null = null;

    for (const svc of services) {
      if (renewingNames.has(svc.name.toLowerCase())) continue; // don't suggest the one they're cancelling
      const svcShows = showsByService.get(svc.id) || [];
      if (!svcShows.length) continue;
      const inactive = !svc.active;
      // Prefer more backlog; tie-break toward an inactive service (true "reactivate").
      const better = !best || svcShows.length > best.count ||
        (svcShows.length === best.count && inactive && !best.inactive);
      if (better) best = { name: svc.name, count: svcShows.length, inactive, shows: svcShows };
    }

    if (!best) return null;
    // Watching shows first, then queued, up to 3.
    const ordered = [...best.shows].sort((a, b) =>
      (a.status === 'watching' ? 0 : 1) - (b.status === 'watching' ? 0 : 1));
    return {
      serviceName: best.name,
      signupUrl: catalogSignupUrl(best.name),
      shows: ordered.slice(0, 3).map(s => s.title),
    };
  }

  let emailed = 0;
  let matched = 0;
  const debugInfo: any[] = [];
  for (const [userId, { email, items }] of byUser) {
    matched += items.length;
    const renewingNames = new Set(items.map(i => i.name.toLowerCase()));
    const nextUp = pickNextUp(userId, renewingNames);
    if (debug) {
      debugInfo.push({
        email,
        renewing: [...renewingNames],
        services: (servicesByUser.get(userId) || []).map((svc: any) => ({
          name: svc.name,
          active: svc.active,
          is_free: svc.is_free,
          nonDoneShows: (showsByService.get(svc.id) || []).length,
        })),
        chosenNextUp: nextUp,
        nonDoneShows: ((allShows || []) as any[])
          .filter(sh => sh.user_id === userId)
          .map(sh => ({ title: sh.title, service_id: sh.service_id, status: sh.status })),
      });
    }
    if (!debug) {
      await sendBillingReminder(email, items, nextUp, unsubscribeUrl(userId));
      emailed++;
    }
  }

  return { usersEmailed: emailed, servicesMatched: matched, ...(debug ? { debug: debugInfo } : {}) };
}
