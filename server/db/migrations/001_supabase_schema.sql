-- QueueLess Supabase Schema Migration
-- Run this in your Supabase SQL Editor after creating the project.
-- This sets up all tables, indexes, and helper functions.

-- ════════════════════════════════════════════════════════
-- PART 1: Tables
-- ════════════════════════════════════════════════════════

-- Users profiles table (linked to Supabase Auth users via supabase_id)
CREATE TABLE IF NOT EXISTS public.users (
  id            SERIAL PRIMARY KEY,
  supabase_id   UUID UNIQUE NOT NULL,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  avatar_url    TEXT,
  phone         VARCHAR(20),
  city          VARCHAR(100),
  address       TEXT,
  gender        VARCHAR(20),
  role          VARCHAR(20)  NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.businesses (
  id            SERIAL PRIMARY KEY,
  owner_id      INT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name          VARCHAR(150) NOT NULL,
  name_ar       VARCHAR(150),
  description   TEXT,
  description_ar TEXT,
  category      VARCHAR(50)  NOT NULL DEFAULT 'general',
  address       VARCHAR(255),
  address_ar    VARCHAR(255),
  image_url     VARCHAR(512),
  is_active     BOOLEAN NOT NULL DEFAULT true,
  operating_days JSONB NOT NULL DEFAULT '[0,1,2,3,4,5,6]',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.queues (
  id                  SERIAL PRIMARY KEY,
  business_id         INT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name                VARCHAR(100) NOT NULL,
  name_ar             VARCHAR(100),
  is_open             BOOLEAN NOT NULL DEFAULT false,
  avg_service_time_min INT NOT NULL DEFAULT 10,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tickets (
  id              SERIAL PRIMARY KEY,
  queue_id        INT NOT NULL REFERENCES public.queues(id) ON DELETE CASCADE,
  user_id         INT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  ticket_number   INT NOT NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'waiting'
                    CHECK (status IN ('waiting','serving','done','cancelled','skipped')),
  target_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  notify_settings JSONB DEFAULT '[]',
  notified_events JSONB DEFAULT '[]',
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  called_at       TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  UNIQUE (queue_id, target_date, ticket_number)
);

CREATE TABLE IF NOT EXISTS public.queue_logs (
  id          SERIAL PRIMARY KEY,
  queue_id    INT NOT NULL REFERENCES public.queues(id) ON DELETE CASCADE,
  ticket_id   INT REFERENCES public.tickets(id) ON DELETE SET NULL,
  action      VARCHAR(50) NOT NULL,
  actor_id    INT REFERENCES public.users(id) ON DELETE SET NULL,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id          SERIAL PRIMARY KEY,
  user_id     INT REFERENCES public.users(id) ON DELETE CASCADE,
  title       VARCHAR(100),
  message     TEXT,
  is_read     BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════
-- PART 2: Indexes
-- ════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_users_supabase_id ON public.users(supabase_id);
CREATE INDEX IF NOT EXISTS idx_tickets_queue_status  ON public.tickets(queue_id, status);
CREATE INDEX IF NOT EXISTS idx_tickets_user          ON public.tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_queue_date     ON public.tickets(queue_id, target_date, status);
CREATE INDEX IF NOT EXISTS idx_queue_logs_queue      ON public.queue_logs(queue_id);
CREATE INDEX IF NOT EXISTS idx_businesses_owner      ON public.businesses(owner_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user    ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_unread  ON public.notifications(user_id, is_read) WHERE is_read = false;

-- ════════════════════════════════════════════════════════
-- PART 3: Helper Functions (used by the Express API)
-- ════════════════════════════════════════════════════════

-- Calls the next waiting ticket for a queue
CREATE OR REPLACE FUNCTION public.call_next_ticket(p_queue_id INT, p_target_date DATE)
RETURNS SETOF public.tickets
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_ticket public.tickets%ROWTYPE;
BEGIN
  UPDATE public.tickets SET status = 'serving', called_at = NOW()
  WHERE id = (
    SELECT id FROM public.tickets
    WHERE queue_id = p_queue_id AND status = 'waiting' AND target_date = p_target_date
    ORDER BY ticket_number LIMIT 1
  )
  RETURNING * INTO next_ticket;
  RETURN NEXT next_ticket;
END;
$$;

-- Gets weekly analytics (last 7 days)
CREATE OR REPLACE FUNCTION public.get_weekly_analytics(p_queue_id INT)
RETURNS TABLE(day TEXT, served BIGINT, noshow BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    TO_CHAR(d::DATE, 'Dy') AS day,
    COUNT(*) FILTER (WHERE t.status = 'done')::BIGINT AS served,
    COUNT(*) FILTER (WHERE t.status = 'skipped')::BIGINT AS noshow
  FROM generate_series(CURRENT_DATE - 6, CURRENT_DATE, '1 day') AS d
  LEFT JOIN public.tickets t ON t.queue_id = p_queue_id
    AND COALESCE(t.completed_at::date, t.target_date) = d::date
  GROUP BY d
  ORDER BY d;
END;
$$;

-- Gets average wait time in minutes for today
CREATE OR REPLACE FUNCTION public.get_avg_wait_min(p_queue_id INT)
RETURNS TABLE(avg_min NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT ROUND(AVG(EXTRACT(EPOCH FROM (called_at - joined_at))/60))::NUMERIC AS avg_min
  FROM public.tickets
  WHERE queue_id = p_queue_id AND called_at IS NOT NULL
    AND DATE(joined_at) = CURRENT_DATE;
END;
$$;

-- Gets hourly distribution of ticket joins for today
CREATE OR REPLACE FUNCTION public.get_hourly_distribution(p_queue_id INT)
RETURNS TABLE(hour DOUBLE PRECISION, count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT EXTRACT(HOUR FROM joined_at) AS hour, COUNT(*)::BIGINT AS count
  FROM public.tickets
  WHERE queue_id = p_queue_id AND DATE(joined_at) = CURRENT_DATE
  GROUP BY hour
  ORDER BY hour;
END;
$$;

-- ════════════════════════════════════════════════════════
-- PART 4: Row Level Security (optional — for direct client access)
-- ════════════════════════════════════════════════════════

-- Enable RLS on tables (optional — the Express API uses service_role key which bypasses RLS)
-- Uncomment if you want direct client-side Supabase access
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.queues ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.queue_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Example RLS policies (customize as needed):
-- CREATE POLICY "Users can view their own profile"
--   ON public.users FOR SELECT
--   USING (supabase_id = auth.uid());
--
-- CREATE POLICY "Public businesses are viewable by everyone"
--   ON public.businesses FOR SELECT
--   USING (is_active = true);
