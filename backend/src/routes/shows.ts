import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { createUserClient } from '../lib/supabase';
import { syncSeasonEpisodes } from '../lib/episodeSync';

const router = Router();

// GET /api/shows
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const client = createUserClient(req.accessToken!);
  const { data, error } = await client
    .from('shows')
    .select('*, services(name, is_free)')
    .eq('user_id', req.userId)
    .order('created_at', { ascending: true });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json(data);
});

// GET /api/shows/ready — shows with episodes that have aired but aren't watched
// yet, so they don't get lost when their air date scrolls off the timeline.
// Grouped per show with the count and the oldest/newest waiting air dates.
router.get('/ready', async (req: AuthRequest, res: Response): Promise<void> => {
  const client = createUserClient(req.accessToken!);
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const { data, error } = await client
    .from('episodes')
    .select('air_date, season_number, episode_number, shows!inner(id, title, status, user_id)')
    .eq('watched', false)
    .not('air_date', 'is', null)
    .lte('air_date', today)
    .eq('shows.user_id', req.userId)
    .order('air_date', { ascending: true });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  // Group the aired-but-unwatched episodes by show.
  const byShow = new Map<string, { id: string; title: string; count: number; oldestAirDate: string; newestAirDate: string }>();
  for (const row of (data || []) as any[]) {
    const show = Array.isArray(row.shows) ? row.shows[0] : row.shows;
    if (!show) continue;
    const entry = byShow.get(show.id);
    if (!entry) {
      byShow.set(show.id, {
        id: show.id,
        title: show.title,
        count: 1,
        oldestAirDate: row.air_date,
        newestAirDate: row.air_date,
      });
    } else {
      entry.count += 1;
      if (row.air_date < entry.oldestAirDate) entry.oldestAirDate = row.air_date;
      if (row.air_date > entry.newestAirDate) entry.newestAirDate = row.air_date;
    }
  }

  // Most recently aired first.
  const result = [...byShow.values()].sort((a, b) => b.newestAirDate.localeCompare(a.newestAirDate));
  res.json(result);
});

// POST /api/shows
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const {
    service_id,
    title,
    episodes_remaining,
    status,
    tv_status,
    next_air_date,
    tmdb_id,
    current_season,
    total_seasons,
  } = req.body;

  if (!title) {
    res.status(400).json({ error: 'Show title is required' });
    return;
  }

  const client = createUserClient(req.accessToken!);
  const { data, error } = await client
    .from('shows')
    .insert({
      user_id: req.userId,
      service_id: service_id || null,
      title,
      episodes_remaining: episodes_remaining || 0,
      status: status || 'queued',
      tv_status: tv_status || null,
      next_air_date: next_air_date || null,
      tmdb_id: tmdb_id || null,
      current_season: current_season || 1,
      total_seasons: total_seasons || null,
    })
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  // Populate episodes for the season being tracked so the new show shows up in
  // the "Ready to Watch" queue right away (not just on the timeline). Best-effort.
  if (data?.tmdb_id) {
    await syncSeasonEpisodes(client, data.id, data.tmdb_id, data.current_season || 1);
  }

  res.status(201).json(data);
});

// PUT /api/shows/:id
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const updates: Record<string, unknown> = {};
  const fields = [
    'service_id', 'title', 'episodes_remaining', 'status',
    'tv_status', 'next_air_date', 'tmdb_id', 'current_season', 'total_seasons'
  ];
  for (const field of fields) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  const client = createUserClient(req.accessToken!);
  const { data, error } = await client
    .from('shows')
    .update(updates)
    .eq('id', id)
    .eq('user_id', req.userId)
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  if (!data) {
    res.status(404).json({ error: 'Show not found' });
    return;
  }
  res.json(data);
});

// DELETE /api/shows/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const client = createUserClient(req.accessToken!);
  const { error } = await client
    .from('shows')
    .delete()
    .eq('id', id)
    .eq('user_id', req.userId);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.status(204).send();
});

// POST /api/shows/:id/episodes - save episode list for a show
router.post('/:id/episodes', async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { episodes } = req.body;

  if (!Array.isArray(episodes)) {
    res.status(400).json({ error: 'episodes must be an array' });
    return;
  }

  const client = createUserClient(req.accessToken!);

  // Verify show belongs to user
  const { data: show, error: showError } = await client
    .from('shows')
    .select('id')
    .eq('id', id)
    .eq('user_id', req.userId)
    .single();

  if (showError || !show) {
    res.status(404).json({ error: 'Show not found' });
    return;
  }

  // Nothing to save — return early without touching existing episodes
  if (episodes.length === 0) {
    res.status(201).json({ message: 'No episodes to save' });
    return;
  }

  // Delete existing episodes only for this season (not all seasons)
  const seasonNumber = episodes[0].season_number;
  await client.from('episodes').delete().eq('show_id', id).eq('season_number', seasonNumber);

  // Insert new episodes
  if (episodes.length > 0) {
    const episodeRows = episodes.map((ep: {
      season_number: number;
      episode_number: number;
      title: string;
      air_date?: string;
      watched?: boolean;
    }) => ({
      show_id: id,
      season_number: ep.season_number,
      episode_number: ep.episode_number,
      title: ep.title,
      air_date: ep.air_date || null,
      watched: ep.watched || false,
    }));

    const { error } = await client.from('episodes').insert(episodeRows);
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
  }

  res.status(201).json({ message: 'Episodes saved' });
});

// PUT /api/shows/:id/episodes/watched - mark ALL episodes for a show as watched
router.put('/:id/episodes/watched', async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const client = createUserClient(req.accessToken!);

  const { data: show, error: showError } = await client
    .from('shows')
    .select('id')
    .eq('id', id)
    .eq('user_id', req.userId)
    .single();

  if (showError || !show) {
    res.status(404).json({ error: 'Show not found' });
    return;
  }

  await client.from('episodes').update({ watched: true }).eq('show_id', id);
  res.json({ ok: true });
});

// PUT /api/shows/:id/episodes/:epId - toggle watched
router.put('/:id/episodes/:epId', async (req: AuthRequest, res: Response): Promise<void> => {
  const { id, epId } = req.params;
  const { watched } = req.body;

  const client = createUserClient(req.accessToken!);

  // Verify show belongs to user
  const { data: show, error: showError } = await client
    .from('shows')
    .select('id')
    .eq('id', id)
    .eq('user_id', req.userId)
    .single();

  if (showError || !show) {
    res.status(404).json({ error: 'Show not found' });
    return;
  }

  const { data, error } = await client
    .from('episodes')
    .update({ watched })
    .eq('id', epId)
    .eq('show_id', id)
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json(data);
});

// GET /api/shows/:id/episodes
router.get('/:id/episodes', async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { season } = req.query;

  const client = createUserClient(req.accessToken!);

  // Verify show belongs to user
  const { data: show, error: showError } = await client
    .from('shows')
    .select('id')
    .eq('id', id)
    .eq('user_id', req.userId)
    .single();

  if (showError || !show) {
    res.status(404).json({ error: 'Show not found' });
    return;
  }

  let query = client
    .from('episodes')
    .select('*')
    .eq('show_id', id)
    .order('season_number', { ascending: true })
    .order('episode_number', { ascending: true });

  if (season) {
    query = query.eq('season_number', Number(season));
  }

  const { data, error } = await query;
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json(data);
});

export default router;
