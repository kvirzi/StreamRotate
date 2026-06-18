import { useState } from 'react';
import { Settings as SettingsIcon, CreditCard, User, ExternalLink, Trash2, RotateCcw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { stripeApi } from '../../lib/api';
import { restorePurchases } from '../../lib/iap';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';

interface SettingsPageProps {
  userEmail?: string;
  plan: 'free' | 'pro';
  onUpgrade: () => void;
  onPlanChange?: (plan: 'free' | 'pro') => void;
}

export function SettingsPage({ userEmail, plan, onUpgrade, onPlanChange }: SettingsPageProps) {
  const [portalLoading, setPortalLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        await fetch(`${import.meta.env.VITE_API_URL}/api/account`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
      }
      await supabase.auth.signOut();
      navigate('/');
    } catch {
      alert('Failed to delete account. Please contact support.');
    } finally {
      setDeleting(false);
    }
  };

  const handleManageBilling = async () => {
    if (Capacitor.isNativePlatform()) {
      // On iOS, subscriptions are managed in the OS Settings app
      window.open('https://apps.apple.com/account/subscriptions', '_blank');
      return;
    }
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

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const isPro = await restorePurchases();
      if (isPro) {
        onPlanChange?.('pro');
        alert('Purchase restored! You now have Pro access.');
      } else {
        alert('No active Pro subscription found.');
      }
    } catch {
      alert('Restore failed. Please try again.');
    } finally {
      setRestoring(false);
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
            {Capacitor.isNativePlatform()
              ? 'Manage your subscription in iOS Settings → Apple ID → Subscriptions.'
              : 'Manage your Pro subscription, update payment method, or cancel anytime.'}
          </p>
          <Button onClick={handleManageBilling} loading={portalLoading} variant="secondary" className="gap-2">
            <ExternalLink size={14} />
            {Capacitor.isNativePlatform() ? 'View Subscriptions' : 'Manage Billing'}
          </Button>
        </div>
      )}

      {/* Restore Purchases (iOS only) */}
      {Capacitor.isNativePlatform() && plan === 'free' && (
        <div className="bg-bg-card border border-bg-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <RotateCcw size={16} className="text-accent-teal" />
            <h2 className="font-display font-semibold text-text-primary">Restore Purchases</h2>
          </div>
          <p className="text-sm text-text-muted mb-4">Already subscribed? Restore your Pro access.</p>
          <Button onClick={handleRestore} loading={restoring} variant="secondary">
            Restore Purchases
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
            <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer" className="text-accent-teal hover:underline">
              TMDB
            </a>
          </p>
          <p className="mt-1">
            <a href="https://streamrotate.com/privacy" target="_blank" rel="noopener noreferrer" className="text-accent-teal hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>

      {/* Delete Account */}
      <div className="bg-bg-card border border-red-900/30 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <Trash2 size={16} className="text-red-400" />
          <h2 className="font-display font-semibold text-red-400">Delete Account</h2>
        </div>
        <p className="text-sm text-text-muted mb-4">Permanently delete your account and all associated data. This cannot be undone.</p>
        <Button variant="danger" onClick={() => setDeleteConfirm(true)}>Delete My Account</Button>
      </div>

      <Modal open={deleteConfirm} onClose={() => setDeleteConfirm(false)} title="Delete Account" size="sm">
        <p className="text-text-secondary text-sm mb-2">This will permanently delete your account and all your data including services, shows, and billing history.</p>
        <p className="text-red-400 text-sm font-medium mb-5">This action cannot be undone.</p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setDeleteConfirm(false)} className="flex-1">Cancel</Button>
          <Button variant="danger" onClick={handleDeleteAccount} loading={deleting} className="flex-1">Delete Forever</Button>
        </div>
      </Modal>
    </div>
  );
}
