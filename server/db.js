require('dotenv').config();
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'blockdraft.db');
const db = new Database(DB_PATH);

db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS sections (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    type        TEXT NOT NULL CHECK(type IN ('education','technical-projects','work-experience','clubs-and-organization','skills','certifications','awards')),
    order_index INTEGER NOT NULL DEFAULT 0,
    is_visible  INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS entries (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    section_id  INTEGER NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    title       TEXT DEFAULT '',
    subtitle    TEXT DEFAULT '',
    date        TEXT DEFAULT '',
    extra       TEXT DEFAULT '',
    is_selected INTEGER NOT NULL DEFAULT 1,
    order_index INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS bullets (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_id    INTEGER NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
    text        TEXT NOT NULL DEFAULT '',
    is_selected INTEGER NOT NULL DEFAULT 1,
    order_index INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS config (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// Migrate legacy section types (experience/awards/certs) to resume-matching type set
const legacyCount = db.prepare(
  "SELECT COUNT(*) as n FROM sections WHERE type IN ('experience','awards','certs')"
).get().n;

if (legacyCount > 0) {
  // Delete awards/certs first — FK ON ensures cascade to entries + bullets
  db.prepare("DELETE FROM sections WHERE type IN ('awards','certs')").run();

  // Rebuild sections table with new constraint, mapping experience rows by name
  db.pragma('foreign_keys = OFF');
  db.exec(`
    CREATE TABLE sections_new (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      type        TEXT NOT NULL CHECK(type IN ('education','technical-projects','work-experience','clubs-and-organization','skills','certifications','awards')),
      order_index INTEGER NOT NULL DEFAULT 0,
      is_visible  INTEGER NOT NULL DEFAULT 1
    );
    INSERT INTO sections_new (id, name, type, order_index, is_visible)
      SELECT id, name,
        CASE
          WHEN type = 'education' THEN 'education'
          WHEN type = 'skills'    THEN 'skills'
          WHEN type = 'experience' AND (name LIKE '%Technical%' OR name LIKE '%Project%') THEN 'technical-projects'
          WHEN type = 'experience' AND (name LIKE '%Club%' OR name LIKE '%Organ%') THEN 'clubs-and-organization'
          ELSE 'work-experience'
        END,
        order_index, is_visible
      FROM sections
      WHERE type IN ('experience','education','skills');
    DROP TABLE sections;
    ALTER TABLE sections_new RENAME TO sections;
  `);
  db.pragma('foreign_keys = ON');
}

// Migrate: expand CHECK constraint to include certifications + awards if missing
const schemaSql = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='sections'").get()?.sql || '';
if (!schemaSql.includes('certifications')) {
  db.pragma('foreign_keys = OFF');
  db.exec(`
    CREATE TABLE sections_new (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      type        TEXT NOT NULL CHECK(type IN ('education','technical-projects','work-experience','clubs-and-organization','skills','certifications','awards')),
      order_index INTEGER NOT NULL DEFAULT 0,
      is_visible  INTEGER NOT NULL DEFAULT 1
    );
    INSERT INTO sections_new SELECT * FROM sections;
    DROP TABLE sections;
    ALTER TABLE sections_new RENAME TO sections;
  `);
  db.pragma('foreign_keys = ON');
}

module.exports = db;
