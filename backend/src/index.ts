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
import notifyRouter from './routes/notify';
import accountRouter from './routes/account';
import { startScheduler } from './lib/scheduler';

const app = express();
const PORT = process.env.PORT || 3001;

// Stripe webhook needs raw body
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  'https://streamrotate.com',
  'https://www.streamrotate.com',
  'capacitor://localhost',
  'ionic://localhost',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
  // The backend's own public origin — lets same-origin admin/test calls
  // (e.g. a browser fetch to the manual reminder trigger) pass CORS.
  ...(process.env.PUBLIC_API_URL ? [process.env.PUBLIC_API_URL] : []),
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
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
app.use('/api/notify', notifyRouter);
app.use('/api/account', requireAuth, accountRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`StreamRotate API running on port ${PORT}`);
  startScheduler();
});

export default app;
