import axios from 'axios';
import { supabaseAdmin } from './supabase';
import { syncSeasonEpisodes } from './episodeSync';

const TMDB_BASE = 'https://api.themoviedb.org/3';

// Shows with these TMDB statuses won't get new episodes, so skip episode sync.
const FINISHED_STATUSES = new Set(['Ended', 'Canceled']);

/**
 * Refresh stored TMDB metadata (next_air_date, tv_status, total_seasons) for
 * every non-done tracked show. `next_air_date` is a snapshot of TMDB's
 * next_episode_to_air, which advances as episodes air — so without this it goes
 * stale and the dashboard/timeline/notifications miss new episodes.
 * Runs nightly (see scheduler) and can be triggered manually for testing.
 */
export async function refreshAllShowMeta(): Promise<{ checked: number; updated: number }> {
  // Include done shows too: a "done" show that's a Returning Series still gets
  // new episodes/seasons, and refreshing it is how we learn the return date.
  const { data: shows, error } = await supabaseAdmin
    .from('shows')
    .select('id, tmdb_id, next_air_date, tv_status, total_seasons')
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

      // Pull in newly-aired episodes for the latest season so the "Ready to
      // Watch" queue stays current. Skip shows that can't get new episodes.
      if (seasons && !FINISHED_STATUSES.has(status)) {
        await syncSeasonEpisodes(supabaseAdmin, s.id, s.tmdb_id, seasons);
      }
    } catch (err) {
      console.error(`[refreshShows] tmdb ${s.tmdb_id} failed:`, (err as any)?.message || err);
    }
  }

  return { checked: (shows || []).length, updated };
}
