-- QueueLess Database Schema
-- Normalized to 3NF

-- ============================================================
-- USERS
-- Stores both customer and admin/business-owner accounts
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  phone      VARCHAR(20),
  city       VARCHAR(100),
  address    TEXT,
  gender     VARCHAR(20),
  role       VARCHAR(20)  NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BUSINESSES
-- Each business belongs to exactly one admin user (owner)
-- ============================================================
CREATE TABLE IF NOT EXISTS businesses (
  id          SERIAL PRIMARY KEY,
  owner_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(150) NOT NULL,
  description TEXT,
  category    VARCHAR(50)  NOT NULL DEFAULT 'general',
  address     VARCHAR(255),
  image_url   VARCHAR(512),
  is_active   BOOLEAN NOT NULL DEFAULT true,
  operating_days JSONB NOT NULL DEFAULT '[0,1,2,3,4,5,6]',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- QUEUES
-- A business can have multiple queues (e.g. Consultation, Lab)
-- ============================================================
CREATE TABLE IF NOT EXISTS queues (
  id          SERIAL PRIMARY KEY,
  business_id INT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,
  is_open     BOOLEAN NOT NULL DEFAULT false,
  avg_service_time_min INT NOT NULL DEFAULT 10,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TICKETS
-- A ticket is a single user's place in a single queue
-- status: waiting | serving | done | cancelled | skipped
-- ============================================================
CREATE TABLE IF NOT EXISTS tickets (
  id            SERIAL PRIMARY KEY,
  queue_id      INT NOT NULL REFERENCES queues(id) ON DELETE CASCADE,
  user_id       INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticket_number INT NOT NULL,
  status        VARCHAR(20) NOT NULL DEFAULT 'waiting'
                  CHECK (status IN ('waiting','serving','done','cancelled','skipped')),
  target_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  notify_settings JSONB DEFAULT '[]',
  notified_events JSONB DEFAULT '[]',
  joined_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  called_at     TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  -- Composite unique: each queue can only have one ticket per number per date
  UNIQUE (queue_id, target_date, ticket_number)
);

-- ============================================================
-- QUEUE LOGS
-- Audit trail for every queue state change (supports analytics)
-- ============================================================
CREATE TABLE IF NOT EXISTS queue_logs (
  id         SERIAL PRIMARY KEY,
  queue_id   INT NOT NULL REFERENCES queues(id) ON DELETE CASCADE,
  ticket_id  INT REFERENCES tickets(id) ON DELETE SET NULL,
  action     VARCHAR(50) NOT NULL,   -- 'open','close','call','skip','done','cancel'
  actor_id   INT REFERENCES users(id) ON DELETE SET NULL,
  metadata   JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS
-- In-app notifications directed to specific users
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id         SERIAL PRIMARY KEY,
  user_id    INT REFERENCES users(id) ON DELETE CASCADE,
  title      VARCHAR(100),
  message    TEXT,
  is_read    BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES  (performance for common queries)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_tickets_queue_status  ON tickets(queue_id, status);
CREATE INDEX IF NOT EXISTS idx_tickets_user          ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_queue_logs_queue      ON queue_logs(queue_id);
CREATE INDEX IF NOT EXISTS idx_businesses_owner      ON businesses(owner_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user    ON notifications(user_id, is_read);
