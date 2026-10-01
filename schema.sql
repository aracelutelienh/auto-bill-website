PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL DEFAULT 'Khách hàng',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  customer_unread INTEGER NOT NULL DEFAULT 0,
  admin_unread INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  sender TEXT NOT NULL CHECK(sender IN ('customer','admin')),
  text TEXT NOT NULL DEFAULT '',
  image_key TEXT,
  image_type TEXT,
  image_name TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY(conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
ON messages(conversation_id, created_at);

CREATE INDEX IF NOT EXISTS idx_conversations_updated
ON conversations(updated_at DESC);
