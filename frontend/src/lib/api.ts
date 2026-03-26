import axios from 'axios';
import { supabase } from './supabase';

const api = axios.create({
  baseURL: '/api',
});

// Attach JWT token to every request
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

export default api;

// Typed API helpers
export const servicesApi = {
  getAll: () => api.get('/services'),
  create: (data: Record<string, unknown>) => api.post('/services', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/services/${id}`, data),
  delete: (id: string) => api.delete(`/services/${id}`),
};

export const showsApi = {
  getAll: () => api.get('/shows'),
  create: (data: Record<string, unknown>) => api.post('/shows', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/shows/${id}`, data),
  delete: (id: string) => api.delete(`/shows/${id}`),
  saveEpisodes: (showId: string, episodes: unknown[]) =>
    api.post(`/shows/${showId}/episodes`, { episodes }),
  getEpisodes: (showId: string, season?: number) =>
    api.get(`/shows/${showId}/episodes${season ? `?season=${season}` : ''}`),
  updateEpisode: (showId: string, epId: string, watched: boolean) =>
    api.put(`/shows/${showId}/episodes/${epId}`, { watched }),
};

export const tmdbApi = {
  search: (q: string) => api.get(`/tmdb/search?q=${encodeURIComponent(q)}`),
  getShow: (tmdbId: number) => api.get(`/tmdb/show/${tmdbId}`),
  getSeason: (tmdbId: number, season: number) => api.get(`/tmdb/show/${tmdbId}/season/${season}`),
  getVideos: (tmdbId: number) => api.get(`/tmdb/show/${tmdbId}/videos`),
};

export const suggestionsApi = {
  get: () => api.post('/suggestions'),
  replace: (existing: unknown[], index: number) =>
    api.post('/suggestions/replace', { existing, index }),
};

export const waitlistApi = {
  join: (email: string) => api.post('/waitlist', { email }),
};

export const stripeApi = {
  checkout: (plan: 'monthly' | 'annual') => api.post('/stripe/checkout', { plan }),
  portal: () => api.get('/stripe/portal'),
};
