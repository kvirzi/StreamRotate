import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { requireAuth } from './middleware/auth';
import servicesRouter from './routes/services';
import showsRouter from './routes/shows';
import tmdbRouter from './routes/tmdb';
import suggestionsRouter from './routes/suggestions';
import waitlistRouter from './routes/waitlist';
import stripeRouter from './routes/stripe';

const app = express();
const PORT = process.env.PORT || 3001;

// Stripe webhook needs raw body
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/services', requireAuth, servicesRouter);
app.use('/api/shows', requireAuth, showsRouter);
app.use('/api/tmdb', tmdbRouter); // No auth needed — key is server-side
app.use('/api/suggestions', requireAuth, suggestionsRouter);
app.use('/api/waitlist', waitlistRouter);
app.use('/api/stripe', stripeRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`StreamRotate API running on port ${PORT}`);
});

export default app;
