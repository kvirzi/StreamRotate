import { Bell, ExternalLink, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { Service } from '../../types';
import { ServiceIcon } from '../../components/ServiceIcon';
import { getDaysUntilBilling, getBillingUrgency } from '../../lib/rotation';

interface RemindersProps {
  services: Service[];
}

export function Reminders({ services }: RemindersProps) {
  const billableServices = services
    .filter(s => s.active && !s.is_free)
    .map(s => ({ service: s, days: getDaysUntilBilling(s.billing_date) }))
    .sort((a, b) => (a.days ?? 999) - (b.days ?? 999));

  const freeServices = services.filter(s => s.active && s.is_free);

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="font-display font-bold text-2xl text-text-primary">Billing Reminders</h1>
        <p className="text-text-muted text-sm mt-0.5">Stay on top of your subscription renewals</p>
      </div>

      {billableServices.length === 0 && freeServices.length === 0 ? (
        <div className="text-center py-16 bg-bg-card border border-bg-border rounded-2xl">
          <Bell size={40} className="mx-auto text-text-muted mb-4" />
          <h3 className="font-display font-semibold text-text-primary mb-2">No services tracked</h3>
          <p className="text-text-muted text-sm">Add your streaming services to see billing reminders</p>
        </div>
      ) : (
        <>
          {/* Urgent / Soon */}
          {billableServices.filter(({ days }) => days !== null && days <= 7).length > 0 && (
            <div className="bg-red-900/10 border border-red-900/30 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={16} className="text-red-400" />
                <h2 className="font-display font-semibold text-red-400">Action Required</h2>
              </div>
              <div className="space-y-3">
                {billableServices
                  .filter(({ days }) => days !== null && days <= 7)
                  .map(({ service, days }) => (
                    <BillingCard key={service.id} service={service} days={days} />
                  ))}
              </div>
            </div>
          )}

          {/* Upcoming (8-30 days) */}
          {billableServices.filter(({ days }) => days !== null && days > 7 && days <= 30).length > 0 && (
            <div className="bg-bg-card border border-bg-border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock size={16} className="text-yellow-400" />
                <h2 className="font-display font-semibold text-text-primary">Coming Up</h2>
                <span className="text-xs text-text-muted">(next 30 days)</span>
              </div>
              <div className="space-y-3">
                {billableServices
                  .filter(({ days }) => days !== null && days > 7 && days <= 30)
                  .map(({ service, days }) => (
                    <BillingCard key={service.id} service={service} days={days} />
                  ))}
              </div>
            </div>
          )}

          {/* Later */}
          {billableServices.filter(({ days }) => days === null || days > 30).length > 0 && (
            <div className="bg-bg-card border border-bg-border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle size={16} className="text-accent-teal" />
                <h2 className="font-display font-semibold text-text-primary">All Good</h2>
                <span className="text-xs text-text-muted">(30+ days away)</span>
              </div>
              <div className="space-y-3">
                {billableServices
                  .filter(({ days }) => days === null || days > 30)
                  .map(({ service, days }) => (
                    <BillingCard key={service.id} service={service} days={days} />
                  ))}
              </div>
            </div>
          )}

          {/* Free services */}
          {freeServices.length > 0 && (
            <div className="bg-bg-card border border-bg-border rounded-2xl p-5">
              <h2 className="font-display font-semibold text-text-primary mb-4 text-sm">Free Services</h2>
              <div className="flex flex-wrap gap-2">
                {freeServices.map(service => (
                  <div key={service.id} className="flex items-center gap-2 px-3 py-2 bg-accent-teal/10 border border-accent-teal/20 rounded-xl">
                    <ServiceIcon name={service.name} size="sm" />
                    <span className="text-sm text-text-primary">{service.name}</span>
                    <span className="text-xs text-accent-teal">Free</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function BillingCard({ service, days }: { service: Service; days: number | null }) {
  const urgency = getBillingUrgency(days);

  const ordinal = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${
      urgency === 'urgent' ? 'bg-red-900/10 border-red-900/30' :
      urgency === 'soon' ? 'bg-yellow-900/10 border-yellow-900/30' :
      'bg-bg-hover border-bg-border'
    }`}>
      <ServiceIcon name={service.name} size="sm" />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary">{service.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-text-muted">${service.cost_monthly}/mo</span>
          {service.billing_date && (
            <span className="text-xs text-text-muted">
              · renews on the {ordinal(service.billing_date)}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {days !== null && (
          <div className={`text-center px-3 py-1.5 rounded-xl ${
            urgency === 'urgent' ? 'bg-red-900/20' :
            urgency === 'soon' ? 'bg-yellow-900/20' :
            'bg-bg-secondary'
          }`}>
            <p className={`text-sm font-bold font-display ${
              urgency === 'urgent' ? 'text-red-400' :
              urgency === 'soon' ? 'text-yellow-400' : 'text-text-primary'
            }`}>{days}d</p>
          </div>
        )}

        {service.cancel_url && (
          <a
            href={service.cancel_url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-text-muted hover:text-accent-orange rounded-lg transition-colors"
            title="Cancel subscription"
          >
            <ExternalLink size={14} />
          </a>
        )}
      </div>
    </div>
  );
}
