CREATE TABLE IF NOT EXISTS cards (
 id TEXT PRIMARY KEY, nickname TEXT NOT NULL, tools TEXT NOT NULL,
 outlook TEXT NOT NULL, wish TEXT NOT NULL, interest TEXT,
 color INTEGER NOT NULL, created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS cards_created_at ON cards(created_at DESC);
