import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import type { Show } from '../types';

// Deterministic small integer id from a show id (notifications need numeric ids).
function notifId(showId: string): number {
  let hash = 0;
  for (let i = 0; i < showId.length; i++) {
    hash = (hash * 31 + showId.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 2000000000;
}

/**
 * Ask for notification permission (iOS shows the system prompt once).
 * Returns true if granted.
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  const current = await LocalNotifications.checkPermissions();
  if (current.display === 'granted') return true;
  if (current.display === 'denied') return false;
  const req = await LocalNotifications.requestPermissions();
  return req.display === 'granted';
}

/**
 * Schedule a local notification for each show that has a future air date.
 * Fires at 9am local time on the day the next episode airs. Re-syncing is
 * safe — existing pending notifications are cleared first so we never double up.
 */
export async function syncEpisodeNotifications(shows: Show[]): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  const granted = await ensureNotificationPermission();
  if (!granted) return;

  // Clear previously scheduled ones so counts/dates stay accurate.
  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length) {
    await LocalNotifications.cancel({ notifications: pending.notifications.map(n => ({ id: n.id })) });
  }

  const now = Date.now();
  const toSchedule = shows
    .filter(s => s.next_air_date)
    .map(s => {
      // Fire at 9:00am local on the air date.
      const at = new Date(`${s.next_air_date}T09:00:00`);
      return { show: s, at };
    })
    .filter(({ at }) => at.getTime() > now);

  if (!toSchedule.length) return;

  await LocalNotifications.schedule({
    notifications: toSchedule.map(({ show, at }) => ({
      id: notifId(show.id),
      title: 'New episode today 📺',
      body: `A new episode of ${show.title} airs today.`,
      schedule: { at },
    })),
  });
}
