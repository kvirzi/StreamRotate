import { useState, useCallback } from 'react';
import { Plus, Search, ChevronDown, ChevronUp, Check, X, Tv2, Edit2, Trash2, RefreshCw } from 'lucide-react';
import { Show, Service, TmdbSearchResult, TmdbEpisode, Episode } from '../../types';
import { showsApi, tmdbApi } from '../../lib/api';
import { ServiceIcon } from '../../components/ServiceIcon';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Spinner } from '../../components/Spinner';

interface ShowsProps {
  shows: Show[];
  services: Service[];
  onRefresh: () => void;
  plan: 'free' | 'pro';
}

interface ShowFormData {
  title: string;
  service_id: string;
  episodes_remaining: string;
  status: 'watching' | 'queued' | 'done';
  tmdb_id: string;
  total_seasons: string;
  current_season: string;
  tv_status: string;
}

const EMPTY_FORM: ShowFormData = {
  title: '',
  service_id: '',
  episodes_remaining: '',
  status: 'queued',
  tmdb_id: '',
  total_seasons: '',
  current_season: '1',
  tv_status: '',
};

const ENDED_STATUSES = new Set(['Ended', 'Canceled', 'Cancelled']);
const isShowEnded = (show: { tv_status: string | null; status: string }) =>
  !!show.tv_status && ENDED_STATUSES.has(show.tv_status) && show.status !== 'watching';

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useState(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  });
  return debounced;
}

export function Shows({ shows, services, onRefresh, plan }: ShowsProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingShow, setEditingShow] = useState<Show | null>(null);
  const [form, setForm] = useState<ShowFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [expandedShows, setExpandedShows] = useState<Set<string>>(new Set());
  const [episodesMap, setEpisodesMap] = useState<Record<string, Episode[]>>({});
  const [loadingEpisodes, setLoadingEpisodes] = useState<Set<string>>(new Set());
  const [activeSeason, setActiveSeason] = useState<Record<string, number>>({});

  // TMDB search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TmdbSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = useCallback(async (q: string) => {
    if (!q.trim() || q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const { data } = await tmdbApi.search(q);
      setSearchResults(data.results?.slice(0, 6) || []);
    } catch { setSearchResults([]); }
    finally { setSearching(false); }
  }, []);

  const handleSearchInput = (q: string) => {
    setSearchQuery(q);
    setForm(f => ({ ...f, title: q }));
    if (q.length >= 2) handleSearch(q);
    else setSearchResults([]);
  };

  const selectTmdbShow = async (result: TmdbSearchResult) => {
    setSearchQuery(result.name);
    setSearchResults([]);
    try {
      const { data } = await tmdbApi.getShow(result.id);

      // Auto-fill episode count from season 1
      const season1 = (data.seasons as { season_number: number; episode_count: number }[])
        ?.find(s => s.season_number === 1);
      const episodesInSeason = season1?.episode_count || 0;

      setForm(f => ({
        ...f,
        title: data.name,
        tmdb_id: data.id.toString(),
        total_seasons: data.number_of_seasons?.toString() || '',
        episodes_remaining: episodesInSeason > 0 ? episodesInSeason.toString() : f.episodes_remaining,
        tv_status: data.status || '',
      }));

      // Auto-match streaming service from TMDB watch providers (US flatrate)
      try {
        const { data: providerData } = await tmdbApi.getProviders(result.id);
        const usProviders: { provider_name: string }[] =
          providerData?.results?.US?.flatrate || [];

        // Aliases for services that have been renamed or have multiple common names
        const ALIASES: Record<string, string[]> = {
          'max': ['hbo max', 'max (us)'],
          'hbo max': ['max', 'max (us)'],
          'amazon prime': ['amazon prime video', 'prime video'],
          'prime video': ['amazon prime', 'amazon prime video'],
          'apple tv+': ['apple tv plus', 'apple tv'],
          'disney+': ['disney plus'],
        };

        const normalize = (name: string) => name.toLowerCase().trim();

        const match = services.find(svc => {
          const svcKey = normalize(svc.name);
          const svcAliases = [svcKey, ...(ALIASES[svcKey] || [])];
          return usProviders.some(p => {
            const provKey = normalize(p.provider_name);
            const provAliases = [provKey, ...(ALIASES[provKey] || [])];
            return svcAliases.some(s => provAliases.some(pA => s.includes(pA) || pA.includes(s)));
          });
        });
        if (match) setForm(f => ({ ...f, service_id: match.id }));
      } catch { /* best-effort */ }

    } catch {
      setForm(f => ({ ...f, title: result.name, tmdb_id: result.id.toString() }));
    }
  };

  const openAdd = () => {
    setEditingShow(null);
    setForm(EMPTY_FORM);
    setSearchQuery('');
    setSearchResults([]);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (show: Show) => {
    setEditingShow(show);
    setForm({
      title: show.title,
      service_id: show.service_id || '',
      episodes_remaining: show.episodes_remaining?.toString() || '',
      status: show.status,
      tmdb_id: show.tmdb_id?.toString() || '',
      total_seasons: show.total_seasons?.toString() || '',
      current_season: show.current_season?.toString() || '1',
      tv_status: show.tv_status || '',
    });
    setSearchQuery(show.title);
    setSearchResults([]);
    setError('');
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Show title is required'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = {
        title: form.title.trim(),
        service_id: form.service_id || null,
        episodes_remaining: parseInt(form.episodes_remaining) || 0,
        status: form.status,
        tmdb_id: form.tmdb_id ? parseInt(form.tmdb_id) : null,
        total_seasons: form.total_seasons ? parseInt(form.total_seasons) : null,
        current_season: parseInt(form.current_season) || 1,
        tv_status: form.tv_status || null,
      };
      if (editingShow) {
        await showsApi.update(editingShow.id, payload);
      } else {
        const { data: newShow } = await showsApi.create(payload);
        // Auto-save season 1 episodes from TMDB when a TMDB show is added
        if (newShow?.id && payload.tmdb_id) {
          try {
            const { data: seasonData } = await tmdbApi.getSeason(payload.tmdb_id, 1);
            const episodes = (seasonData.episodes || []) as TmdbEpisode[];
            if (episodes.length > 0) {
              await showsApi.saveEpisodes(newShow.id, episodes.map(ep => ({
                season_number: ep.season_number,
                episode_number: ep.episode_number,
                title: ep.name,
                air_date: ep.air_date,
                watched: false,
              })));
            }
          } catch { /* best-effort */ }
        }
      }
      await onRefresh();
      setModalOpen(false);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error || 'Failed to save show');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await showsApi.delete(id);
      await onRefresh();
      setDeleteConfirm(null);
    } catch { /* ignore */ }
  };

  const toggleExpand = async (show: Show) => {
    const next = new Set(expandedShows);
    if (next.has(show.id)) {
      next.delete(show.id);
      setExpandedShows(next);
      return;
    }
    next.add(show.id);
    setExpandedShows(next);
    const season = activeSeason[show.id] || show.current_season || 1;
    const existing = episodesMap[show.id];
    if (!existing || existing.length === 0) {
      const fetched = await loadEpisodes(show.id, season);
      // If DB has no episodes and we have a TMDB ID, auto-fetch from TMDB
      if ((!fetched || fetched.length === 0) && show.tmdb_id) {
        await loadTmdbEpisodes(show, season);
      }
    }
  };

  const loadEpisodes = async (showId: string, season: number): Promise<Episode[]> => {
    const loadingNext = new Set(loadingEpisodes);
    loadingNext.add(showId);
    setLoadingEpisodes(loadingNext);
    try {
      const { data } = await showsApi.getEpisodes(showId, season);
      setEpisodesMap(prev => ({ ...prev, [showId]: data }));
      return data as Episode[];
    } catch { /* ignore */ }
    finally {
      const loadingNext2 = new Set(loadingEpisodes);
      loadingNext2.delete(showId);
      setLoadingEpisodes(loadingNext2);
    }
    return [];
  };

  const toggleEpisode = async (show: Show, episode: Episode) => {
    try {
      await showsApi.updateEpisode(show.id, episode.id, !episode.watched);
      setEpisodesMap(prev => ({
        ...prev,
        [show.id]: prev[show.id].map(ep =>
          ep.id === episode.id ? { ...ep, watched: !ep.watched } : ep
        ),
      }));
    } catch { /* ignore */ }
  };

  const loadTmdbEpisodes = async (show: Show, season: number) => {
    if (!show.tmdb_id) return;
    try {
      const { data } = await tmdbApi.getSeason(show.tmdb_id, season);
      const episodes: Omit<TmdbEpisode, 'id' | 'overview' | 'still_path'>[] = data.episodes || [];
      await showsApi.saveEpisodes(show.id, episodes.map(ep => ({
        season_number: ep.season_number,
        episode_number: ep.episode_number,
        title: ep.name,
        air_date: ep.air_date,
        watched: false,
      })));
      await loadEpisodes(show.id, season);
    } catch { /* ignore */ }
  };

  const markSeasonWatched = async (show: Show) => {
    const episodes = episodesMap[show.id] || [];
    const unwatched = episodes.filter(ep => !ep.watched);
    if (unwatched.length === 0) return;
    await Promise.all(unwatched.map(ep => showsApi.updateEpisode(show.id, ep.id, true)));
    setEpisodesMap(prev => ({
      ...prev,
      [show.id]: (prev[show.id] || []).map(ep => ({ ...ep, watched: true })),
    }));
  };

  const handleSeasonChange = async (show: Show, season: number) => {
    setActiveSeason(prev => ({ ...prev, [show.id]: season }));
    const fetched = await loadEpisodes(show.id, season);
    if ((!fetched || fetched.length === 0) && show.tmdb_id) {
      await loadTmdbEpisodes(show, season);
    }
  };

  // Group shows by service
  const grouped: Record<string, Show[]> = {};
  const noService: Show[] = [];
  shows.forEach(show => {
    if (show.service_id) {
      if (!grouped[show.service_id]) grouped[show.service_id] = [];
      grouped[show.service_id].push(show);
    } else {
      noService.push(show);
    }
  });

  const statusColors = {
    watching: 'bg-accent-teal/20 text-accent-teal',
    queued: 'bg-bg-hover text-text-muted',
    done: 'bg-green-900/20 text-green-400',
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-text-primary">My Shows</h1>
          <p className="text-text-muted text-sm mt-0.5">{shows.length} show{shows.length !== 1 ? 's' : ''} tracked</p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus size={16} />
          Add Show
        </Button>
      </div>

      {shows.length === 0 ? (
        <div className="text-center py-16 bg-bg-card border border-bg-border rounded-2xl">
          <Tv2 size={40} className="mx-auto text-text-muted mb-4" />
          <h3 className="font-display font-semibold text-text-primary mb-2">No shows yet</h3>
          <p className="text-text-muted text-sm mb-4">Track your shows to get episode counts and rotation suggestions</p>
          <Button onClick={openAdd}>
            <Plus size={16} />
            Add your first show
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Grouped by service */}
          {Object.entries(grouped).map(([serviceId, serviceShows]) => {
            const service = services.find(s => s.id === serviceId);
            if (!service) return null;
            const liveShows = serviceShows.filter(s => !isShowEnded(s));
            const closedShows = serviceShows.filter(s => isShowEnded(s));
            return (
              <div key={serviceId} className="bg-bg-card border border-bg-border rounded-2xl overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-bg-border bg-bg-secondary/50">
                  <ServiceIcon name={service.name} size="sm" />
                  <h2 className="font-display font-semibold text-text-primary">{service.name}</h2>
                  <span className="text-xs text-text-muted bg-bg-hover px-2 py-0.5 rounded-full">{serviceShows.length}</span>
                </div>
                <div className="divide-y divide-bg-border">
                  {liveShows.map(show => (
                    <ShowRow key={show.id} show={show}
                      expanded={expandedShows.has(show.id)} episodes={episodesMap[show.id] || []}
                      loadingEpisodes={loadingEpisodes.has(show.id)} activeSeason={activeSeason[show.id] || show.current_season || 1}
                      plan={plan} onToggleExpand={() => toggleExpand(show)} onEdit={() => openEdit(show)}
                      onDelete={() => setDeleteConfirm(show.id)} onToggleEpisode={(ep) => toggleEpisode(show, ep)}
                      onSeasonChange={(s) => handleSeasonChange(show, s)} onLoadTmdb={(s) => loadTmdbEpisodes(show, s)}
                      onMarkSeasonWatched={() => markSeasonWatched(show)} statusColors={statusColors}
                    />
                  ))}
                  {closedShows.length > 0 && (
                    <>
                      <div className="flex items-center gap-3 px-5 py-2 bg-bg-secondary/30">
                        <div className="flex-1 h-px bg-bg-border" />
                        <span className="text-[10px] font-medium text-text-muted uppercase tracking-widest whitespace-nowrap">Closed Shows</span>
                        <div className="flex-1 h-px bg-bg-border" />
                      </div>
                      {closedShows.map(show => (
                        <ShowRow key={show.id} show={show}
                          expanded={expandedShows.has(show.id)} episodes={episodesMap[show.id] || []}
                          loadingEpisodes={loadingEpisodes.has(show.id)} activeSeason={activeSeason[show.id] || show.current_season || 1}
                          plan={plan} onToggleExpand={() => toggleExpand(show)} onEdit={() => openEdit(show)}
                          onDelete={() => setDeleteConfirm(show.id)} onToggleEpisode={(ep) => toggleEpisode(show, ep)}
                          onSeasonChange={(s) => handleSeasonChange(show, s)} onLoadTmdb={(s) => loadTmdbEpisodes(show, s)}
                          onMarkSeasonWatched={() => markSeasonWatched(show)} statusColors={statusColors}
                        />
                      ))}
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {/* Unassigned shows */}
          {noService.length > 0 && (
            <div className="bg-bg-card border border-bg-border rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-bg-border bg-bg-secondary/50">
                <h2 className="font-display font-semibold text-text-muted text-sm">Unassigned</h2>
              </div>
              <div className="divide-y divide-bg-border">
                {noService.filter(s => !isShowEnded(s)).map(show => (
                  <ShowRow key={show.id} show={show}
                    expanded={expandedShows.has(show.id)} episodes={episodesMap[show.id] || []}
                    loadingEpisodes={loadingEpisodes.has(show.id)} activeSeason={activeSeason[show.id] || show.current_season || 1}
                    plan={plan} onToggleExpand={() => toggleExpand(show)} onEdit={() => openEdit(show)}
                    onDelete={() => setDeleteConfirm(show.id)} onToggleEpisode={(ep) => toggleEpisode(show, ep)}
                    onSeasonChange={(s) => handleSeasonChange(show, s)} onLoadTmdb={(s) => loadTmdbEpisodes(show, s)}
                    onMarkSeasonWatched={() => markSeasonWatched(show)} statusColors={statusColors}
                  />
                ))}
                {noService.filter(s => isShowEnded(s)).length > 0 && (
                  <>
                    <div className="flex items-center gap-3 px-5 py-2 bg-bg-secondary/30">
                      <div className="flex-1 h-px bg-bg-border" />
                      <span className="text-[10px] font-medium text-text-muted uppercase tracking-widest whitespace-nowrap">Closed Shows</span>
                      <div className="flex-1 h-px bg-bg-border" />
                    </div>
                    {noService.filter(s => isShowEnded(s)).map(show => (
                      <ShowRow key={show.id} show={show}
                        expanded={expandedShows.has(show.id)} episodes={episodesMap[show.id] || []}
                        loadingEpisodes={loadingEpisodes.has(show.id)} activeSeason={activeSeason[show.id] || show.current_season || 1}
                        plan={plan} onToggleExpand={() => toggleExpand(show)} onEdit={() => openEdit(show)}
                        onDelete={() => setDeleteConfirm(show.id)} onToggleEpisode={(ep) => toggleEpisode(show, ep)}
                        onSeasonChange={(s) => handleSeasonChange(show, s)} onLoadTmdb={(s) => loadTmdbEpisodes(show, s)}
                        onMarkSeasonWatched={() => markSeasonWatched(show)} statusColors={statusColors}
                      />
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingShow ? 'Edit Show' : 'Add Show'}
        size="lg"
      >
        <div className="space-y-4">
          {/* TMDB search (Pro) or plain input */}
          <div className="relative">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                className="w-full pl-10 pr-3.5 py-2.5 bg-bg-secondary border border-bg-border rounded-xl text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-accent-orange/60 transition-colors"
                placeholder="Search TMDB or type a title..."
                value={searchQuery}
                onChange={e => handleSearchInput(e.target.value)}
              />
              {searching && <Spinner className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />}
            </div>
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-bg-card border border-bg-border rounded-xl shadow-2xl z-50 overflow-hidden max-h-64 overflow-y-auto">
                {searchResults.map(result => (
                  <button
                    key={result.id}
                    onClick={() => selectTmdbShow(result)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-bg-hover transition-colors text-left"
                  >
                    {result.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w92${result.poster_path}`}
                        alt=""
                        className="w-8 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-8 h-12 bg-bg-hover rounded flex items-center justify-center">
                        <Tv2 size={14} className="text-text-muted" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{result.name}</p>
                      <p className="text-xs text-text-muted">{result.first_air_date?.slice(0, 4)}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Service</label>
              <select
                value={form.service_id}
                onChange={e => setForm(f => ({ ...f, service_id: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-bg-secondary border border-bg-border rounded-xl text-text-primary text-sm focus:outline-none focus:border-accent-orange/60 transition-colors"
              >
                <option value="">No service</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value as ShowFormData['status'] }))}
                className="w-full px-3.5 py-2.5 bg-bg-secondary border border-bg-border rounded-xl text-text-primary text-sm focus:outline-none focus:border-accent-orange/60 transition-colors"
              >
                <option value="queued">Queued</option>
                <option value="watching">Watching</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Episodes Left"
              type="number"
              min="0"
              value={form.episodes_remaining}
              onChange={e => setForm(f => ({ ...f, episodes_remaining: e.target.value }))}
              placeholder="0"
            />
            <Input
              label="Current Season"
              type="number"
              min="1"
              value={form.current_season}
              onChange={e => setForm(f => ({ ...f, current_season: e.target.value }))}
              placeholder="1"
            />
            <Input
              label="Total Seasons"
              type="number"
              min="1"
              value={form.total_seasons}
              onChange={e => setForm(f => ({ ...f, total_seasons: e.target.value }))}
              placeholder="—"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving} className="flex-1">
              {editingShow ? 'Save Changes' : 'Add Show'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Remove Show" size="sm">
        <p className="text-text-secondary text-sm mb-5">Remove this show from your watchlist?</p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)} className="flex-1">Cancel</Button>
          <Button variant="danger" onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="flex-1">Remove</Button>
        </div>
      </Modal>
    </div>
  );
}

interface ShowRowProps {
  show: Show;
  expanded: boolean;
  episodes: Episode[];
  loadingEpisodes: boolean;
  activeSeason: number;
  plan: 'free' | 'pro';
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleEpisode: (ep: Episode) => void;
  onSeasonChange: (season: number) => void;
  onLoadTmdb: (season: number) => void;
  onMarkSeasonWatched: () => void;
  statusColors: Record<string, string>;
}

function ShowRow({
  show, expanded, episodes, loadingEpisodes, activeSeason, plan,
  onToggleExpand, onEdit, onDelete, onToggleEpisode, onSeasonChange, onLoadTmdb,
  onMarkSeasonWatched, statusColors,
}: ShowRowProps) {
  const watchedCount = episodes.filter(e => e.watched).length;
  const progress = episodes.length > 0 ? Math.round((watchedCount / episodes.length) * 100) : 0;

  return (
    <div>
      <div className="flex items-center gap-3 px-5 py-3.5 group hover:bg-bg-hover/30 transition-colors">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
          show.status === 'watching' ? 'bg-accent-teal' :
          show.status === 'done' ? 'bg-green-500' : 'bg-bg-border'
        }`} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-text-primary truncate">{show.title}</p>
            <span className={`badge text-[10px] ${statusColors[show.status]}`}>
              {show.status}
            </span>
          </div>
          {show.total_seasons && (
            <p className="text-xs text-text-muted">
              Season {show.current_season || 1}{show.total_seasons > 1 ? ` of ${show.total_seasons}` : ''}
              {show.episodes_remaining > 0 && ` · ${show.episodes_remaining} ep left`}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-hover rounded-lg">
            <Edit2 size={14} />
          </button>
          <button onClick={onDelete} className="p-1.5 text-text-muted hover:text-red-400 hover:bg-red-900/10 rounded-lg">
            <Trash2 size={14} />
          </button>
        </div>

        <button
          onClick={onToggleExpand}
          className="p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-hover rounded-lg ml-1"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Episode checklist */}
      {expanded && (
        <div className="px-5 pb-4 bg-bg-hover/20">
          {/* Season switcher */}
          {show.total_seasons && show.total_seasons > 1 && (
            <div className="flex items-center gap-2 mb-3 pt-2">
              <span className="text-xs text-text-muted">Season:</span>
              <div className="flex gap-1 flex-wrap">
                {Array.from({ length: show.total_seasons }, (_, i) => i + 1).map(s => (
                  <button
                    key={s}
                    onClick={() => onSeasonChange(s)}
                    className={`w-7 h-7 text-xs rounded-lg transition-colors ${
                      activeSeason === s
                        ? 'bg-accent-orange text-white'
                        : 'bg-bg-hover text-text-muted hover:text-text-primary'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {show.tmdb_id && (
                <button
                  onClick={() => onLoadTmdb(activeSeason)}
                  className="ml-auto flex items-center gap-1 text-xs text-text-muted hover:text-accent-teal transition-colors"
                >
                  <RefreshCw size={12} />
                  Load from TMDB
                </button>
              )}
            </div>
          )}

          {loadingEpisodes ? (
            <div className="flex items-center gap-2 py-4 text-text-muted text-sm">
              <Spinner className="w-4 h-4" /> Loading episodes...
            </div>
          ) : episodes.length > 0 ? (
            <div>
              {/* Progress */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-text-muted">{watchedCount}/{episodes.length} watched</span>
                <div className="flex items-center gap-3">
                  {watchedCount < episodes.length && (
                    <button
                      onClick={onMarkSeasonWatched}
                      className="text-xs text-accent-teal hover:text-accent-teal/80 transition-colors"
                    >
                      Mark all watched
                    </button>
                  )}
                  <span className="text-xs text-text-muted">{progress}%</span>
                </div>
              </div>
              <div className="progress-bar mb-3">
                <div className="progress-bar-fill bg-accent-teal" style={{ width: `${progress}%` }} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-48 overflow-y-auto">
                {episodes.map(ep => (
                  <button
                    key={ep.id}
                    onClick={() => onToggleEpisode(ep)}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors ${
                      ep.watched ? 'bg-accent-teal/10' : 'hover:bg-bg-hover'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${
                      ep.watched ? 'bg-accent-teal border-accent-teal' : 'border-bg-border'
                    }`}>
                      {ep.watched && <Check size={10} className="text-white" />}
                    </div>
                    <span className={`text-xs truncate ${ep.watched ? 'text-text-muted line-through' : 'text-text-secondary'}`}>
                      {ep.episode_number}. {ep.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-3 flex items-center justify-between">
              <p className="text-xs text-text-muted">No episodes loaded yet</p>
              {show.tmdb_id && (
                <button
                  onClick={() => onLoadTmdb(activeSeason)}
                  className="flex items-center gap-1 text-xs text-accent-teal hover:text-accent-teal-hover"
                >
                  <RefreshCw size={12} />
                  Load from TMDB
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
