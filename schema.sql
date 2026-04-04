-- AIPS Complete Initial Schema Migration

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────────
-- 1. workers
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE workers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  zone_id TEXT NOT NULL,
  vehicle_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────
-- 2. zones
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  zri NUMERIC NOT NULL DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────
-- 3. work_history
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE work_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  hours_worked NUMERIC NOT NULL,
  orders_completed INTEGER NOT NULL,
  earnings NUMERIC NOT NULL,
  time_block TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_work_history_worker_id ON work_history(worker_id);

-- ─────────────────────────────────────────────────────────────────
-- 4. policies
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  weekly_premium NUMERIC NOT NULL,
  coverage_limit NUMERIC NOT NULL,
  bwe NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_policies_worker_id ON policies(worker_id);

-- ─────────────────────────────────────────────────────────────────
-- 5. simulation_events
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE simulation_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id UUID REFERENCES workers(id) ON DELETE SET NULL,
  zone_id UUID REFERENCES zones(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_simulation_events_worker_id ON simulation_events(worker_id);

-- ─────────────────────────────────────────────────────────────────
-- 6. trigger_runs
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE trigger_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  simulation_id UUID NOT NULL REFERENCES simulation_events(id) ON DELETE CASCADE,
  "TCS" NUMERIC NOT NULL,
  "US" NUMERIC NOT NULL,
  decision TEXT NOT NULL,
  exposure_score NUMERIC,
  signals_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_trigger_runs_simulation_id ON trigger_runs(simulation_id);

-- ─────────────────────────────────────────────────────────────────
-- 7. attribution_runs
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE attribution_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  simulation_id UUID NOT NULL REFERENCES simulation_events(id) ON DELETE CASCADE,
  expected_income NUMERIC NOT NULL,
  actual_income NUMERIC NOT NULL,
  raw_loss NUMERIC NOT NULL,
  causality_score NUMERIC NOT NULL,
  confidence_score NUMERIC NOT NULL,
  breakdown_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_attribution_runs_simulation_id ON attribution_runs(simulation_id);

-- ─────────────────────────────────────────────────────────────────
-- 8. fraud_runs
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE fraud_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  simulation_id UUID NOT NULL REFERENCES simulation_events(id) ON DELETE CASCADE,
  fraud_score NUMERIC NOT NULL,
  work_probability NUMERIC NOT NULL,
  signals_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_fraud_runs_simulation_id ON fraud_runs(simulation_id);

-- ─────────────────────────────────────────────────────────────────
-- 9. payout_runs
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE payout_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  simulation_id UUID NOT NULL REFERENCES simulation_events(id) ON DELETE CASCADE,
  base_loss NUMERIC NOT NULL,
  fraud_adjustment NUMERIC NOT NULL,
  multiplier NUMERIC NOT NULL,
  incentive_delta NUMERIC NOT NULL,
  final_payout NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_payout_runs_simulation_id ON payout_runs(simulation_id);

-- ─────────────────────────────────────────────────────────────────
-- 10. audit_logs
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  simulation_id UUID NOT NULL REFERENCES simulation_events(id) ON DELETE CASCADE,
  engine_name TEXT NOT NULL,
  decision TEXT NOT NULL,
  confidence NUMERIC NOT NULL,
  message TEXT NOT NULL,
  metadata_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_audit_logs_simulation_id ON audit_logs(simulation_id);

-- ─────────────────────────────────────────────────────────────────
-- SEED DATA
-- ─────────────────────────────────────────────────────────────────

-- Insert Zone
INSERT INTO zones (id, name, city, zri) VALUES 
('ebb7cde9-79ad-4bc6-848e-f495e8ebcbee', 'HSR Layout', 'Bangalore', 1.18);

-- Insert Worker (Rajan)
INSERT INTO workers (id, name, platform, zone_id, vehicle_type) VALUES 
('c5ae2517-c81b-426c-859a-14d9b62fef8b', 'Rajan', 'Zepto', 'ebb7cde9-79ad-4bc6-848e-f495e8ebcbee', 'Two Wheeler');

-- Insert realistic Work History (Last 7 days approx 700-900 / day)
INSERT INTO work_history (worker_id, date, hours_worked, orders_completed, earnings, time_block) VALUES 
('c5ae2517-c81b-426c-859a-14d9b62fef8b', CURRENT_DATE - INTERVAL '1 day', 8, 22, 850, 'evening'),
('c5ae2517-c81b-426c-859a-14d9b62fef8b', CURRENT_DATE - INTERVAL '2 days', 7.5, 19, 780, 'evening'),
('c5ae2517-c81b-426c-859a-14d9b62fef8b', CURRENT_DATE - INTERVAL '3 days', 9, 25, 950, 'afternoon'),
('c5ae2517-c81b-426c-859a-14d9b62fef8b', CURRENT_DATE - INTERVAL '4 days', 8, 21, 810, 'evening'),
('c5ae2517-c81b-426c-859a-14d9b62fef8b', CURRENT_DATE - INTERVAL '5 days', 6.5, 17, 690, 'morning'),
('c5ae2517-c81b-426c-859a-14d9b62fef8b', CURRENT_DATE - INTERVAL '6 days', 8.5, 23, 890, 'evening'),
('c5ae2517-c81b-426c-859a-14d9b62fef8b', CURRENT_DATE - INTERVAL '7 days', 7, 18, 720, 'afternoon');

-- Insert 1 Active Policy
INSERT INTO policies (id, worker_id, weekly_premium, coverage_limit, bwe, status) VALUES 
('bba59cd5-7313-4318-aecc-ca0ec1a65d02', 'c5ae2517-c81b-426c-859a-14d9b62fef8b', 165, 2958, 4500, 'active');
