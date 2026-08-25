import { useState } from 'react';
import { MessageSquarePlus, Lightbulb, Bug, MessageCircle, CheckCircle } from 'lucide-react';
import { accountApi } from '../../lib/api';
import { Button } from '../../components/Button';

type Category = 'Idea' | 'Bug' | 'Other';

const CATEGORIES: { id: Category; label: string; icon: typeof Lightbulb; hint: string }[] = [
  { id: 'Idea', label: 'Idea / Suggestion', icon: Lightbulb, hint: 'A feature or improvement you’d love to see' },
  { id: 'Bug', label: 'Bug', icon: Bug, hint: 'Something isn’t working right' },
  { id: 'Other', label: 'Other', icon: MessageCircle, hint: 'Anything else on your mind' },
];

export function Feedback() {
  const [category, setCategory] = useState<Category>('Idea');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (message.trim().length < 3) return;
    setSending(true);
    setError('');
    try {
      await accountApi.sendFeedback(category, message.trim());
      setSent(true);
    } catch {
      setError('Couldn’t send that — please try again in a moment.');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="space-y-6 fade-in">
        <div className="text-center py-16 bg-bg-card border border-bg-border rounded-2xl">
          <CheckCircle size={44} className="mx-auto text-accent-teal mb-4" />
          <h2 className="font-display font-semibold text-text-primary mb-2">Thanks — got it!</h2>
          <p className="text-text-muted text-sm max-w-sm mx-auto">
            Your {category.toLowerCase()} landed in my inbox. I read every one of these — it genuinely
            shapes what gets built next.
          </p>
          <Button
            className="mt-6"
            variant="secondary"
            onClick={() => { setSent(false); setMessage(''); setCategory('Idea'); }}
          >
            Send another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="font-display font-bold text-2xl text-text-primary flex items-center gap-2">
          <MessageSquarePlus size={22} className="text-accent-orange" />
          Feedback
        </h1>
        <p className="text-text-muted text-sm mt-0.5">
          Ideas, suggestions, and bugs come straight to me. Tell me what would make StreamRotate better.
        </p>
      </div>

      <div className="bg-bg-card border border-bg-border rounded-2xl p-5 space-y-5">
        {/* Category */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {CATEGORIES.map(({ id, label, icon: Icon, hint }) => {
            const active = category === id;
            return (
              <button
                key={id}
                onClick={() => setCategory(id)}
                className={`text-left p-3 rounded-xl border transition-all ${
                  active
                    ? 'bg-accent-orange/15 border-accent-orange/30'
                    : 'bg-bg-hover border-bg-border hover:border-text-muted/40'
                }`}
              >
                <Icon size={18} className={active ? 'text-accent-orange' : 'text-text-muted'} />
                <div className={`text-sm font-medium mt-1.5 ${active ? 'text-accent-orange' : 'text-text-primary'}`}>{label}</div>
                <div className="text-xs text-text-muted mt-0.5">{hint}</div>
              </button>
            );
          })}
        </div>

        {/* Message */}
        <div>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={6}
            maxLength={5000}
            placeholder={
              category === 'Bug'
                ? 'What happened, and what did you expect? Steps to reproduce help a lot.'
                : category === 'Idea'
                ? 'What would you like to see? The more detail, the better.'
                : 'What’s on your mind?'
            }
            className="w-full bg-bg-hover border border-bg-border rounded-xl p-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-orange/50 resize-none"
          />
          <div className="text-xs text-text-muted text-right mt-1">{message.length}/5000</div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button
          onClick={submit}
          loading={sending}
          disabled={message.trim().length < 3}
          className="w-full sm:w-auto"
        >
          Send feedback
        </Button>
      </div>
    </div>
  );
}
