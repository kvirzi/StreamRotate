import cron from 'node-cron';
import { runBillingReminders } from './reminders';

// Lead time(s), in days before renewal, to send reminders. Override with
// BILLING_REMINDER_DAYS="3,1". Defaults to a single 3-day-ahead nudge.
const REMINDER_DAYS = (process.env.BILLING_REMINDER_DAYS || '3')
  .split(',')
  .map(d => parseInt(d.trim(), 10))
  .filter(d => Number.isFinite(d));

/**
 * Starts the in-process daily scheduler. Runs once a day at 9:00am (server
 * timezone, or TZ env) and emails renewal reminders. No external cron needed —
 * this lives inside the always-on backend.
 */
export function startScheduler() {
  // "0 9 * * *" = every day at 09:00.
  cron.schedule('0 9 * * *', async () => {
    try {
      const stats = await runBillingReminders(REMINDER_DAYS);
      console.log(`[scheduler] billing reminders sent`, { days: REMINDER_DAYS, ...stats });
    } catch (err) {
      console.error('[scheduler] billing reminder run failed:', err);
    }
  });
  console.log(`[scheduler] billing reminders scheduled daily at 09:00 (lead: ${REMINDER_DAYS.join(',')}d)`);
}
