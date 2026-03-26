import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  Tv2, RotateCcw, Bell, Sparkles, Check, ArrowRight,
  DollarSign, List, Zap, Play
} from 'lucide-react';
import { waitlistApi } from '../lib/api';
import { Logo } from '../components/Logo';
import { Button } from '../components/Button';

export function Landing() {
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistMessage, setWaitlistMessage] = useState('');

  const handleWaitlist = async (e: FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail.trim()) return;
    setWaitlistLoading(true);
    try {
      const { data } = await waitlistApi.join(waitlistEmail);
      setWaitlistMessage(data.message || "You're on the list!");
      setWaitlistEmail('');
    } catch {
      setWaitlistMessage("You're already on the list!");
    } finally {
      setWaitlistLoading(false);
    }
  };

  const FREE_FEATURES = [
    'Track up to 2 streaming services',
    'Basic rotation plan',
    'Billing reminders',
    'Manual show tracking',
    'Cancel links',
  ];

  const PRO_FEATURES = [
    'Unlimited streaming services',
    'AI-powered suggestions (Claude)',
    'Episode-by-episode tracking',
    'Season switcher',
    'Trailer previews',
    'TMDB auto-search',
    'Priority support',
  ];

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary font-body">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-bg-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Sign in
            </Link>
            <Link to="/signup">
              <Button size="sm">Get started free</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero-gradient pt-28 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-orange/10 border border-accent-orange/20 text-xs text-accent-orange font-medium mb-6">
            <Zap size={12} />
            Stop wasting money on unused streaming
          </div>

          <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl leading-tight mb-6">
            Stop paying for streaming<br />
            <span className="gradient-text">services you're not watching</span>
          </h1>

          <p className="text-text-secondary text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            StreamRotate tells you exactly which service to watch first based on
            billing dates and content remaining — so you always get your money's worth.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup">
              <Button size="lg" className="gap-2 pulse-glow">
                Start for free
                <ArrowRight size={16} />
              </Button>
            </Link>
            <Link to="/login" className="text-text-secondary hover:text-text-primary transition-colors text-sm font-medium">
              Already have an account? Sign in
            </Link>
          </div>

          {/* Social proof */}
          <p className="text-text-muted text-sm mt-8">
            Free tier available · No credit card required
          </p>
        </div>
      </section>

      {/* App preview / mock */}
      <section className="px-4 sm:px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-bg-card border border-bg-border rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <div className="ml-3 text-xs text-text-muted font-mono">streamrotate.app</div>
            </div>
            {/* Rotation preview */}
            <div className="space-y-3">
              {[
                { rank: 1, name: 'Netflix', days: 2, score: 70, reason: 'bills in 2 days · 5 episodes remaining', urgent: true },
                { rank: 2, name: 'Hulu', days: 8, score: 40, reason: 'bills in 8 days · 3 shows queued', urgent: false },
                { rank: 3, name: 'Disney+', days: 22, score: 30, reason: 'bills in 22 days · 2 shows queued', urgent: false },
                { rank: 4, name: 'YouTube', days: null, score: -40, reason: 'free service — no billing pressure', urgent: false },
              ].map(item => (
                <div
                  key={item.rank}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border ${
                    item.rank === 1 ? 'border-accent-orange/40 bg-accent-orange/5' : 'border-bg-border bg-bg-hover'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    item.rank === 1 ? 'bg-accent-orange text-white' : 'bg-bg-secondary text-text-muted'
                  }`}>
                    {item.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-text-primary">{item.name}</span>
                      {item.rank === 1 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-accent-orange/20 text-accent-orange uppercase tracking-wide">
                          Watch First
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-muted">{item.reason}</p>
                  </div>
                  {item.days !== null && (
                    <div className={`text-center px-2.5 py-1 rounded-lg flex-shrink-0 ${
                      item.urgent ? 'bg-red-900/20' : 'bg-bg-secondary'
                    }`}>
                      <p className={`text-sm font-bold ${item.urgent ? 'text-red-400' : 'text-text-primary'}`}>{item.days}d</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-text-primary mb-3">
              How it works
            </h2>
            <p className="text-text-secondary">Get set up in minutes. Save money from day one.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                icon: Tv2,
                title: 'Add your services',
                desc: 'Enter your streaming subscriptions with monthly cost and billing date',
              },
              {
                step: '02',
                icon: List,
                title: 'Track your shows',
                desc: 'Add the shows you want to watch and how many episodes are left',
              },
              {
                step: '03',
                icon: RotateCcw,
                title: 'Get your rotation',
                desc: 'See which service to watch first, ranked by billing urgency and content',
              },
              {
                step: '04',
                icon: Bell,
                title: 'Cancel on time',
                desc: 'Get reminders before billing dates so you never pay for a service you\'re done with',
              },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="bg-bg-card border border-bg-border rounded-2xl p-5 card-hover">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold text-accent-orange font-mono">{step}</span>
                  <div className="h-px flex-1 bg-bg-border" />
                </div>
                <div className="w-10 h-10 bg-accent-orange/10 rounded-xl flex items-center justify-center mb-3">
                  <Icon size={20} className="text-accent-orange" />
                </div>
                <h3 className="font-display font-semibold text-text-primary mb-1.5">{title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6 bg-bg-secondary">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-text-primary mb-3">
              Everything you need
            </h2>
            <p className="text-text-secondary">Built for people who subscribe to too many streaming services</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: RotateCcw,
                title: 'Smart Rotation',
                desc: 'Algorithm-driven priority order based on billing urgency and content remaining',
                color: 'text-accent-orange',
                bg: 'bg-accent-orange/10',
                free: true,
              },
              {
                icon: Bell,
                title: 'Billing Reminders',
                desc: 'Never get surprised by a charge again. See exactly when each service bills',
                color: 'text-accent-teal',
                bg: 'bg-accent-teal/10',
                free: true,
              },
              {
                icon: Sparkles,
                title: 'AI Suggestions',
                desc: 'Claude analyzes your watchlist and recommends shows you\'ll actually like',
                color: 'text-accent-purple',
                bg: 'bg-accent-purple/10',
                free: false,
              },
              {
                icon: List,
                title: 'Episode Tracking',
                desc: 'Check off episodes as you watch. See your progress per season',
                color: 'text-accent-purple',
                bg: 'bg-accent-purple/10',
                free: false,
              },
              {
                icon: Play,
                title: 'Trailer Previews',
                desc: 'Watch trailers inline when browsing AI suggestions — no tab switching',
                color: 'text-accent-teal',
                bg: 'bg-accent-teal/10',
                free: false,
              },
              {
                icon: DollarSign,
                title: 'Cost Tracking',
                desc: 'See your total monthly streaming spend at a glance. Own your budget',
                color: 'text-accent-orange',
                bg: 'bg-accent-orange/10',
                free: true,
              },
            ].map(({ icon: Icon, title, desc, color, bg, free }) => (
              <div key={title} className="bg-bg-card border border-bg-border rounded-2xl p-5 card-hover">
                <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                  <Icon size={20} className={color} />
                </div>
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="font-display font-semibold text-text-primary">{title}</h3>
                  {free ? (
                    <span className="badge bg-accent-teal/15 text-accent-teal border border-accent-teal/20 text-[10px]">Free</span>
                  ) : (
                    <span className="badge bg-accent-purple/15 text-accent-purple border border-accent-purple/20 text-[10px]">Pro</span>
                  )}
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-text-primary mb-3">
              Simple pricing
            </h2>
            <p className="text-text-secondary">Start free. Upgrade when you need more.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Free */}
            <div className="bg-bg-card border border-bg-border rounded-2xl p-6">
              <div className="mb-4">
                <h3 className="font-display font-bold text-xl text-text-primary">Free</h3>
                <p className="text-4xl font-display font-bold text-text-primary mt-1">
                  $0<span className="text-lg text-text-muted font-normal">/mo</span>
                </p>
                <p className="text-sm text-text-muted mt-1">Forever free, no credit card</p>
              </div>
              <div className="space-y-2.5 mb-6">
                {FREE_FEATURES.map(f => (
                  <div key={f} className="flex items-center gap-2.5 text-sm text-text-secondary">
                    <Check size={14} className="text-accent-teal flex-shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
              <Link to="/signup">
                <Button variant="secondary" fullWidth>Get started free</Button>
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-gradient-to-br from-accent-orange/5 to-accent-purple/5 border border-accent-orange/30 rounded-2xl p-6 relative">
              <div className="absolute -top-3 right-4">
                <span className="badge bg-accent-orange text-white border-0 shadow-lg">Most Popular</span>
              </div>
              <div className="mb-4">
                <h3 className="font-display font-bold text-xl text-text-primary">Pro</h3>
                <p className="text-4xl font-display font-bold text-text-primary mt-1">
                  $3<span className="text-lg text-text-muted font-normal">/mo</span>
                </p>
                <p className="text-sm text-text-muted mt-1">or $20/yr (save 44%)</p>
              </div>
              <div className="space-y-2.5 mb-6">
                {PRO_FEATURES.map(f => (
                  <div key={f} className="flex items-center gap-2.5 text-sm text-text-secondary">
                    <Check size={14} className="text-accent-orange flex-shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
              <Link to="/signup">
                <Button fullWidth className="gap-2">
                  <Sparkles size={14} />
                  Start with Pro
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Waitlist */}
      <section className="py-20 px-4 sm:px-6 bg-bg-secondary">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="font-display font-bold text-3xl text-text-primary mb-3">
            Stay in the loop
          </h2>
          <p className="text-text-secondary mb-8">
            Get notified about new features and updates
          </p>

          {waitlistMessage ? (
            <div className="bg-accent-teal/10 border border-accent-teal/30 rounded-xl p-4 text-accent-teal text-sm font-medium">
              {waitlistMessage}
            </div>
          ) : (
            <form onSubmit={handleWaitlist} className="flex gap-3 max-w-sm mx-auto">
              <input
                type="email"
                value={waitlistEmail}
                onChange={e => setWaitlistEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="flex-1 px-4 py-2.5 bg-bg-card border border-bg-border rounded-xl text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-accent-orange/60 transition-colors"
              />
              <Button type="submit" loading={waitlistLoading}>
                Join
              </Button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 border-t border-bg-border">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <div className="flex items-center gap-6 text-sm text-text-muted">
            <Link to="/login" className="hover:text-text-secondary transition-colors">Sign in</Link>
            <Link to="/signup" className="hover:text-text-secondary transition-colors">Sign up</Link>
          </div>
          <p className="text-xs text-text-muted">
            © {new Date().getFullYear()} StreamRotate · Made with ♥
          </p>
        </div>
      </footer>
    </div>
  );
}
