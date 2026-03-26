import { Service, Show, RotationEntry } from '../types';

export function computeRotation(services: Service[], shows: Show[]): RotationEntry[] {
  const activeServices = services.filter(s => s.active);

  return activeServices
    .map(service => {
      const serviceShows = shows.filter(
        s => s.service_id === service.id && s.status !== 'done'
      );

      let score = serviceShows.length * 10;
      const reasons: string[] = [];

      if (service.is_free) {
        score -= 50;
        reasons.push("free service — no billing pressure");
      }

      if (!service.is_free && service.billing_date) {
        const today = new Date();
        const billingDay = service.billing_date;
        let daysUntilBilling: number;

        // Calculate days until next billing date
        const nextBilling = new Date(today.getFullYear(), today.getMonth(), billingDay);
        if (nextBilling <= today) {
          nextBilling.setMonth(nextBilling.getMonth() + 1);
        }
        daysUntilBilling = Math.ceil((nextBilling.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilBilling <= 3) {
          score += 50;
          reasons.push(`billing in ${daysUntilBilling} day${daysUntilBilling === 1 ? '' : 's'} — urgent!`);
        } else if (daysUntilBilling <= 7) {
          score += 30;
          reasons.push(`billing in ${daysUntilBilling} days — watch soon`);
        } else {
          reasons.push(`billing in ${daysUntilBilling} days`);
        }
      }

      if (serviceShows.length > 0) {
        const watching = serviceShows.filter(s => s.status === 'watching');
        if (watching.length > 0) {
          reasons.push(`${watching.length} show${watching.length > 1 ? 's' : ''} in progress`);
        }
        const totalEps = serviceShows.reduce((sum, s) => sum + (s.episodes_remaining || 0), 0);
        if (totalEps > 0) {
          reasons.push(`${totalEps} episode${totalEps > 1 ? 's' : ''} remaining`);
        } else {
          reasons.push(`${serviceShows.length} show${serviceShows.length > 1 ? 's' : ''} queued`);
        }
      } else {
        reasons.push('no shows tracked');
      }

      return {
        service,
        score,
        reason: reasons.join(' · '),
        shows: serviceShows,
      };
    })
    .sort((a, b) => b.score - a.score);
}

export function getDaysUntilBilling(billingDate: number | null): number | null {
  if (!billingDate) return null;
  const today = new Date();
  const next = new Date(today.getFullYear(), today.getMonth(), billingDate);
  if (next <= today) next.setMonth(next.getMonth() + 1);
  return Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function getBillingUrgency(days: number | null): 'urgent' | 'soon' | 'ok' | null {
  if (days === null) return null;
  if (days <= 3) return 'urgent';
  if (days <= 7) return 'soon';
  return 'ok';
}
