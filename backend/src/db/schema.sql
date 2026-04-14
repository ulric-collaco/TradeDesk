-- Migration: 001_init.sql

CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email       TEXT UNIQUE NOT NULL,
  password    TEXT NOT NULL,              -- bcrypt hash
  role        TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at  INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS orders (
  id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol        TEXT NOT NULL,            -- e.g. BTC/USDT
  side          TEXT NOT NULL CHECK (side IN ('BUY', 'SELL')),
  order_type    TEXT NOT NULL CHECK (order_type IN ('MARKET', 'LIMIT')),
  quantity      REAL NOT NULL CHECK (quantity > 0),
  price         REAL,                     -- null for MARKET orders
  status        TEXT NOT NULL DEFAULT 'PENDING'
                CHECK (status IN ('PENDING', 'EXECUTED', 'CANCELLED', 'REJECTED')),
  created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at    INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS order_audit_log (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  order_id    TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  changed_by  TEXT NOT NULL REFERENCES users(id),
  from_status TEXT,
  to_status   TEXT NOT NULL,
  reason      TEXT,
  timestamp   INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_audit_order_id ON order_audit_log(order_id);
