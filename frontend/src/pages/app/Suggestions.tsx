import { useState } from 'react';
import { Sparkles, Plus, X, RefreshCw, Play, Lock, Check, ThumbsDown } from 'lucide-react';
import { Suggestion } from '../../types';
import { suggestionsApi, tmdbApi } from '../../lib/api';
import { Button } from '../../components/Button';
import { Spinner } from '../../components/Spinner';

interface SuggestionsProps {
  plan: 'free' | 'pro';
  onUpgrade: () => void;
  onAddShow: (title: string, tmdbId?: number) => void;
}

export function Suggestions({ plan, onUpgrade, onAddShow }: SuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [replacing, setReplacing] = useState<number | null>(null);
  const [trailers, setTrailers] = useState<Record<number, string | null>>({});
  const [loadingTrailers, setLoadingTrailers] = useState<Set<number>>(new Set());
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const [adding, setAdding] = useState<Set<number>>(new Set());
  const [added, setAdded] = useState<Set<number>>(new Set());
  const [disliking, setDisliking] = useState<Set<number>>(new Set());
  const [error, setError] = useState('');

  const fetchSuggestions = async () => {
    setLoading(true);
    setError('');
    setDismissed(new Set());
    try {
      const { data } = await suggestionsApi.get();
      setSuggestions(data);
    } catch {
      setError('Failed to get suggestions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const replaceSuggestion = async (index: number) => {
    setReplacing(index);
    try {
      const { data } = await suggestionsApi.replace(suggestions, index);
      setSuggestions(prev => prev.map((s, i) => (i === index ? data.suggestion : s)));
    } catch { /* ignore */ }
    finally { setReplacing(null); }
  };

  const handleAdd = async (suggestion: Suggestion, index: number) => {
    const addingNext = new Set(adding);
    addingNext.add(index);
    setAdding(addingNext);
    try {
      await onAddShow(suggestion.title);
      // Show ✓ briefly, then replace the card
      setAdded(prev => new Set([...prev, index]));
      setTimeout(() => {
        setAdded(prev => { const s = new Set(prev); s.delete(index); return s; });
        replaceSuggestion(index);
      }, 800);
    } catch { /* ignore */ }
    finally {
      const addingNext2 = new Set(adding);
      addingNext2.delete(index);
      setAdding(addingNext2);
    }
  };

  const handleDislike = async (suggestion: Suggestion, index: number) => {
    const next = new Set(disliking);
    next.add(index);
    setDisliking(next);
    try {
      await suggestionsApi.dislike(suggestion.title);
      // Replace the card after a brief moment
      setTimeout(() => replaceSuggestion(index), 400);
    } catch { /* ignore */ }
    finally {
      const next2 = new Set(disliking);
      next2.delete(index);
      setDisliking(next2);
    }
  };

  const loadTrailer = async (suggestion: Suggestion, index: number) => {
    if (trailers[index] !== undefined) {
      // Toggle off
      setTrailers(prev => ({ ...prev, [index]: prev[index] ? null : prev[index] }));
      return;
    }
    const loadingNext = new Set(loadingTrailers);
    loadingNext.add(index);
    setLoadingTrailers(loadingNext);
    try {
      // Search TMDB for the show
      const { data: searchData } = await tmdbApi.search(suggestion.title);
      const show = searchData.results?.[0];
      if (show) {
        const { data: videoData } = await tmdbApi.getVideos(show.id);
        const trailer = videoData.results?.find(
          (v: { type: string; site: string; key: string }) => v.type === 'Trailer' && v.site === 'YouTube'
        );
        setTrailers(prev => ({ ...prev, [index]: trailer?.key || null }));
      } else {
        setTrailers(prev => ({ ...prev, [index]: null }));
      }
    } catch {
      setTrailers(prev => ({ ...prev, [index]: null }));
    } finally {
      const loadingNext2 = new Set(loadingTrailers);
      loadingNext2.delete(index);
      setLoadingTrailers(loadingNext2);
    }
  };

  if (plan !== 'pro') {
    return (
      <div className="fade-in">
        <div className="bg-bg-card border border-bg-border rounded-2xl p-8 text-center max-w-md mx-auto mt-8">
          <div className="w-16 h-16 bg-accent-purple/15 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock size={28} className="text-accent-purple" />
          </div>
          <h2 className="font-display font-bold text-xl text-text-primary mb-2">AI Suggestions</h2>
          <p className="text-text-secondary text-sm mb-6">
            Get personalized show recommendations powered by Claude AI, based on your current watchlist and services.
          </p>
          <Button onClick={onUpgrade} className="w-full gap-2" variant="primary">
            <Sparkles size={16} />
            Upgrade to Pro — $3/mo
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-text-primary">AI Suggestions</h1>
          <p className="text-text-muted text-sm mt-0.5">Personalized recommendations based on your watchlist</p>
        </div>
        <Button onClick={fetchSuggestions} loading={loading} className="gap-2">
          <Sparkles size={16} />
          {suggestions.length > 0 ? 'Refresh' : 'Get Suggestions'}
        </Button>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-900/30 rounded-xl p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-16">
          <Spinner className="w-8 h-8 text-accent-purple mx-auto mb-3" />
          <p className="text-text-secondary text-sm">Claude is analyzing your watchlist...</p>
        </div>
      )}

      {!loading && suggestions.length === 0 && !error && (
        <div className="text-center py-16 bg-bg-card border border-bg-border rounded-2xl">
          <div className="w-16 h-16 bg-accent-purple/15 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles size={28} className="text-accent-purple" />
          </div>
          <h3 className="font-display font-semibold text-text-primary mb-2">Ready for suggestions?</h3>
          <p className="text-text-muted text-sm mb-4">
            Claude will analyze your current shows and services to suggest what to watch next
          </p>
          <Button onClick={fetchSuggestions}>Get Suggestions</Button>
        </div>
      )}

      {!loading && suggestions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {suggestions.map((suggestion, index) => (
            !dismissed.has(index) && (
              <div key={index} className="bg-bg-card border border-bg-border rounded-2xl overflow-hidden card-hover">
                <div className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-semibold text-text-primary truncate">{suggestion.title}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-accent-orange">{suggestion.service}</span>
                        <span className="text-xs text-text-muted">·</span>
                        <span className="text-xs text-text-muted">{suggestion.genre}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setDismissed(prev => new Set([...prev, index]))}
                      className="p-1 text-text-muted hover:text-text-primary rounded"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <p className="text-sm text-text-secondary mb-4 leading-relaxed">{suggestion.why}</p>

                  {/* Trailer embed — shown below description */}
                  {trailers[index] && (
                    <div className="relative pt-[56.25%] bg-black rounded-xl overflow-hidden mb-4">
                      <iframe
                        className="absolute inset-0 w-full h-full"
                        src={`https://www.youtube.com/embed/${trailers[index]}?autoplay=0`}
                        title={`${suggestion.title} trailer`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  )}
                  {trailers[index] === null && (
                    <p className="text-xs text-text-muted mb-4">No trailer found</p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAdd(suggestion, index)}
                      loading={adding.has(index)}
                      className={`flex-1 gap-1.5 transition-colors ${added.has(index) ? 'bg-green-600 hover:bg-green-600' : ''}`}
                      disabled={added.has(index)}
                    >
                      {added.has(index) ? <Check size={13} /> : <Plus size={13} />}
                      {added.has(index) ? 'Added!' : 'Add to list'}
                    </Button>
                    <button
                      onClick={() => loadTrailer(suggestion, index)}
                      disabled={loadingTrailers.has(index)}
                      className="px-3 py-1.5 rounded-lg bg-bg-hover border border-bg-border text-text-secondary hover:text-text-primary transition-colors text-sm flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {loadingTrailers.has(index) ? (
                        <Spinner className="w-3 h-3" />
                      ) : (
                        <Play size={13} />
                      )}
                      Trailer
                    </button>
                    <button
                      onClick={() => replaceSuggestion(index)}
                      disabled={replacing === index}
                      className="px-3 py-1.5 rounded-lg bg-bg-hover border border-bg-border text-text-secondary hover:text-text-primary transition-colors flex items-center disabled:opacity-50"
                      title="Show me something else"
                    >
                      {replacing === index ? (
                        <Spinner className="w-3 h-3" />
                      ) : (
                        <RefreshCw size={13} />
                      )}
                    </button>
                    <button
                      onClick={() => handleDislike(suggestion, index)}
                      disabled={disliking.has(index)}
                      className="px-3 py-1.5 rounded-lg bg-bg-hover border border-bg-border text-text-secondary hover:text-red-400 hover:border-red-900/40 transition-colors flex items-center disabled:opacity-50"
                      title="I've tried this and didn't like it"
                    >
                      {disliking.has(index) ? (
                        <Spinner className="w-3 h-3" />
                      ) : (
                        <ThumbsDown size={13} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
}
