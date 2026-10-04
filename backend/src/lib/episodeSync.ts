import axios from 'axios';

const TMDB_BASE = 'https://api.themoviedb.org/3';

// A minimal shape — works with both the service-role admin client and a
// per-user client, so this can run from the nightly job or a request handler.
interface SupabaseLike {
  from: (table: string) => any;
}

/**
 * Pull a season's episodes from TMDB and insert any that aren't already stored,
 * WITHOUT touching existing rows (so watched checkmarks are preserved). Used to
 * keep the "Ready to Watch" queue current as new episodes air, and to populate
 * episodes when a show is first added. Returns the number of episodes inserted.
 */
export async function syncSeasonEpisodes(
  client: SupabaseLike,
  showId: string,
  tmdbId: number,
  season: number,
): Promise<number> {
  if (!tmdbId || !season || season < 1) return 0;

  let eps: any[] = [];
  try {
    const resp = await axios.get(`${TMDB_BASE}/tv/${tmdbId}/season/${season}`, {
      headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` },
      params: { language: 'en-US' },
    });
    eps = resp.data?.episodes || [];
  } catch (err) {
    console.error(`[episodeSync] tmdb ${tmdbId} s${season} failed:`, (err as any)?.message || err);
    return 0;
  }
  if (!eps.length) return 0;

  // Keep only episodes we don't already have — never overwrite watched state.
  const { data: existing } = await client
    .from('episodes')
    .select('episode_number')
    .eq('show_id', showId)
    .eq('season_number', season);
  const have = new Set(((existing || []) as any[]).map(e => e.episode_number));

  const toInsert = eps
    .filter(e => !have.has(e.episode_number))
    .map(e => ({
      show_id: showId,
      season_number: season,
      episode_number: e.episode_number,
      title: e.name || `Episode ${e.episode_number}`,
      air_date: e.air_date || null,
      watched: false,
    }));

  if (!toInsert.length) return 0;
  const { error } = await client.from('episodes').insert(toInsert);
  if (error) {
    console.error(`[episodeSync] insert failed for show ${showId}:`, error.message);
    return 0;
  }
  return toInsert.length;
}
