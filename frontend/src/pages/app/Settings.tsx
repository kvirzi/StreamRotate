import { useState } from 'react';
import { Settings as SettingsIcon, CreditCard, User, Bell, ExternalLink } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { stripeApi } from '../../lib/api';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

interface SettingsPageProps {
  userEmail?: string;
  plan: 'free' | 'pro';
  onUpgrade: () => void;
}

export function SettingsPage({ userEmail, plan, onUpgrade }: SettingsPageProps) {
  const [portalLoading, setPortalLoading] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const handleManageBilling = async () => {
    setPortalLoading(true);
    try {
      const { data } = await stripeApi.portal();
      window.location.href = data.url;
    } catch {
      alert('Unable to open billing portal. Please try again.');
    } finally {
      setPortalLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');
    if (!passwordForm.next) { setPasswordError('New password is required'); return; }
    if (passwordForm.next !== passwordForm.confirm) { setPasswordError('Passwords do not match'); return; }
    if (passwordForm.next.length < 8) { setPasswordError('Password must be at least 8 characters'); return; }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordForm.next });
      if (error) { setPasswordError(error.message); return; }
      setPasswordSuccess('Password updated successfully');
      setPasswordForm({ current: '', next: '', confirm: '' });
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6 fade-in max-w-2xl">
      <div>
        <h1 className="font-display font-bold text-2xl text-text-primary">Settings</h1>
        <p className="text-text-muted text-sm mt-0.5">Manage your account and preferences</p>
      </div>

      {/* Account */}
      <div className="bg-bg-card border border-bg-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <User size={16} className="text-accent-orange" />
          <h2 className="font-display font-semibold text-text-primary">Account</h2>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-text-muted uppercase tracking-wide">Email</label>
            <p className="text-sm text-text-primary mt-1">{userEmail}</p>
          </div>
          <div>
            <label className="text-xs text-text-muted uppercase tracking-wide">Plan</label>
            <div className="flex items-center gap-2 mt-1">
              <span className={`badge ${plan === 'pro' ? 'bg-accent-purple/20 text-accent-purple border border-accent-purple/30' : 'bg-bg-hover text-text-secondary'}`}>
                {plan === 'pro' ? 'Pro' : 'Free'}
              </span>
              {plan === 'free' && (
                <button onClick={onUpgrade} className="text-sm text-accent-orange hover:underline">
                  Upgrade to Pro →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="bg-bg-card border border-bg-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <SettingsIcon size={16} className="text-accent-teal" />
          <h2 className="font-display font-semibold text-text-primary">Change Password</h2>
        </div>
        <div className="space-y-3">
          <Input
            label="New Password"
            type="password"
            value={passwordForm.next}
            onChange={e => setPasswordForm(f => ({ ...f, next: e.target.value }))}
            placeholder="Min. 8 characters"
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={passwordForm.confirm}
            onChange={e => setPasswordForm(f => ({ ...f, confirm: e.target.value }))}
            placeholder="Repeat new password"
          />
          {passwordError && <p className="text-sm text-red-400">{passwordError}</p>}
          {passwordSuccess && <p className="text-sm text-accent-teal">{passwordSuccess}</p>}
          <Button onClick={handleChangePassword} loading={changingPassword} variant="secondary">
            Update Password
          </Button>
        </div>
      </div>

      {/* Billing */}
      {plan === 'pro' && (
        <div className="bg-bg-card border border-bg-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={16} className="text-accent-purple" />
            <h2 className="font-display font-semibold text-text-primary">Billing</h2>
          </div>
          <p className="text-sm text-text-secondary mb-4">
            Manage your Pro subscription, update payment method, or cancel anytime.
          </p>
          <Button onClick={handleManageBilling} loading={portalLoading} variant="secondary" className="gap-2">
            <ExternalLink size={14} />
            Manage Billing
          </Button>
        </div>
      )}

      {/* Upgrade CTA */}
      {plan === 'free' && (
        <div className="bg-gradient-to-br from-accent-orange/10 to-accent-purple/10 border border-accent-orange/20 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard size={16} className="text-accent-orange" />
            <h2 className="font-display font-semibold text-text-primary">Upgrade to Pro</h2>
          </div>
          <p className="text-sm text-text-secondary mb-4">
            Unlock unlimited services, AI suggestions, episode tracking, trailer previews, and more.
          </p>
          <Button onClick={onUpgrade} className="gap-2">
            Upgrade — $3/mo or $20/yr
          </Button>
        </div>
      )}

      {/* About */}
      <div className="bg-bg-card border border-bg-border rounded-2xl p-5">
        <h2 className="font-display font-semibold text-text-primary mb-3 text-sm">About StreamRotate</h2>
        <div className="space-y-1.5 text-xs text-text-muted">
          <p>Version 1.0.0</p>
          <p>Built to help you watch smarter and cancel on time.</p>
          <p className="mt-2">
            Show data powered by{' '}
            <a
              href="https://www.themoviedb.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-teal hover:underline"
            >
              TMDB
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
