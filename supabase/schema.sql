-- StreamRotate Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLES
-- =============================================

-- Users (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  stripe_customer_id TEXT UNIQUE,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro')) NOT NULL
);

-- Services
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cost_monthly NUMERIC(10,2) DEFAULT 0,
  billing_date INTEGER CHECK (billing_date >= 1 AND billing_date <= 31),
  is_free BOOLEAN DEFAULT false NOT NULL,
  cancel_url TEXT,
  active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Shows
CREATE TABLE IF NOT EXISTS public.shows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  episodes_remaining INTEGER DEFAULT 0,
  status TEXT DEFAULT 'queued' CHECK (status IN ('watching', 'queued', 'done')) NOT NULL,
  tv_status TEXT,
  next_air_date DATE,
  tmdb_id INTEGER,
  current_season INTEGER DEFAULT 1,
  total_seasons INTEGER,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Episodes
CREATE TABLE IF NOT EXISTS public.episodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  show_id UUID NOT NULL REFERENCES public.shows(id) ON DELETE CASCADE,
  season_number INTEGER NOT NULL,
  episode_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  air_date DATE,
  watched BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(show_id, season_number, episode_number)
);

-- Waitlist
CREATE TABLE IF NOT EXISTS public.waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_services_user_id ON public.services(user_id);
CREATE INDEX IF NOT EXISTS idx_shows_user_id ON public.shows(user_id);
CREATE INDEX IF NOT EXISTS idx_shows_service_id ON public.shows(service_id);
CREATE INDEX IF NOT EXISTS idx_episodes_show_id ON public.episodes(show_id);
CREATE INDEX IF NOT EXISTS idx_episodes_show_season ON public.episodes(show_id, season_number);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own record"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own record"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Services policies
CREATE POLICY "Users can view their own services"
  ON public.services FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own services"
  ON public.services FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own services"
  ON public.services FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own services"
  ON public.services FOR DELETE
  USING (auth.uid() = user_id);

-- Shows policies
CREATE POLICY "Users can view their own shows"
  ON public.shows FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own shows"
  ON public.shows FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shows"
  ON public.shows FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shows"
  ON public.shows FOR DELETE
  USING (auth.uid() = user_id);

-- Episodes policies (scoped through shows)
CREATE POLICY "Users can view episodes of their shows"
  ON public.episodes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.shows
    WHERE shows.id = episodes.show_id
    AND shows.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert episodes for their shows"
  ON public.episodes FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.shows
    WHERE shows.id = episodes.show_id
    AND shows.user_id = auth.uid()
  ));

CREATE POLICY "Users can update episodes of their shows"
  ON public.episodes FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.shows
    WHERE shows.id = episodes.show_id
    AND shows.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete episodes of their shows"
  ON public.episodes FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.shows
    WHERE shows.id = episodes.show_id
    AND shows.user_id = auth.uid()
  ));

-- Waitlist: anyone can insert (for the landing page form)
CREATE POLICY "Anyone can join waitlist"
  ON public.waitlist FOR INSERT
  WITH CHECK (true);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Auto-create user record when someone signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
