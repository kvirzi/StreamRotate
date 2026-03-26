import { useMemo } from 'react';
import { RotateCcw, Trophy, AlertTriangle, Clock, Zap } from 'lucide-react';
import { Service, Show } from '../../types';
import { computeRotation, getDaysUntilBilling, getBillingUrgency } from '../../lib/rotation';
import { ServiceIcon } from '../../components/ServiceIcon';

interface RotationPlanProps {
  services: Service[];
  shows: Show[];
  onNavigate: (page: string) => void;
}

export function RotationPlan({ services, shows, onNavigate }: RotationPlanProps) {
  const rotation = useMemo(() => computeRotation(services, shows), [services, shows]);

  if (services.length === 0) {
    return (
      <div className="fade-in text-center py-16 bg-bg-card border border-bg-border rounded-2xl">
        <RotateCcw size={40} className="mx-auto text-text-muted mb-4" />
        <h3 className="font-display font-semibold text-text-primary mb-2">No services to rotate</h3>
        <p className="text-text-muted text-sm mb-4">Add your streaming services to generate a rotation plan</p>
        <button onClick={() => onNavigate('services')} className="text-accent-orange hover:underline text-sm font-medium">
          Add services →
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="font-display font-bold text-2xl text-text-primary">Rotation Plan</h1>
        <p className="text-text-muted text-sm mt-0.5">
          Services ordered by billing urgency and content remaining
        </p>
      </div>

      {/* Algorithm explanation */}
      <div className="bg-bg-card border border-bg-border rounded-2xl p-5">
        <h3 className="font-display font-semibold text-text-primary mb-3 text-sm">How scoring works</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Per show', value: '+10', color: 'text-accent-teal' },
            { label: 'Bills in 7d', value: '+30', color: 'text-yellow-400' },
            { label: 'Bills in 3d', value: '+50', color: 'text-red-400' },
            { label: 'Free service', value: '−50', color: 'text-text-muted' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-bg-hover rounded-xl p-3 text-center">
              <p className={`text-xl font-bold font-display ${color}`}>{value}</p>
              <p className="text-xs text-text-muted mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Rotation list */}
      <div className="space-y-3">
        {rotation.map((entry, idx) => {
          const days = getDaysUntilBilling(entry.service.billing_date);
          const urgency = getBillingUrgency(days);
          const isTop = idx === 0;

          return (
            <div
              key={entry.service.id}
              className={`bg-bg-card border rounded-2xl p-5 card-hover relative overflow-hidden ${
                isTop ? 'border-accent-orange/40' : 'border-bg-border'
              }`}
            >
              {isTop && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent-orange to-accent-purple" />
              )}

              <div className="flex items-start gap-4">
                {/* Rank */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                  isTop ? 'bg-accent-orange text-white' : 'bg-bg-hover text-text-muted'
                }`}>
                  {idx + 1}
                </div>

                <ServiceIcon name={entry.service.name} size="md" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display font-semibold text-text-primary">{entry.service.name}</h3>
                    {isTop && (
                      <span className="badge bg-accent-orange/15 text-accent-orange border border-accent-orange/30 flex items-center gap-1">
                        <Zap size={10} /> Watch First
                      </span>
                    )}
                    {urgency === 'urgent' && (
                      <span className="badge bg-red-900/20 text-red-400 border border-red-900/30 flex items-center gap-1">
                        <AlertTriangle size={10} /> Urgent
                      </span>
                    )}
                    {urgency === 'soon' && (
                      <span className="badge bg-yellow-900/20 text-yellow-400 border border-yellow-900/30 flex items-center gap-1">
                        <Clock size={10} /> Soon
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-text-secondary mt-1">{entry.reason}</p>

                  {/* Score */}
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-text-muted">
                      Score: <span className="text-text-primary font-semibold">{entry.score}</span>
                    </span>
                    {!entry.service.is_free && entry.service.cost_monthly && (
                      <span className="text-xs text-text-muted">
                        ${entry.service.cost_monthly}/mo
                      </span>
                    )}
                  </div>
                </div>

                {/* Billing urgency badge */}
                {!entry.service.is_free && days !== null && (
                  <div className={`text-center flex-shrink-0 px-3 py-2 rounded-xl ${
                    urgency === 'urgent' ? 'bg-red-900/20 border border-red-900/30' :
                    urgency === 'soon' ? 'bg-yellow-900/20 border border-yellow-900/30' :
                    'bg-bg-hover border border-bg-border'
                  }`}>
                    <p className={`text-lg font-bold font-display ${
                      urgency === 'urgent' ? 'text-red-400' :
                      urgency === 'soon' ? 'text-yellow-400' : 'text-text-primary'
                    }`}>{days}</p>
                    <p className="text-xs text-text-muted">days</p>
                  </div>
                )}
              </div>

              {/* Shows for this service */}
              {entry.shows.length > 0 && (
                <div className="mt-4 ml-12 pl-4 border-l border-bg-border space-y-1.5">
                  {entry.shows.slice(0, 4).map(show => (
                    <div key={show.id} className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        show.status === 'watching' ? 'bg-accent-teal' : 'bg-bg-border'
                      }`} />
                      <span className="text-sm text-text-secondary truncate">{show.title}</span>
                      {show.episodes_remaining > 0 && (
                        <span className="text-xs text-text-muted ml-auto flex-shrink-0">{show.episodes_remaining} ep</span>
                      )}
                    </div>
                  ))}
                  {entry.shows.length > 4 && (
                    <p className="text-xs text-text-muted">+{entry.shows.length - 4} more shows</p>
                  )}
                </div>
              )}

              {entry.shows.length === 0 && (
                <div className="mt-3 ml-12 flex items-center gap-2 text-sm text-text-muted">
                  <Trophy size={14} />
                  <span>No active shows — consider adding some or cancelling this service</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
