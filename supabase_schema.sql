-- AcademiaSentinel Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────
-- TABLES
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS institutions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  domain TEXT UNIQUE NOT NULL,
  state TEXT,
  type TEXT DEFAULT 'University',
  aicte_id TEXT,
  naac_grade TEXT,
  student_count INTEGER DEFAULT 0,
  risk_score INTEGER DEFAULT 100 CHECK (risk_score BETWEEN 0 AND 100),
  last_scanned TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS threat_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_domain TEXT REFERENCES institutions(domain),
  institution_name TEXT,
  threat_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'LOW' CHECK (severity IN ('CRITICAL','HIGH','MEDIUM','LOW')),
  source TEXT CHECK (source IN ('HIBP','PASTE_SITE','TELEGRAM','DARK_WEB','MANUAL','GOOGLE_CSE')),
  source_url TEXT,
  title TEXT NOT NULL,
  description TEXT,
  raw_data JSONB,
  ai_analysis JSONB,
  status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN','INVESTIGATING','RESOLVED','FALSE_POSITIVE')),
  cert_in_reported BOOLEAN DEFAULT FALSE,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_url, institution_domain)
);

CREATE TABLE IF NOT EXISTS incident_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_id UUID REFERENCES threat_alerts(id),
  institution_domain TEXT,
  report_text TEXT NOT NULL,
  generated_by TEXT DEFAULT 'AcademiaSentinel-AI',
  submitted_to_cert_in BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scan_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domains_scanned INTEGER,
  alerts_found INTEGER,
  scan_duration_ms INTEGER,
  scanned_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rate limiting table (lightweight, no Redis needed)
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER DEFAULT 1,
  expires_at TIMESTAMPTZ NOT NULL
);
-- Auto-cleanup expired rate limit rows
CREATE INDEX IF NOT EXISTS rate_limits_expires_idx ON rate_limits(expires_at);

-- ─────────────────────────────────────────────
-- REALTIME
-- ─────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE threat_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE institutions;

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY — HARDENED
-- ─────────────────────────────────────────────
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE threat_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Helper: get role from JWT metadata
CREATE OR REPLACE FUNCTION auth_role() RETURNS TEXT AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'role'),
    'viewer'
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- institutions: read = any authenticated user; write = aicte_admin only
DROP POLICY IF EXISTS "Public read institutions" ON institutions;
DROP POLICY IF EXISTS "Service insert institutions" ON institutions;

CREATE POLICY "auth_read_institutions"
  ON institutions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "admin_write_institutions"
  ON institutions FOR INSERT
  TO authenticated
  WITH CHECK (auth_role() = 'aicte_admin');

CREATE POLICY "admin_update_institutions"
  ON institutions FOR UPDATE
  TO authenticated
  USING (auth_role() IN ('aicte_admin'))
  WITH CHECK (auth_role() IN ('aicte_admin'));

CREATE POLICY "admin_delete_institutions"
  ON institutions FOR DELETE
  TO authenticated
  USING (auth_role() = 'aicte_admin');

-- threat_alerts: read = authenticated; insert = service role only (via function)
DROP POLICY IF EXISTS "Public read alerts" ON threat_alerts;
DROP POLICY IF EXISTS "Service insert alerts" ON threat_alerts;

CREATE POLICY "auth_read_alerts"
  ON threat_alerts FOR SELECT
  TO authenticated
  USING (true);

-- incident_reports: read = aicte_admin + cert_in; insert = authenticated
DROP POLICY IF EXISTS "Public read reports" ON incident_reports;
DROP POLICY IF EXISTS "Service insert reports" ON incident_reports;

CREATE POLICY "privileged_read_reports"
  ON incident_reports FOR SELECT
  TO authenticated
  USING (auth_role() IN ('aicte_admin', 'cert_in'));

CREATE POLICY "auth_insert_reports"
  ON incident_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth_role() IN ('aicte_admin', 'cert_in'));

-- scan_logs: read = aicte_admin only
CREATE POLICY "admin_read_scan_logs"
  ON scan_logs FOR SELECT
  TO authenticated
  USING (auth_role() = 'aicte_admin');

-- rate_limits: service role only (no direct user access)
CREATE POLICY "no_user_access_rate_limits"
  ON rate_limits FOR ALL
  TO authenticated
  USING (false);

-- ─────────────────────────────────────────────
-- ROLE ASSIGNMENT TRIGGER
-- Prevents clients from self-assigning elevated roles.
-- New users always start as 'viewer'. Admin upgrades via DB only.
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION enforce_default_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Force role to 'viewer' for new signups regardless of what client sent
  NEW.raw_user_meta_data := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb) || '{"role": "viewer"}';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop if exists then recreate
DROP TRIGGER IF EXISTS enforce_role_on_signup ON auth.users;
CREATE TRIGGER enforce_role_on_signup
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION enforce_default_role();

-- To grant admin: run this in Supabase SQL Editor manually
-- UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{"role":"aicte_admin"}' WHERE email = 'admin@aicte.gov.in';

-- ─────────────────────────────────────────────
-- SEED DATA
-- ─────────────────────────────────────────────
INSERT INTO institutions (name, domain, state, type, naac_grade, student_count, risk_score) VALUES
('MIT World Peace University', 'mitwpu.edu.in', 'Maharashtra', 'Engineering', 'A+', 18000, 78),
('IIT Bombay', 'iitb.ac.in', 'Maharashtra', 'IIT', 'A++', 10000, 92),
('IIT Delhi', 'iitd.ac.in', 'Delhi', 'IIT', 'A++', 8500, 88),
('IIT Madras', 'iitm.ac.in', 'Tamil Nadu', 'IIT', 'A++', 9200, 85),
('IIT Kanpur', 'iitk.ac.in', 'Uttar Pradesh', 'IIT', 'A++', 7800, 83),
('BITS Pilani', 'bits-pilani.ac.in', 'Rajasthan', 'University', 'A', 15000, 71),
('VIT University', 'vit.ac.in', 'Tamil Nadu', 'Engineering', 'A++', 65000, 62),
('SRM University', 'srm.edu.in', 'Tamil Nadu', 'University', 'A++', 52000, 58),
('Amity University', 'amity.edu', 'Uttar Pradesh', 'University', 'A', 125000, 45),
('Manipal University', 'manipal.edu', 'Karnataka', 'University', 'A+', 28000, 67),
('LPU', 'lpu.in', 'Punjab', 'University', 'A+', 30000, 55),
('Christ University', 'christuniversity.in', 'Karnataka', 'University', 'A+', 22000, 72),
('Delhi University', 'du.ac.in', 'Delhi', 'University', 'A++', 300000, 41),
('BHU', 'bhu.ac.in', 'Uttar Pradesh', 'University', 'A', 35000, 38),
('JNU', 'jnu.ac.in', 'Delhi', 'University', 'A++', 8000, 76),
('University of Hyderabad', 'hyderabad.ac.in', 'Telangana', 'University', 'A+', 5500, 81)
ON CONFLICT (domain) DO NOTHING;

INSERT INTO threat_alerts (institution_domain, institution_name, threat_type, severity, source, title, description, detected_at) VALUES
('amity.edu', 'Amity University', 'CREDENTIAL_DUMP', 'HIGH', 'HIBP', 'Student credential dump detected on dark web', 'Approximately 12,000 student email credentials from amity.edu found in recent data breach dump.', NOW() - INTERVAL '2 days'),
('du.ac.in', 'Delhi University', 'EXAM_LEAK', 'HIGH', 'TELEGRAM', 'DU semester exam paper allegedly circulating on Telegram', 'Multiple Telegram groups sharing what appears to be B.Com Semester 4 Economics paper 3 weeks before exam.', NOW() - INTERVAL '5 hours'),
('vit.ac.in', 'VIT University', 'PHISHING', 'MEDIUM', 'PASTE_SITE', 'Phishing domain targeting VIT students detected', 'Domain mimicking official VIT admissions portal. Collecting student credentials.', NOW() - INTERVAL '1 day'),
('lpu.in', 'LPU', 'DATA_BREACH', 'CRITICAL', 'DARK_WEB', 'LPU student PII database listed for sale', 'Database containing 28,000 student records including Aadhaar numbers listed on dark web.', NOW() - INTERVAL '3 hours'),
('srm.edu.in', 'SRM University', 'FAKE_DOCUMENT', 'MEDIUM', 'PASTE_SITE', 'Fake SRM degree certificates being sold online', 'Online seller offering fake SRM University degree certificates for ₹15,000.', NOW() - INTERVAL '12 hours'),
('bits-pilani.ac.in', 'BITS Pilani', 'RESEARCH_THEFT', 'HIGH', 'MANUAL', 'BITS Pilani research paper stolen before publication', 'Unpublished semiconductor research appears submitted to foreign patent office before Indian publication.', NOW() - INTERVAL '2 hours')
ON CONFLICT DO NOTHING;
