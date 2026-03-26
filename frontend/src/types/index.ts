export interface User {
  id: string;
  email: string;
  created_at: string;
  stripe_customer_id?: string;
  plan: 'free' | 'pro';
}

export interface Service {
  id: string;
  user_id: string;
  name: string;
  cost_monthly: number;
  billing_date: number | null; // day of month 1-31
  is_free: boolean;
  cancel_url: string | null;
  active: boolean;
  created_at: string;
}

export interface Show {
  id: string;
  user_id: string;
  service_id: string | null;
  title: string;
  episodes_remaining: number;
  status: 'watching' | 'queued' | 'done';
  tv_status: string | null; // 'Returning Series', 'Ended', etc.
  next_air_date: string | null;
  tmdb_id: number | null;
  current_season: number;
  total_seasons: number | null;
  created_at: string;
  // Joined
  services?: { name: string; is_free: boolean } | null;
}

export interface Episode {
  id: string;
  show_id: string;
  season_number: number;
  episode_number: number;
  title: string;
  air_date: string | null;
  watched: boolean;
  created_at: string;
}

export interface RotationEntry {
  service: Service;
  score: number;
  reason: string;
  shows: Show[];
}

export interface Suggestion {
  title: string;
  why: string;
  service: string;
  genre: string;
}

export interface TmdbSearchResult {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  first_air_date: string;
  vote_average: number;
  number_of_seasons?: number;
}

export interface TmdbShow {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  last_air_date: string;
  status: string;
  number_of_seasons: number;
  number_of_episodes: number;
  seasons: TmdbSeason[];
  next_episode_to_air?: { air_date: string } | null;
  vote_average: number;
}

export interface TmdbSeason {
  id: number;
  season_number: number;
  name: string;
  episode_count: number;
  air_date: string;
  poster_path: string | null;
}

export interface TmdbEpisode {
  id: number;
  season_number: number;
  episode_number: number;
  name: string;
  air_date: string;
  overview: string;
  still_path: string | null;
}
