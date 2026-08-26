import axios from 'axios';
import { supabaseAdmin } from './supabase';

const TMDB_BASE = 'https://api.themoviedb.org/3';

/**
 * Refresh stored TMDB metadata (next_air_date, tv_status, total_seasons) for
 * every non-done tracked show. `next_air_date` is a snapshot of TMDB's
 * next_episode_to_air, which advances as episodes air — so without this it goes
 * stale and the dashboard/timeline/notifications miss new episodes.
 * Runs nightly (see scheduler) and can be triggered manually for testing.
 */
export async function refreshAllShowMeta(): Promise<{ checked: number; updated: number }> {
  const { data: shows, error } = await supabaseAdmin
    .from('shows')
    .select('id, tmdb_id, next_air_date, tv_status, total_seasons')
    .neq('status', 'done')
    .not('tmdb_id', 'is', null);

  if (error) throw error;

  let updated = 0;
  for (const s of (shows || []) as any[]) {
    try {
      const resp = await axios.get(`${TMDB_BASE}/tv/${s.tmdb_id}`, {
        headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` },
        params: { language: 'en-US' },
      });
      const next = resp.data.next_episode_to_air?.air_date || null;
      const status = resp.data.status || null;
      const seasons = resp.data.number_of_seasons ?? null;

      if (next !== s.next_air_date || status !== s.tv_status || seasons !== s.total_seasons) {
        await supabaseAdmin
          .from('shows')
          .update({ next_air_date: next, tv_status: status, total_seasons: seasons })
          .eq('id', s.id);
        updated++;
      }
    } catch (err) {
      console.error(`[refreshShows] tmdb ${s.tmdb_id} failed:`, (err as any)?.message || err);
    }
  }

  return { checked: (shows || []).length, updated };
}
