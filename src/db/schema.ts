// Stage-1 schema for the data model entities described in ARCHITECTURE.md.
// Arrays (e.g. typical free windows) are stored as JSON text columns; there's
// only ever one UserProfile/Phase row for now (single-user, local-only app),
// keyed by a fixed 'current' id.
export const SCHEMA_SQL = `
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS user_profile (
  id TEXT PRIMARY KEY NOT NULL,
  baseline_free_time_weekday TEXT NOT NULL,
  baseline_free_time_weekend TEXT NOT NULL,
  typical_free_windows TEXT NOT NULL,
  work_schedule_type TEXT NOT NULL,
  caregiving_flag TEXT NOT NULL,
  physical_limitations INTEGER NOT NULL,
  gym_access TEXT NOT NULL,
  high_risk_windows TEXT NOT NULL,
  living_situation TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS daily_free_time_check (
  date TEXT PRIMARY KEY NOT NULL,
  response_type TEXT NOT NULL,
  adjusted_hours TEXT,
  adjusted_windows TEXT,
  source TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS phase (
  id TEXT PRIMARY KEY NOT NULL,
  current_phase TEXT NOT NULL,
  phase_start_date TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS domain_floor (
  domain TEXT PRIMARY KEY NOT NULL,
  weekly_minimum_minutes INTEGER NOT NULL,
  min_sessions_per_week INTEGER NOT NULL,
  notes TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS foundation_status (
  domain TEXT PRIMARY KEY NOT NULL,
  established_capacity_minutes INTEGER NOT NULL,
  current_activity_state TEXT NOT NULL,
  consecutive_days INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS schedule_slot (
  id TEXT PRIMARY KEY NOT NULL,
  date TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'timeboxed',
  time_window TEXT,
  domain TEXT NOT NULL,
  duration_minutes INTEGER,
  assigned_activity_id TEXT,
  equivalent_activity_id TEXT,
  status TEXT NOT NULL,
  phase_at_creation TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_schedule_slot_date ON schedule_slot(date);

CREATE TABLE IF NOT EXISTS assignment_library (
  id TEXT PRIMARY KEY NOT NULL,
  domain TEXT NOT NULL,
  tags TEXT NOT NULL,
  intensity_tier TEXT NOT NULL,
  description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS gaming_control_status (
  id TEXT PRIMARY KEY NOT NULL,
  state TEXT NOT NULL,
  signal_log TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS craving_event (
  id TEXT PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL,
  trigger_tag TEXT
);

CREATE INDEX IF NOT EXISTS idx_craving_event_timestamp ON craving_event(timestamp);

CREATE TABLE IF NOT EXISTS relapse_event (
  id TEXT PRIMARY KEY NOT NULL,
  date TEXT NOT NULL,
  severity TEXT NOT NULL,
  resulting_action TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_relapse_event_date ON relapse_event(date);

CREATE TABLE IF NOT EXISTS notification_settings (
  id TEXT PRIMARY KEY NOT NULL,
  intensity TEXT NOT NULL,
  notifications_paused INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS purchase_status (
  id TEXT PRIMARY KEY NOT NULL,
  is_unlocked INTEGER NOT NULL,
  purchase_date TEXT,
  platform TEXT
);

CREATE TABLE IF NOT EXISTS motivational_nudge_status (
  id TEXT PRIMARY KEY NOT NULL,
  last_spike_nudge_shown_at TEXT,
  fallback_nudge_shown INTEGER NOT NULL DEFAULT 0
);
`;
