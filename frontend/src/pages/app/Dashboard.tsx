import { useMemo } from 'react';
import { DollarSign, Tv2, Play, CheckCircle, Trophy, Calendar, Clock, Zap, LucideIcon } from 'lucide-react';
import { Service, Show } from '../../types';
import { computeRotation, getDaysUntilBilling, getBillingUrgency } from '../../lib/rotation';
import { ServiceIcon } from '../../components/ServiceIcon';

interface DashboardProps {
  services: Service[];
  shows: Show[];
  onNavigate: (page: string) => void;
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-bg-card border border-bg-border rounded-2xl p-5 card-hover">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-text-muted text-sm">{label}</p>
          <p className={`text-3xl font-display font-bold mt-1 ${color}`}>{value}</p>
          {sub && <p className="text-xs text-text-muted mt-1">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-xl bg-opacity-15 ${color.replace('text-', 'bg-').replace('-400', '-900/20').replace('-orange', '-orange/15').replace('-teal', '-teal/15').replace('-purple', '-purple/15')}`}>
          <Icon size={20} className={color} />
        </div>
      </div>
    </div>
  );
}

export function Dashboard({ services, shows, onNavigate }: DashboardProps) {
  const rotation = useMemo(() => computeRotation(services, shows), [services, shows]);
  const monthlyCost = services
    .filter(s => s.active && !s.is_free)
    .reduce((sum, s) => sum + (s.cost_monthly || 0), 0);

  const watchingNow = shows.filter(s => s.status === 'watching').length;
  const finished = shows.filter(s => s.status === 'done').length;
  const totalEps = shows
    .filter(s => s.status !== 'done')
    .reduce((sum, s) => sum + (s.episodes_remaining || 0), 0);

  const topService = rotation[0];
  const upcomingBilling = services
    .filter(s => s.active && !s.is_free && s.billing_date)
    .map(s => ({ service: s, days: getDaysUntilBilling(s.billing_date) }))
    .filter(({ days }) => days !== null && days <= 14)
    .sort((a, b) => (a.days ?? 99) - (b.days ?? 99))
    .slice(0, 4);

  const upcomingEps = shows
    .filter(s => s.next_air_date)
    .sort((a, b) => new Date(a.next_air_date!).getTime() - new Date(b.next_air_date!).getTime())
    .slice(0, 4);

  return (
    <div className="space-y-6 fade-in">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          label="Monthly Cost"
          value={`$${monthlyCost.toFixed(2)}`}
          sub={`${services.filter(s => s.active).length} services`}
          color="text-accent-orange"
        />
        <StatCard
          icon={Play}
          label="Watching Now"
          value={watchingNow}
          sub="active shows"
          color="text-accent-teal"
        />
        <StatCard
          icon={Tv2}
          label="Episodes Left"
          value={totalEps}
          sub="to watch"
          color="text-accent-purple"
        />
        <StatCard
          icon={CheckCircle}
          label="Finished"
          value={finished}
          sub="shows done"
          color="text-text-secondary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Watch Now card */}
        <div className="bg-bg-card border border-bg-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={18} className="text-accent-orange" />
            <h2 className="font-display font-semibold text-text-primary">Watch Now</h2>
          </div>

          {topService ? (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <ServiceIcon name={topService.service.name} size="lg" />
                <div>
                  <p className="font-display font-bold text-xl text-text-primary">
                    {topService.service.name}
                  </p>
                  <p className="text-sm text-text-secondary mt-0.5">{topService.reason}</p>
                </div>
              </div>

              {topService.shows.slice(0, 3).map(show => (
                <div key={show.id} className="flex items-center gap-3 py-2 border-t border-bg-border">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${show.status === 'watching' ? 'bg-accent-teal' : 'bg-bg-border'}`} />
                  <span className="text-sm text-text-primary flex-1 truncate">{show.title}</span>
                  {show.episodes_remaining > 0 && (
                    <span className="text-xs text-text-muted">{show.episodes_remaining} ep</span>
                  )}
                </div>
              ))}

              <button
                onClick={() => onNavigate('rotation')}
                className="mt-4 text-sm text-accent-orange hover:text-accent-orange-hover font-medium"
              >
                View full rotation plan →
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <Trophy size={32} className="mx-auto text-text-muted mb-3" />
              <p className="text-text-secondary text-sm">Add services and shows to get your rotation plan</p>
              <button
                onClick={() => onNavigate('services')}
                className="mt-3 text-sm text-accent-orange hover:underline"
              >
                Add a service →
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Upcoming billing */}
          <div className="bg-bg-card border border-bg-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-accent-orange" />
                <h3 className="font-display font-semibold text-text-primary text-sm">Upcoming Billing</h3>
              </div>
              <button onClick={() => onNavigate('reminders')} className="text-xs text-text-muted hover:text-text-secondary">
                View all
              </button>
            </div>

            {upcomingBilling.length > 0 ? (
              <div className="space-y-2">
                {upcomingBilling.map(({ service, days }) => {
                  const urgency = getBillingUrgency(days);
                  return (
                    <div key={service.id} className="flex items-center gap-3 py-1.5">
                      <ServiceIcon name={service.name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-primary truncate">{service.name}</p>
                        <p className="text-xs text-text-muted">${service.cost_monthly}/mo</p>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${
                        urgency === 'urgent' ? 'bg-red-900/30 text-red-400' :
                        urgency === 'soon' ? 'bg-yellow-900/30 text-yellow-400' :
                        'bg-bg-hover text-text-muted'
                      }`}>
                        {days}d
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-text-muted py-2">No bills due in the next 14 days</p>
            )}
          </div>

          {/* Upcoming episodes */}
          {upcomingEps.length > 0 && (
            <div className="bg-bg-card border border-bg-border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Clock size={16} className="text-accent-teal" />
                <h3 className="font-display font-semibold text-text-primary text-sm">New Episodes Soon</h3>
              </div>
              <div className="space-y-2">
                {upcomingEps.map(show => (
                  <div key={show.id} className="flex items-center gap-3 py-1">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary truncate">{show.title}</p>
                      <p className="text-xs text-text-muted">
                        {new Date(show.next_air_date!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* All services quick view */}
      {services.length > 0 && (
        <div className="bg-bg-card border border-bg-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-text-primary">Your Services</h3>
            <button onClick={() => onNavigate('services')} className="text-xs text-text-muted hover:text-accent-orange">
              Manage →
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            {services.filter(s => s.active).map(service => (
              <div key={service.id} className="flex items-center gap-2 px-3 py-2 bg-bg-hover rounded-xl border border-bg-border">
                <ServiceIcon name={service.name} size="sm" />
                <div>
                  <p className="text-sm font-medium text-text-primary">{service.name}</p>
                  {service.is_free ? (
                    <p className="text-xs text-accent-teal">Free</p>
                  ) : (
                    <p className="text-xs text-text-muted">${service.cost_monthly}/mo</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
