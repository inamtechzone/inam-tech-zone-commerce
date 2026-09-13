CREATE TABLE IF NOT EXISTS store_records (
  collection TEXT NOT NULL,
  record_id TEXT NOT NULL,
  data TEXT NOT NULL CHECK (json_valid(data)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (collection, record_id)
) WITHOUT ROWID;

CREATE INDEX IF NOT EXISTS idx_store_records_collection_updated
ON store_records (collection, updated_at DESC);

CREATE TABLE IF NOT EXISTS store_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
) WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
) WITHOUT ROWID;

CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires
ON admin_sessions (expires_at);

PRAGMA optimize;
