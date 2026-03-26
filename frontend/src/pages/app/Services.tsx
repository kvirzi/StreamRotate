import { useState } from 'react';
import { Plus, Edit2, Trash2, ExternalLink, Calendar, DollarSign, Wifi } from 'lucide-react';
import { Service, Show } from '../../types';
import { servicesApi } from '../../lib/api';
import { ServiceIcon } from '../../components/ServiceIcon';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { getDaysUntilBilling, getBillingUrgency } from '../../lib/rotation';

interface ServicesProps {
  services: Service[];
  shows: Show[];
  onRefresh: () => void;
  plan: 'free' | 'pro';
}

interface ServiceFormData {
  name: string;
  cost_monthly: string;
  billing_date: string;
  is_free: boolean;
  cancel_url: string;
}

const EMPTY_FORM: ServiceFormData = {
  name: '',
  cost_monthly: '',
  billing_date: '',
  is_free: false,
  cancel_url: '',
};

const POPULAR_SERVICES = [
  'Netflix', 'Hulu', 'Disney+', 'Max', 'Amazon Prime', 'Apple TV+',
  'Peacock', 'Paramount+', 'Crunchyroll', 'YouTube TV',
];

export function Services({ services, shows, onRefresh, plan }: ServicesProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [form, setForm] = useState<ServiceFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const FREE_LIMIT = 2;
  const atLimit = plan === 'free' && services.length >= FREE_LIMIT;

  const openAdd = () => {
    setEditingService(null);
    setForm(EMPTY_FORM);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (service: Service) => {
    setEditingService(service);
    setForm({
      name: service.name,
      cost_monthly: service.cost_monthly?.toString() || '',
      billing_date: service.billing_date?.toString() || '',
      is_free: service.is_free,
      cancel_url: service.cancel_url || '',
    });
    setError('');
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('Service name is required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name.trim(),
        cost_monthly: form.is_free ? 0 : parseFloat(form.cost_monthly) || 0,
        billing_date: form.billing_date ? parseInt(form.billing_date) : null,
        is_free: form.is_free,
        cancel_url: form.cancel_url.trim() || null,
      };
      if (editingService) {
        await servicesApi.update(editingService.id, payload);
      } else {
        await servicesApi.create(payload);
      }
      await onRefresh();
      setModalOpen(false);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error || 'Failed to save service');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await servicesApi.delete(id);
      await onRefresh();
      setDeleteConfirm(null);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-text-primary">My Services</h1>
          <p className="text-text-muted text-sm mt-0.5">
            {services.length} service{services.length !== 1 ? 's' : ''}
            {plan === 'free' && ` · ${FREE_LIMIT - services.length} remaining on free plan`}
          </p>
        </div>
        <Button
          onClick={openAdd}
          disabled={atLimit}
          className="gap-2"
        >
          <Plus size={16} />
          Add Service
        </Button>
      </div>

      {atLimit && plan === 'free' && (
        <div className="bg-accent-purple/10 border border-accent-purple/30 rounded-xl p-4 flex items-center gap-3">
          <Wifi size={16} className="text-accent-purple flex-shrink-0" />
          <p className="text-sm text-accent-purple">
            Free plan is limited to {FREE_LIMIT} services. <strong>Upgrade to Pro</strong> for unlimited services.
          </p>
        </div>
      )}

      {services.length === 0 ? (
        <div className="text-center py-16 bg-bg-card border border-bg-border rounded-2xl">
          <Wifi size={40} className="mx-auto text-text-muted mb-4" />
          <h3 className="font-display font-semibold text-text-primary mb-2">No services yet</h3>
          <p className="text-text-muted text-sm mb-4">Add your streaming subscriptions to get started</p>
          <Button onClick={openAdd}>
            <Plus size={16} />
            Add your first service
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {services.map(service => {
            const serviceShows = shows.filter(s => s.service_id === service.id);
            const activeShows = serviceShows.filter(s => s.status !== 'done');
            const days = getDaysUntilBilling(service.billing_date);
            const urgency = getBillingUrgency(days);

            const progress = serviceShows.length > 0
              ? Math.round((serviceShows.filter(s => s.status === 'done').length / serviceShows.length) * 100)
              : 0;

            return (
              <div
                key={service.id}
                className="bg-bg-card border border-bg-border rounded-2xl p-5 card-hover group"
              >
                {/* Header */}
                <div className="flex items-start gap-3 mb-4">
                  <ServiceIcon name={service.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-semibold text-text-primary truncate">{service.name}</h3>
                    {service.is_free ? (
                      <span className="text-xs font-semibold text-accent-teal">Free</span>
                    ) : (
                      <span className="text-sm text-text-muted">${service.cost_monthly}/mo</span>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(service)}
                      className="p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-hover rounded-lg"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(service.id)}
                      className="p-1.5 text-text-muted hover:text-red-400 hover:bg-red-900/10 rounded-lg"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-bg-hover rounded-xl p-2.5 text-center">
                    <p className="text-lg font-bold text-text-primary">{activeShows.length}</p>
                    <p className="text-xs text-text-muted">shows</p>
                  </div>
                  <div className="bg-bg-hover rounded-xl p-2.5 text-center">
                    {!service.is_free && days !== null ? (
                      <>
                        <p className={`text-lg font-bold ${
                          urgency === 'urgent' ? 'text-red-400' :
                          urgency === 'soon' ? 'text-yellow-400' : 'text-text-primary'
                        }`}>{days}d</p>
                        <p className="text-xs text-text-muted">billing</p>
                      </>
                    ) : (
                      <>
                        <p className="text-lg font-bold text-accent-teal">∞</p>
                        <p className="text-xs text-text-muted">free</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                {serviceShows.length > 0 && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-text-muted mb-1">
                      <span>Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-bar-fill bg-accent-teal"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Billing info */}
                {!service.is_free && service.billing_date && (
                  <div className={`flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-lg mb-3 ${
                    urgency === 'urgent' ? 'bg-red-900/20 text-red-400' :
                    urgency === 'soon' ? 'bg-yellow-900/20 text-yellow-400' :
                    'bg-bg-hover text-text-muted'
                  }`}>
                    <Calendar size={12} />
                    <span>Bills on the {service.billing_date}{['st','nd','rd'][((service.billing_date % 100) - 11) % 10 < 3 ? 0 : (service.billing_date % 10) - 1] || 'th'} · {days}d away</span>
                  </div>
                )}

                {/* Cancel link */}
                {service.cancel_url && (
                  <a
                    href={service.cancel_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-text-muted hover:text-accent-orange transition-colors"
                  >
                    <ExternalLink size={12} />
                    Cancel subscription
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingService ? 'Edit Service' : 'Add Service'}
      >
        <div className="space-y-4">
          {/* Quick select popular services */}
          {!editingService && (
            <div>
              <p className="text-xs text-text-muted mb-2">Popular services</p>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_SERVICES.map(name => (
                  <button
                    key={name}
                    onClick={() => setForm(f => ({ ...f, name }))}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                      form.name === name
                        ? 'border-accent-orange/60 bg-accent-orange/10 text-accent-orange'
                        : 'border-bg-border text-text-muted hover:border-bg-border/80 hover:text-text-secondary'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Input
            label="Service Name"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Netflix"
          />

          <label className="flex items-center gap-2.5 cursor-pointer">
            <div
              onClick={() => setForm(f => ({ ...f, is_free: !f.is_free }))}
              className={`w-10 h-5 rounded-full transition-colors relative ${form.is_free ? 'bg-accent-teal' : 'bg-bg-border'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_free ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm text-text-secondary">Free service (no billing)</span>
          </label>

          {!form.is_free && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Monthly Cost ($)"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.cost_monthly}
                  onChange={e => setForm(f => ({ ...f, cost_monthly: e.target.value }))}
                  placeholder="15.99"
                />
                <Input
                  label="Billing Day (1-31)"
                  type="number"
                  min="1"
                  max="31"
                  value={form.billing_date}
                  onChange={e => setForm(f => ({ ...f, billing_date: e.target.value }))}
                  placeholder="15"
                />
              </div>
            </>
          )}

          <Input
            label="Cancel URL (optional)"
            type="url"
            value={form.cancel_url}
            onChange={e => setForm(f => ({ ...f, cancel_url: e.target.value }))}
            placeholder="https://..."
            hint="Direct link to cancel this subscription"
          />

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving} className="flex-1">
              {editingService ? 'Save Changes' : 'Add Service'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Service"
        size="sm"
      >
        <p className="text-text-secondary text-sm mb-5">
          Are you sure? This will also delete all shows associated with this service.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            className="flex-1"
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
