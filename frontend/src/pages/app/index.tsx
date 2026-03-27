import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Sidebar, type AppPage } from '../../components/Sidebar';
import { Dashboard } from './Dashboard';
import { Services } from './Services';
import { Shows } from './Shows';
import { RotationPlan } from './RotationPlan';
import { Suggestions } from './Suggestions';
import { Reminders } from './Reminders';
import { SettingsPage } from './Settings';
import { SupportUs } from './SupportUs';
import { useAuth } from '../../hooks/useAuth';
import { useServices, useShows } from '../../hooks/useData';
import { FullPageSpinner } from '../../components/Spinner';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';
import { stripeApi } from '../../lib/api';
import { showsApi } from '../../lib/api';
import { tmdbApi } from '../../lib/api';

export function AppPage() {
  const [page, setPage] = useState<AppPage>('dashboard');
  const [upgradeModal, setUpgradeModal] = useState(false);
  const [upgradePlan, setUpgradePlan] = useState<'monthly' | 'annual'>('monthly');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [addShowModal, setAddShowModal] = useState<{ title: string; tmdbId?: number } | null>(null);
  const [plan, setPlan] = useState<'free' | 'pro'>('free');

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { services, loading: servicesLoading, refresh: refreshServices } = useServices();
  const { shows, loading: showsLoading, refresh: refreshShows } = useShows();

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (searchParams.get('upgraded') === 'true') {
      setPlan('pro');
      setPage('dashboard');
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      // Check plan from user metadata or app_metadata
      const userPlan = (user.app_metadata?.plan || user.user_metadata?.plan || 'free') as 'free' | 'pro';
      setPlan(userPlan);
    }
  }, [user]);

  const handleUpgrade = async () => {
    setCheckoutLoading(true);
    try {
      const { data } = await stripeApi.checkout(upgradePlan);
      window.location.href = data.url;
    } catch {
      alert('Unable to start checkout. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleAddShowFromSuggestion = async (title: string, tmdbId?: number) => {
    try {
      let payload: Record<string, unknown> = { title, status: 'queued' };
      if (tmdbId) {
        try {
          const { data } = await tmdbApi.getShow(tmdbId);
          payload = {
            ...payload,
            tmdb_id: tmdbId,
            total_seasons: data.number_of_seasons,
          };
        } catch { /* ignore */ }
      }
      await showsApi.create(payload);
      await refreshShows();
    } catch { /* ignore */ }
  };

  if (authLoading || servicesLoading || showsLoading) return <FullPageSpinner />;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-bg-primary flex">
      <Sidebar
        currentPage={page}
        onPageChange={setPage}
        userEmail={user.email}
        plan={plan}
      />

      {/* Main content */}
      <main className="flex-1 md:ml-60 p-4 md:p-8 min-h-screen">
        <div className="max-w-6xl mx-auto">
          {page === 'dashboard' && (
            <Dashboard
              services={services}
              shows={shows}
              onNavigate={setPage as (page: string) => void}
            />
          )}
          {page === 'services' && (
            <Services
              services={services}
              shows={shows}
              onRefresh={refreshServices}
              plan={plan}
            />
          )}
          {page === 'shows' && (
            <Shows
              shows={shows}
              services={services}
              onRefresh={refreshShows}
              plan={plan}
            />
          )}
          {page === 'rotation' && (
            <RotationPlan
              services={services}
              shows={shows}
              onNavigate={setPage as (page: string) => void}
            />
          )}
          {page === 'suggestions' && (
            <Suggestions
              plan={plan}
              onUpgrade={() => setUpgradeModal(true)}
              onAddShow={handleAddShowFromSuggestion}
            />
          )}
          {page === 'reminders' && (
            <Reminders services={services} />
          )}
          {page === 'settings' && (
            <SettingsPage
              userEmail={user.email}
              plan={plan}
              onUpgrade={() => setUpgradeModal(true)}
            />
          )}
          {page === 'support' && <SupportUs />}
        </div>
      </main>

      {/* Upgrade modal */}
      <Modal
        open={upgradeModal}
        onClose={() => setUpgradeModal(false)}
        title="Upgrade to Pro"
        size="sm"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            {[
              'Unlimited streaming services',
              'AI-powered show suggestions',
              'Episode-by-episode tracking',
              'Season switcher',
              'Trailer previews',
              'TMDB auto-search',
            ].map(feature => (
              <div key={feature} className="flex items-center gap-2 text-sm text-text-secondary">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-orange flex-shrink-0" />
                {feature}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => setUpgradePlan('monthly')}
              className={`p-3 rounded-xl border text-center transition-colors ${
                upgradePlan === 'monthly'
                  ? 'border-accent-orange bg-accent-orange/10'
                  : 'border-bg-border hover:border-bg-border/80'
              }`}
            >
              <p className="font-display font-bold text-text-primary">$3/mo</p>
              <p className="text-xs text-text-muted mt-0.5">Monthly</p>
            </button>
            <button
              onClick={() => setUpgradePlan('annual')}
              className={`p-3 rounded-xl border text-center transition-colors relative ${
                upgradePlan === 'annual'
                  ? 'border-accent-orange bg-accent-orange/10'
                  : 'border-bg-border hover:border-bg-border/80'
              }`}
            >
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                <span className="badge bg-accent-teal/20 text-accent-teal border border-accent-teal/30 text-[10px]">
                  Save 44%
                </span>
              </div>
              <p className="font-display font-bold text-text-primary">$20/yr</p>
              <p className="text-xs text-text-muted mt-0.5">Annual</p>
            </button>
          </div>

          <Button
            onClick={handleUpgrade}
            loading={checkoutLoading}
            fullWidth
            className="mt-2"
          >
            Upgrade Now
          </Button>
          <p className="text-xs text-center text-text-muted">Cancel anytime. No commitments.</p>
        </div>
      </Modal>
    </div>
  );
}
