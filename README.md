# StreamRotate

> Stop paying for streaming services you're not watching.

StreamRotate helps you track streaming services, manage your show watchlists, and tells you which service to watch first based on billing urgency and content remaining.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite 3 + TypeScript + Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| Database | Supabase (Postgres + Auth + RLS) |
| Payments | Stripe |
| AI | Anthropic Claude (claude-sonnet-4-20250514) |
| Show data | TMDB API |

## Project Structure

```
StreamRotate/
├── frontend/          # React app (deploy to Vercel)
├── backend/           # Express API (deploy to Render/Railway)
└── supabase/
    └── schema.sql     # Run this in Supabase SQL Editor
```

## Quick Start

### 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to SQL Editor → paste and run `supabase/schema.sql`
3. Enable Google OAuth: Authentication → Providers → Google
4. Get your project URL and keys from Settings → API

### 2. Set up TMDB

1. Create an account at [themoviedb.org](https://www.themoviedb.org)
2. Go to Settings → API → Create an API key
3. Use the **API Read Access Token** (Bearer token) as `TMDB_API_KEY`

### 3. Set up Stripe

1. Create a product "StreamRotate Pro Monthly" → price $3.00/month
2. Create a product "StreamRotate Pro Annual" → price $20.00/year
3. Note the Price IDs for each

### 4. Configure environment variables

**Backend** — copy `backend/.env.example` to `backend/.env`:
```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
TMDB_API_KEY=eyJ...       # Bearer token (without "Bearer " prefix)
ANTHROPIC_API_KEY=sk-ant-...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_MONTHLY_PRICE_ID=price_...
STRIPE_PRO_ANNUAL_PRICE_ID=price_...
JWT_SECRET=any-long-random-string
PORT=3001
FRONTEND_URL=http://localhost:5173
```

**Frontend** — copy `frontend/.env.example` to `frontend/.env.local`:
```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### 5. Run locally

```bash
# Backend
cd backend
npm install
npm run dev   # runs on :3001

# Frontend (separate terminal)
cd frontend
npm install --legacy-peer-deps
npm run dev   # runs on :5173
```

The frontend proxies `/api/*` to the backend automatically via Vite's proxy config.

## Deployment

### Frontend → Vercel

```bash
cd frontend
vercel
```

Set env vars in Vercel dashboard. The `vercel.json` handles SPA routing.

### Backend → Render

1. Connect your repo to [render.com](https://render.com)
2. Use `backend/render.yaml` as the service config
3. Set all env vars in Render dashboard
4. Set `FRONTEND_URL` to your Vercel deployment URL

### Stripe Webhook

After deploying the backend, add a webhook in Stripe dashboard:
- URL: `https://your-backend.onrender.com/api/stripe/webhook`
- Events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`

## Features

### Free Tier
- Track up to 2 streaming services
- Smart rotation plan (billing urgency algorithm)
- Billing reminders with cancel links
- Manual show tracking

### Pro Tier ($3/mo or $20/yr)
- Unlimited streaming services
- AI-powered show suggestions (Claude)
- Episode-by-episode tracking with checkboxes
- Season switcher
- Inline trailer previews (YouTube)
- TMDB auto-search when adding shows

## Rotation Algorithm

Each service is scored:
- `+10` per unwatched show
- `+30` if billing within 7 days
- `+50` if billing within 3 days
- `−50` if it's a free service (no billing pressure)

Services are sorted by score descending. The top service is your "Watch Now" pick.

## Support

If StreamRotate helps you save money:
- Venmo: **@kvirzi**
- Cash App: **$kvirzi**
- Buy Me a Coffee: *(coming soon)*
