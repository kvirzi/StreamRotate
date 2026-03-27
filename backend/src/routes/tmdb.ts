import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();
const TMDB_BASE = 'https://api.themoviedb.org/3';

function tmdbHeaders() {
  return {
    Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

// GET /api/tmdb/search?q=
router.get('/search', async (req: Request, res: Response): Promise<void> => {
  const { q } = req.query;
  if (!q) {
    res.status(400).json({ error: 'Query parameter q is required' });
    return;
  }

  try {
    const response = await axios.get(`${TMDB_BASE}/search/tv`, {
      headers: tmdbHeaders(),
      params: {
        query: q,
        include_adult: false,
        language: 'en-US',
        page: 1,
      },
    });
    res.json(response.data);
  } catch (err: unknown) {
    const error = err as { response?: { data: unknown; status: number } };
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'TMDB request failed' });
  }
});

// GET /api/tmdb/show/:tmdbId
router.get('/show/:tmdbId', async (req: Request, res: Response): Promise<void> => {
  const { tmdbId } = req.params;
  try {
    const response = await axios.get(`${TMDB_BASE}/tv/${tmdbId}`, {
      headers: tmdbHeaders(),
      params: { language: 'en-US', append_to_response: 'seasons' },
    });
    res.json(response.data);
  } catch (err: unknown) {
    const error = err as { response?: { data: unknown; status: number } };
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'TMDB request failed' });
  }
});

// GET /api/tmdb/show/:tmdbId/season/:num
router.get('/show/:tmdbId/season/:num', async (req: Request, res: Response): Promise<void> => {
  const { tmdbId, num } = req.params;
  try {
    const response = await axios.get(`${TMDB_BASE}/tv/${tmdbId}/season/${num}`, {
      headers: tmdbHeaders(),
      params: { language: 'en-US' },
    });
    res.json(response.data);
  } catch (err: unknown) {
    const error = err as { response?: { data: unknown; status: number } };
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'TMDB request failed' });
  }
});

// GET /api/tmdb/show/:tmdbId/providers
router.get('/show/:tmdbId/providers', async (req: Request, res: Response): Promise<void> => {
  const { tmdbId } = req.params;
  try {
    const response = await axios.get(`${TMDB_BASE}/tv/${tmdbId}/watch/providers`, {
      headers: tmdbHeaders(),
    });
    res.json(response.data);
  } catch (err: unknown) {
    const error = err as { response?: { data: unknown; status: number } };
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'TMDB request failed' });
  }
});

// GET /api/tmdb/show/:tmdbId/videos
router.get('/show/:tmdbId/videos', async (req: Request, res: Response): Promise<void> => {
  const { tmdbId } = req.params;
  try {
    const response = await axios.get(`${TMDB_BASE}/tv/${tmdbId}/videos`, {
      headers: tmdbHeaders(),
      params: { language: 'en-US' },
    });
    res.json(response.data);
  } catch (err: unknown) {
    const error = err as { response?: { data: unknown; status: number } };
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'TMDB request failed' });
  }
});

export default router;
