# BlockDraft Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a desktop block-based resume editor (ElectronJS + Express + SQLite + Vanilla JS) that scores 93+ on Lighthouse and earns an A-grade on the CSC3100 final.

**Architecture:** Express REST API on localhost:3001 serves static files from `public/` and provides JSON endpoints for sections/entries/bullets/config/AI. The frontend is a single `index.html` SPA with ES6 module JS. CellFactory renders type-aware editable cells on a paper canvas. Autosave fires on blur via `focusout` delegation. Electron wraps the whole thing after dev is complete.

**Tech Stack:** Node.js 18+, Express 4, better-sqlite3, @google/generative-ai SDK, Tailwind CSS (compiled locally), Vanilla JS ES6 modules, ElectronJS (Phase 4)

---

## File Map

| File | Responsibility |
|---|---|
| `server/db.js` | SQLite connection, PRAGMA, CREATE TABLE IF NOT EXISTS |
| `server/app.js` | Express setup, static files, route mounting, conditional listen |
| `server/routes/resume.js` | GET /api/resume — full nested JSON for app load |
| `server/routes/sections.js` | CRUD for sections table |
| `server/routes/entries.js` | CRUD for entries table |
| `server/routes/bullets.js` | CRUD for bullets table |
| `server/routes/config.js` | GET/PUT /api/config/:key — stores Gemini key |
| `server/routes/ai.js` | POST /api/ai/refine — calls Gemini SDK server-side |
| `public/index.html` | Single HTML file; all UI elements; loads core.js as module |
| `public/css/tailwind.css` | Compiled Tailwind output (run build:css) |
| `public/css/print.css` | @media print rules |
| `public/js/state.js` | Exports `resumeData = { sections: [] }` — shared mutable state |
| `public/js/api.js` | fetch() wrappers for every Express route |
| `public/js/ai.js` | Thin wrapper: `refine(type, input)` → calls api.refineText |
| `public/js/cells/CellFactory.js` | `static create(type, data)` switch — returns cell instance |
| `public/js/cells/ExperienceCell.js` | `renderView()` / `renderEdit()` for experience entries |
| `public/js/cells/EducationCell.js` | `renderView()` / `renderEdit()` for education entries |
| `public/js/cells/SkillCell.js` | `renderView()` / `renderEdit()` for skills entries |
| `public/js/cells/AwardCell.js` | `renderView()` / `renderEdit()` for awards/certs entries |
| `public/js/ui.js` | `renderCanvas()`, `swapToEdit()`, `swapToView()`, toolbar injection |
| `public/js/core.js` | App init, event delegation, blur-save, toolbar actions, menus |
| `main.js` | Electron entry: spawns Express child process, creates BrowserWindow |
| `tailwind.config.js` | Tailwind content paths for purging |
| `src/tailwind.css` | @tailwind directives source file |
| `tests/server/resume.test.js` | supertest tests for REST routes |

---

## Task 1: Project Initialization

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `tailwind.config.js`
- Create: `src/tailwind.css`
- Create: `public/css/print.css` (stub)
- Create all directories

- [ ] **Step 1: Create folder structure**

```bash
mkdir -p server/routes public/css public/js/cells public/assets public/vendor src tests/server docs/superpowers/plans
```

- [ ] **Step 2: Write package.json**

```json
{
  "name": "blockdraft",
  "version": "1.0.0",
  "description": "Block-based resume editor — CSC3100 Final",
  "main": "main.js",
  "scripts": {
    "start": "node server/app.js",
    "electron": "electron .",
    "test": "jest",
    "build:css": "tailwindcss -i ./src/tailwind.css -o ./public/css/tailwind.css --minify"
  },
  "dependencies": {
    "@google/generative-ai": "^0.21.0",
    "better-sqlite3": "^9.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.18.3"
  },
  "devDependencies": {
    "electron": "^29.1.4",
    "jest": "^29.7.0",
    "supertest": "^6.3.4",
    "tailwindcss": "^3.4.1"
  },
  "jest": {
    "testMatch": ["**/tests/server/**/*.test.js"],
    "testEnvironment": "node"
  }
}
```

- [ ] **Step 3: Write .gitignore**

```
node_modules/
.env
*.db
```

- [ ] **Step 4: Write tailwind.config.js**

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './public/index.html',
    './public/js/**/*.js',
  ],
  theme: { extend: {} },
  plugins: [],
}
```

- [ ] **Step 5: Write src/tailwind.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 6: Create stub print.css**

```css
/* Print rules added in Task 8 */
```

- [ ] **Step 7: Create .env template**

Create a file named `.env.example` (NOT `.env`) at the project root:

```
GEMINI_API_KEY=your_key_here
PORT=3001
```

- [ ] **Step 8: Install dependencies**

```bash
npm install
```

Expected: `node_modules/` populated, no errors.

- [ ] **Step 9: Build Tailwind CSS**

```bash
npm run build:css
```

Expected: `public/css/tailwind.css` created (~3KB minified with no content to scan yet, will grow as HTML is added).

- [ ] **Step 10: Create ai_usage.log**

```
# BlockDraft — AI Usage Log
# This file documents all use of generative AI in this project.
# Format: [date] | tool | purpose | files affected

[2026-05-03] | Claude Code (claude-sonnet-4-6) | Architecture design, implementation planning | docs/superpowers/
```

- [ ] **Step 11: Commit**

```bash
git add package.json .gitignore tailwind.config.js src/tailwind.css public/css/print.css public/css/tailwind.css .env.example ai_usage.log
git commit -m "chore: project initialization, Tailwind build, folder structure"
```

---

## Task 2: Database Layer

**Files:**
- Create: `server/db.js`

- [ ] **Step 1: Write server/db.js**

```javascript
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
    type        TEXT NOT NULL CHECK(type IN ('experience','education','skills','awards','certs')),
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

module.exports = db;
```

- [ ] **Step 2: Verify DB creation manually**

```bash
node -e "const db = require('./server/db'); console.log(db.prepare(\"SELECT name FROM sqlite_master WHERE type='table'\").all());"
```

Expected output:
```
[
  { name: 'sections' },
  { name: 'entries' },
  { name: 'bullets' },
  { name: 'config' }
]
```

- [ ] **Step 3: Commit**

```bash
git add server/db.js
git commit -m "feat: SQLite schema with foreign keys and WAL mode"
```

---

## Task 3: Express App + Resume Route

**Files:**
- Create: `server/app.js`
- Create: `server/routes/resume.js`

- [ ] **Step 1: Write server/routes/resume.js**

```javascript
const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const sections = db.prepare('SELECT * FROM sections ORDER BY order_index').all();
  for (const section of sections) {
    const entries = db.prepare(
      'SELECT * FROM entries WHERE section_id = ? ORDER BY order_index'
    ).all(section.id);
    for (const entry of entries) {
      entry.bullets = db.prepare(
        'SELECT * FROM bullets WHERE entry_id = ? ORDER BY order_index'
      ).all(entry.id);
    }
    section.entries = entries;
  }
  res.json(sections);
});

module.exports = router;
```

- [ ] **Step 2: Write server/app.js**

```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api/resume',   require('./routes/resume'));
app.use('/api/sections', require('./routes/sections'));
app.use('/api/entries',  require('./routes/entries'));
app.use('/api/bullets',  require('./routes/bullets'));
app.use('/api/config',   require('./routes/config'));
app.use('/api/ai',       require('./routes/ai'));

if (require.main === module) {
  app.listen(PORT, () => console.log(`BlockDraft server on http://localhost:${PORT}`));
}

module.exports = app;
```

- [ ] **Step 3: Create stub route files so app.js doesn't crash on require**

Create `server/routes/sections.js`:
```javascript
const express = require('express');
module.exports = express.Router();
```

Create `server/routes/entries.js`:
```javascript
const express = require('express');
module.exports = express.Router();
```

Create `server/routes/bullets.js`:
```javascript
const express = require('express');
module.exports = express.Router();
```

Create `server/routes/config.js`:
```javascript
const express = require('express');
module.exports = express.Router();
```

Create `server/routes/ai.js`:
```javascript
const express = require('express');
module.exports = express.Router();
```

- [ ] **Step 4: Verify server starts**

```bash
npm start
```

Expected: `BlockDraft server on http://localhost:3001`

Open `http://localhost:3001/api/resume` in browser. Expected: `[]` (empty array).

Stop server with Ctrl+C.

- [ ] **Step 5: Commit**

```bash
git add server/app.js server/routes/
git commit -m "feat: Express app with resume route and static file serving"
```

---

## Task 4: CRUD Routes

**Files:**
- Modify: `server/routes/sections.js`
- Modify: `server/routes/entries.js`
- Modify: `server/routes/bullets.js`

- [ ] **Step 1: Write server/routes/sections.js**

```javascript
const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM sections ORDER BY order_index').all());
});

router.post('/', (req, res) => {
  const { name, type, order_index = 0 } = req.body;
  const result = db.prepare(
    'INSERT INTO sections (name, type, order_index) VALUES (?, ?, ?)'
  ).run(name, type, order_index);
  res.status(201).json({ id: result.lastInsertRowid, name, type, order_index, is_visible: 1 });
});

router.patch('/:id', (req, res) => {
  const allowed = ['name', 'order_index', 'is_visible'];
  const updates = allowed.filter(f => req.body[f] !== undefined);
  if (!updates.length) return res.status(400).json({ error: 'No valid fields to update' });
  const sql = `UPDATE sections SET ${updates.map(f => `${f} = ?`).join(', ')} WHERE id = ?`;
  db.prepare(sql).run(...updates.map(f => req.body[f]), req.params.id);
  res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM sections WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
```

- [ ] **Step 2: Write server/routes/entries.js**

```javascript
const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const { sectionId } = req.query;
  if (!sectionId) return res.status(400).json({ error: 'sectionId required' });
  res.json(db.prepare(
    'SELECT * FROM entries WHERE section_id = ? ORDER BY order_index'
  ).all(sectionId));
});

router.post('/', (req, res) => {
  const { section_id, title = '', subtitle = '', date = '', extra = '', order_index = 0 } = req.body;
  const result = db.prepare(
    'INSERT INTO entries (section_id, title, subtitle, date, extra, order_index) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(section_id, title, subtitle, date, extra, order_index);
  res.status(201).json({
    id: result.lastInsertRowid, section_id, title, subtitle, date, extra, is_selected: 1, order_index
  });
});

router.patch('/:id', (req, res) => {
  const allowed = ['title', 'subtitle', 'date', 'extra', 'is_selected', 'order_index'];
  const updates = allowed.filter(f => req.body[f] !== undefined);
  if (!updates.length) return res.status(400).json({ error: 'No valid fields to update' });
  const sql = `UPDATE entries SET ${updates.map(f => `${f} = ?`).join(', ')} WHERE id = ?`;
  db.prepare(sql).run(...updates.map(f => req.body[f]), req.params.id);
  res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM entries WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
```

- [ ] **Step 3: Write server/routes/bullets.js**

```javascript
const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const { entryId } = req.query;
  if (!entryId) return res.status(400).json({ error: 'entryId required' });
  res.json(db.prepare(
    'SELECT * FROM bullets WHERE entry_id = ? ORDER BY order_index'
  ).all(entryId));
});

router.post('/', (req, res) => {
  const { entry_id, text = '', order_index = 0 } = req.body;
  const result = db.prepare(
    'INSERT INTO bullets (entry_id, text, order_index) VALUES (?, ?, ?)'
  ).run(entry_id, text, order_index);
  res.status(201).json({ id: result.lastInsertRowid, entry_id, text, is_selected: 1, order_index });
});

router.patch('/:id', (req, res) => {
  const allowed = ['text', 'is_selected', 'order_index'];
  const updates = allowed.filter(f => req.body[f] !== undefined);
  if (!updates.length) return res.status(400).json({ error: 'No valid fields to update' });
  const sql = `UPDATE bullets SET ${updates.map(f => `${f} = ?`).join(', ')} WHERE id = ?`;
  db.prepare(sql).run(...updates.map(f => req.body[f]), req.params.id);
  res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM bullets WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
```

- [ ] **Step 4: Commit**

```bash
git add server/routes/sections.js server/routes/entries.js server/routes/bullets.js
git commit -m "feat: CRUD routes for sections, entries, bullets"
```

---

## Task 5: Config & AI Routes

**Files:**
- Modify: `server/routes/config.js`
- Modify: `server/routes/ai.js`

- [ ] **Step 1: Write server/routes/config.js**

```javascript
const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/:key', (req, res) => {
  const row = db.prepare('SELECT value FROM config WHERE key = ?').get(req.params.key);
  if (!row) return res.status(404).json({ error: 'Key not found' });
  res.json({ key: req.params.key, value: row.value });
});

router.put('/:key', (req, res) => {
  const { value } = req.body;
  if (!value) return res.status(400).json({ error: 'value required' });
  db.prepare('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)').run(req.params.key, value);
  res.json({ ok: true });
});

module.exports = router;
```

- [ ] **Step 2: Write server/routes/ai.js**

```javascript
const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('../db');

function buildPrompt(type, input) {
  switch (type) {
    case 'experience':
      return `Rewrite as an impact-driven resume bullet point. Start with an action verb. Include a measurable outcome if possible. Return ONLY the rewritten bullet, no explanation, no prefix. Input: ${input}`;
    case 'skills':
      return `Given these skills: ${input}. Suggest 3 missing high-value keywords for a software developer role. Return ONLY a comma-separated list, no explanation.`;
    case 'awards':
    case 'certs':
      return `Rewrite this award or certification description to sound more professional and concise. Return ONLY the rewritten text. Input: ${input}`;
    case 'education':
      return `Write one professional sentence highlighting academic achievement based on: ${input}. Return ONLY the sentence.`;
    default:
      return `Improve this resume text to be more professional and concise. Return ONLY the improved text: ${input}`;
  }
}

function getApiKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  try {
    const row = db.prepare('SELECT value FROM config WHERE key = ?').get('gemini_key');
    return row ? row.value : null;
  } catch {
    return null;
  }
}

router.post('/refine', async (req, res) => {
  const { type, input } = req.body;
  if (!input) return res.status(400).json({ error: 'input required' });

  const apiKey = getApiKey();
  if (!apiKey) return res.status(400).json({ error: 'No Gemini API key configured. Add it in Settings.' });

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(buildPrompt(type, input));
    const refined = result.response.text().trim();
    res.json({ refined });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
```

- [ ] **Step 3: Test config route manually**

Start server: `npm start`

```bash
curl -X PUT http://localhost:3001/api/config/test_key \
  -H "Content-Type: application/json" \
  -d '{"value":"hello"}'
```
Expected: `{"ok":true}`

```bash
curl http://localhost:3001/api/config/test_key
```
Expected: `{"key":"test_key","value":"hello"}`

Stop server.

- [ ] **Step 4: Commit**

```bash
git add server/routes/config.js server/routes/ai.js
git commit -m "feat: config key-value store and Gemini AI refine route"
```

---

## Task 6: Server Tests

**Files:**
- Create: `tests/server/resume.test.js`

- [ ] **Step 1: Write failing tests first**

Create `tests/server/resume.test.js`:

```javascript
const path = require('path');
process.env.DB_PATH = path.join(__dirname, 'test.db');

const request = require('supertest');
const app = require('../../server/app');
const db = require('../../server/db');
const fs = require('fs');

beforeEach(() => {
  db.exec('DELETE FROM bullets; DELETE FROM entries; DELETE FROM sections; DELETE FROM config;');
});

afterAll(() => {
  db.close();
  try { fs.unlinkSync(process.env.DB_PATH); } catch {}
});

describe('GET /api/resume', () => {
  test('returns empty array when no data', async () => {
    const res = await request(app).get('/api/resume');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('returns nested sections with entries and bullets', async () => {
    const sec = db.prepare(
      "INSERT INTO sections (name, type, order_index) VALUES ('Work Experience', 'experience', 0)"
    ).run();
    const ent = db.prepare(
      'INSERT INTO entries (section_id, title, order_index) VALUES (?, ?, 0)'
    ).run(sec.lastInsertRowid, 'Acme Corp');
    db.prepare(
      'INSERT INTO bullets (entry_id, text, order_index) VALUES (?, ?, 0)'
    ).run(ent.lastInsertRowid, 'Built scalable systems');

    const res = await request(app).get('/api/resume');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Work Experience');
    expect(res.body[0].entries).toHaveLength(1);
    expect(res.body[0].entries[0].title).toBe('Acme Corp');
    expect(res.body[0].entries[0].bullets).toHaveLength(1);
    expect(res.body[0].entries[0].bullets[0].text).toBe('Built scalable systems');
  });
});

describe('POST /api/sections', () => {
  test('creates a section and returns it with id', async () => {
    const res = await request(app)
      .post('/api/sections')
      .send({ name: 'Work Experience', type: 'experience', order_index: 0 });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.name).toBe('Work Experience');
    expect(res.body.type).toBe('experience');
  });
});

describe('DELETE /api/sections/:id cascade', () => {
  test('deletes entries and bullets when section is deleted', async () => {
    const sec = db.prepare(
      "INSERT INTO sections (name, type, order_index) VALUES ('Test', 'experience', 0)"
    ).run();
    const ent = db.prepare(
      'INSERT INTO entries (section_id, title, order_index) VALUES (?, ?, 0)'
    ).run(sec.lastInsertRowid, 'Job');
    db.prepare(
      'INSERT INTO bullets (entry_id, text, order_index) VALUES (?, ?, 0)'
    ).run(ent.lastInsertRowid, 'Did stuff');

    const res = await request(app).delete(`/api/sections/${sec.lastInsertRowid}`);
    expect(res.status).toBe(200);

    expect(db.prepare('SELECT * FROM entries').all()).toHaveLength(0);
    expect(db.prepare('SELECT * FROM bullets').all()).toHaveLength(0);
  });
});

describe('PATCH /api/entries/:id', () => {
  test('updates entry title', async () => {
    const sec = db.prepare(
      "INSERT INTO sections (name, type, order_index) VALUES ('Work', 'experience', 0)"
    ).run();
    const ent = db.prepare(
      'INSERT INTO entries (section_id, title, order_index) VALUES (?, ?, 0)'
    ).run(sec.lastInsertRowid, 'Old Title');

    const res = await request(app)
      .patch(`/api/entries/${ent.lastInsertRowid}`)
      .send({ title: 'New Title' });
    expect(res.status).toBe(200);

    const updated = db.prepare('SELECT title FROM entries WHERE id = ?').get(ent.lastInsertRowid);
    expect(updated.title).toBe('New Title');
  });
});

describe('GET /api/config/:key', () => {
  test('returns 404 for missing key', async () => {
    const res = await request(app).get('/api/config/nonexistent');
    expect(res.status).toBe(404);
  });

  test('returns value after PUT', async () => {
    await request(app).put('/api/config/gemini_key').send({ value: 'test-key-123' });
    const res = await request(app).get('/api/config/gemini_key');
    expect(res.status).toBe(200);
    expect(res.body.value).toBe('test-key-123');
  });
});
```

- [ ] **Step 2: Run tests — expect PASS**

```bash
npm test
```

Expected:
```
PASS tests/server/resume.test.js
  GET /api/resume
    ✓ returns empty array when no data
    ✓ returns nested sections with entries and bullets
  POST /api/sections
    ✓ creates a section and returns it with id
  DELETE /api/sections/:id cascade
    ✓ deletes entries and bullets when section is deleted
  PATCH /api/entries/:id
    ✓ updates entry title
  GET /api/config/:key
    ✓ returns 404 for missing key
    ✓ returns value after PUT

Test Suites: 1 passed, 1 total
Tests:       7 passed, 7 total
```

If cascade test fails with entries still present: verify `db.pragma('foreign_keys = ON')` is set in `db.js` before `db.exec(schema)`. The pragma must be set per connection — confirm the test DB connection sets it.

- [ ] **Step 3: Commit**

```bash
git add tests/server/resume.test.js
git commit -m "test: supertest coverage for resume, sections, entries, config routes"
```

---

## Task 7: HTML Shell

**Files:**
- Create: `public/index.html`

- [ ] **Step 1: Write public/index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BlockDraft — Resume Editor</title>
  <meta name="description" content="Block-based resume editor for tailoring and printing professional resumes">
  <link rel="icon" href="assets/favicon.ico" type="image/x-icon">
  <link rel="stylesheet" href="css/tailwind.css">
  <link rel="stylesheet" href="css/print.css">
</head>
<body class="bg-gray-200 min-h-screen">

  <!-- ===== HEADER ===== -->
  <header class="bg-white shadow-sm px-6 py-3 flex items-center justify-between no-print"
    role="banner">
    <div class="flex items-center gap-2">
      <img src="assets/favicon.ico" alt="" class="w-6 h-6" aria-hidden="true">
      <span class="font-bold text-gray-900 text-xl tracking-tight">BlockDraft</span>
    </div>
    <nav class="flex gap-2" aria-label="Application actions">
      <button id="settings-btn"
        class="px-3 py-1.5 text-sm bg-gray-100 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
        aria-label="Open settings panel" aria-expanded="false" aria-controls="settings-panel">
        ⚙ Settings
      </button>
      <button id="print-btn"
        class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
        aria-label="Print resume or export as PDF">
        ⎙ Print / PDF
      </button>
      <button id="thanks-btn"
        class="px-3 py-1.5 text-sm bg-gray-100 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
        aria-label="View library attributions">
        ♥ Credits
      </button>
    </nav>
  </header>

  <!-- ===== SETTINGS PANEL ===== -->
  <div id="settings-panel"
    class="hidden fixed top-14 right-4 bg-white border border-gray-200 rounded-lg shadow-xl p-5 w-80 z-50 no-print"
    role="dialog" aria-modal="true" aria-label="Settings">
    <h2 class="font-semibold text-gray-900 mb-3">Gemini API Key</h2>
    <p class="text-xs text-gray-500 mb-2">
      Get a free key at
      <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener"
        class="text-blue-600 underline">Google AI Studio</a>.
      Stored locally — never sent anywhere except Google.
    </p>
    <label for="api-key-input" class="text-xs font-medium text-gray-700 block mb-1">
      API Key
    </label>
    <input id="api-key-input" type="password" placeholder="AIza..."
      class="w-full border border-gray-300 rounded px-3 py-1.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
      aria-label="Gemini API key">
    <button id="save-key-btn"
      class="w-full bg-blue-600 text-white text-sm py-1.5 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
      aria-label="Save API key">
      Save Key
    </button>
  </div>

  <!-- ===== CREDITS MODAL ===== -->
  <div id="thanks-modal"
    class="hidden fixed inset-0 bg-black/50 flex items-center justify-center z-50 no-print"
    role="dialog" aria-modal="true" aria-label="Library Credits">
    <div class="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl">
      <h2 class="font-bold text-lg mb-4 text-gray-900">Built With ♥</h2>
      <ul class="text-sm text-gray-700 space-y-2 list-disc ml-4">
        <li><strong>Tailwind CSS</strong> — Utility-first CSS (MIT)</li>
        <li><strong>Express.js</strong> — Node.js web framework (MIT)</li>
        <li><strong>better-sqlite3</strong> — SQLite for Node.js (MIT)</li>
        <li><strong>Google Generative AI SDK</strong> — Gemini API client (Apache 2.0)</li>
        <li><strong>Electron</strong> — Desktop app wrapper (MIT)</li>
        <li><strong>dotenv</strong> — Environment variable loader (BSD-2)</li>
        <li><strong>cors</strong> — CORS middleware for Express (MIT)</li>
      </ul>
      <button id="close-thanks"
        class="mt-5 w-full bg-gray-100 rounded py-1.5 text-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
        aria-label="Close credits dialog">
        Close
      </button>
    </div>
  </div>

  <!-- ===== MAIN LAYOUT ===== -->
  <main class="flex gap-6 p-8 justify-center items-start" role="main" aria-label="Resume editor">

    <!-- Paper Canvas -->
    <div class="relative">
      <div id="page-canvas"
        class="bg-white shadow-2xl p-12 relative"
        style="width: 8.5in; min-height: 11in;"
        role="region"
        aria-label="Resume canvas — click any entry to edit">
        <!-- Resume sections rendered dynamically by JavaScript -->
        <p class="text-gray-400 text-sm text-center mt-4" id="empty-hint">
          Click "Add Section" to get started.
        </p>
      </div>
    </div>

    <!-- Sidebar Controls -->
    <aside class="no-print pt-2 flex flex-col gap-3" aria-label="Editor controls">

      <!-- Add Section dropdown -->
      <div class="relative">
        <button id="add-btn"
          class="w-full px-4 py-2 bg-green-600 text-white rounded shadow hover:bg-green-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-400"
          aria-label="Add a resume section" aria-haspopup="true" aria-expanded="false"
          aria-controls="add-menu">
          + Add Section
        </button>
        <ul id="add-menu"
          class="hidden absolute top-10 left-0 bg-white border border-gray-200 rounded-lg shadow-lg w-48 text-sm z-10"
          role="menu" aria-label="Choose section type">
          <li role="presentation">
            <button class="w-full text-left px-4 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
              data-type="experience" role="menuitem">
              💼 Work Experience
            </button>
          </li>
          <li role="presentation">
            <button class="w-full text-left px-4 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
              data-type="education" role="menuitem">
              🎓 Education
            </button>
          </li>
          <li role="presentation">
            <button class="w-full text-left px-4 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
              data-type="skills" role="menuitem">
              💡 Skills Category
            </button>
          </li>
          <li role="presentation">
            <button class="w-full text-left px-4 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
              data-type="awards" role="menuitem">
              🏆 Award
            </button>
          </li>
          <li role="presentation">
            <button class="w-full text-left px-4 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
              data-type="certs" role="menuitem">
              📜 Certification
            </button>
          </li>
        </ul>
      </div>

    </aside>

  </main>

  <script type="module" src="js/core.js"></script>
</body>
</html>
```

- [ ] **Step 2: Rebuild Tailwind (now it has content to scan)**

```bash
npm run build:css
```

Expected: `public/css/tailwind.css` grows to ~10-30KB as Tailwind scans the HTML.

- [ ] **Step 3: Verify in browser**

```bash
npm start
```

Open `http://localhost:3001`. Expected: Header with "BlockDraft", grey page background, white paper canvas, "Add Section" button in sidebar. No JS errors in console (core.js doesn't exist yet — that error is expected).

- [ ] **Step 4: Commit**

```bash
git add public/index.html public/css/tailwind.css
git commit -m "feat: HTML shell with paper canvas, header, settings panel, credits modal"
```

---

## Task 8: Print CSS

**Files:**
- Modify: `public/css/print.css`

- [ ] **Step 1: Write print.css**

```css
@media print {
  /* Hide all UI chrome */
  .no-print,
  header,
  aside,
  #settings-panel,
  #thanks-modal,
  #cell-toolbar,
  .bullet-add,
  .bullet-delete,
  .bullet-refine,
  .skill-refine,
  .award-refine,
  .ring-2 {
    display: none !important;
  }

  /* Reset page layout */
  body {
    background: white !important;
    margin: 0;
    padding: 0;
  }

  main {
    padding: 0 !important;
    display: block !important;
  }

  /* Canvas becomes the full page */
  #page-canvas {
    box-shadow: none !important;
    padding: 0 !important;
    width: 100% !important;
    min-height: auto !important;
    font-family: Georgia, 'Times New Roman', serif !important;
  }

  /* Hide deselected entries */
  .entry-deselected {
    display: none !important;
  }

  /* Typography */
  h2.section-heading {
    font-size: 11pt;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    border-bottom: 1px solid #555;
    padding-bottom: 2pt;
    margin-bottom: 5pt;
    color: black;
  }

  h3.entry-title {
    font-size: 11pt;
    font-weight: bold;
    color: black;
  }

  p, li, span {
    font-size: 10pt;
    line-height: 1.35;
    color: black;
  }

  ul {
    margin-left: 14pt;
    padding-left: 0;
    list-style-type: disc;
  }

  .cell-wrapper {
    cursor: default !important;
    margin-bottom: 5pt !important;
    background: transparent !important;
    border: none !important;
    padding: 0 !important;
  }

  @page {
    margin: 0.75in;
    size: letter portrait;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add public/css/print.css
git commit -m "feat: print CSS — hides UI chrome, formats typography for PDF export"
```

---

## Task 9: Frontend Foundation — state.js + api.js

**Files:**
- Create: `public/js/state.js`
- Create: `public/js/api.js`

- [ ] **Step 1: Write public/js/state.js**

```javascript
// AI-generated: shared mutable state object for resume data
export const resumeData = { sections: [] };
```

- [ ] **Step 2: Write public/js/api.js**

```javascript
// AI-generated: fetch wrappers for all Express REST routes
const BASE = 'http://localhost:3001/api';

async function request(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}`);
  return res.json();
}

export const getResume         = ()            => request('GET',    '/resume');
export const createSection     = (data)        => request('POST',   '/sections', data);
export const updateSection     = (id, patch)   => request('PATCH',  `/sections/${id}`, patch);
export const deleteSection     = (id)          => request('DELETE', `/sections/${id}`);
export const createEntry       = (data)        => request('POST',   '/entries', data);
export const updateEntry       = (id, patch)   => request('PATCH',  `/entries/${id}`, patch);
export const deleteEntry       = (id)          => request('DELETE', `/entries/${id}`);
export const createBullet      = (data)        => request('POST',   '/bullets', data);
export const updateBullet      = (id, patch)   => request('PATCH',  `/bullets/${id}`, patch);
export const deleteBullet      = (id)          => request('DELETE', `/bullets/${id}`);
export const getConfig         = (key)         => request('GET',    `/config/${key}`);
export const setConfig         = (key, value)  => request('PUT',    `/config/${key}`, { value });
export const refineText        = (type, input) => request('POST',   '/ai/refine', { type, input });
```

- [ ] **Step 3: Write public/js/ai.js**

```javascript
// AI-generated: thin wrapper — isolates AI concern from api.js
import { refineText } from './api.js';

export function refine(type, input) {
  return refineText(type, input);
}
```

- [ ] **Step 4: Commit**

```bash
git add public/js/state.js public/js/api.js public/js/ai.js
git commit -m "feat: frontend state module and API fetch wrappers"
```

---

## Task 10: Cell Classes

**Files:**
- Create: `public/js/cells/CellFactory.js`
- Create: `public/js/cells/ExperienceCell.js`
- Create: `public/js/cells/EducationCell.js`
- Create: `public/js/cells/SkillCell.js`
- Create: `public/js/cells/AwardCell.js`

- [ ] **Step 1: Write public/js/cells/ExperienceCell.js**

```javascript
// AI-generated: view/edit templates for work experience entries
export class ExperienceCell {
  constructor(data) { this.data = data; }

  renderView() {
    const bullets = (this.data.bullets || [])
      .filter(b => b.is_selected)
      .map(b => `<li class="ml-4">${escHtml(b.text)}</li>`)
      .join('');
    return `
      <div class="cell-view" role="article" aria-label="Work experience: ${escHtml(this.data.title || 'untitled')}">
        <div class="flex justify-between items-baseline">
          <h3 class="entry-title font-bold text-gray-900">${escHtml(this.data.title || '')}</h3>
          <span class="text-sm text-gray-600">${escHtml(this.data.date || '')}</span>
        </div>
        <p class="text-gray-700 italic text-sm">${escHtml(this.data.subtitle || '')}</p>
        ${bullets ? `<ul class="list-disc text-gray-800 text-sm mt-1">${bullets}</ul>` : ''}
      </div>`;
  }

  renderEdit() {
    const bullets = (this.data.bullets || []).map((b, i) => `
      <div class="bullet-row flex gap-2 items-center" data-bullet-id="${b.id}">
        <input type="checkbox" id="bsel-${b.id}" class="bullet-select shrink-0"
          ${b.is_selected ? 'checked' : ''} aria-label="Include bullet ${i + 1} in resume">
        <input type="text" value="${escAttr(b.text)}" class="bullet-text flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
          aria-label="Bullet point ${i + 1}">
        <button class="bullet-refine text-blue-500 text-xs hover:text-blue-700 shrink-0"
          aria-label="Refine bullet ${i + 1} with AI">✦ AI</button>
        <button class="bullet-delete text-red-400 text-xs hover:text-red-600 shrink-0"
          aria-label="Delete bullet ${i + 1}">✕</button>
      </div>`).join('');
    return `
      <div class="cell-edit space-y-2" data-entry-id="${this.data.id}" data-section-type="experience">
        <div class="flex items-center gap-2 mb-1">
          <input type="checkbox" id="esel-${this.data.id}" name="is_selected" class="entry-select"
            ${this.data.is_selected ? 'checked' : ''} aria-label="Include this entry in resume">
          <label for="esel-${this.data.id}" class="text-xs text-gray-500">Include in resume</label>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label for="title-${this.data.id}" class="text-xs font-medium text-gray-600">Company</label>
            <input id="title-${this.data.id}" type="text" name="title" value="${escAttr(this.data.title || '')}"
              class="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              aria-label="Company name">
          </div>
          <div>
            <label for="date-${this.data.id}" class="text-xs font-medium text-gray-600">Date Range</label>
            <input id="date-${this.data.id}" type="text" name="date" value="${escAttr(this.data.date || '')}"
              class="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              aria-label="Employment date range">
          </div>
        </div>
        <div>
          <label for="subtitle-${this.data.id}" class="text-xs font-medium text-gray-600">Role / Title</label>
          <input id="subtitle-${this.data.id}" type="text" name="subtitle" value="${escAttr(this.data.subtitle || '')}"
            class="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            aria-label="Job title">
        </div>
        <div class="space-y-1">
          <p class="text-xs font-medium text-gray-600">Bullet Points</p>
          <div class="bullets-container space-y-1">${bullets}</div>
          <button class="bullet-add text-xs text-blue-600 hover:text-blue-800 mt-1"
            aria-label="Add bullet point">+ Add bullet</button>
        </div>
      </div>`;
  }
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function escAttr(str) {
  return String(str).replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
```

- [ ] **Step 2: Write public/js/cells/EducationCell.js**

```javascript
// AI-generated: view/edit templates for education entries
export class EducationCell {
  constructor(data) { this.data = data; }

  renderView() {
    return `
      <div class="cell-view" role="article" aria-label="Education: ${escHtml(this.data.title || 'untitled')}">
        <div class="flex justify-between items-baseline">
          <h3 class="entry-title font-bold text-gray-900">${escHtml(this.data.title || '')}</h3>
          <span class="text-sm text-gray-600">${escHtml(this.data.date || '')}</span>
        </div>
        <p class="text-gray-700 italic text-sm">${escHtml(this.data.subtitle || '')}</p>
        ${this.data.extra ? `<p class="text-gray-600 text-sm">GPA: ${escHtml(this.data.extra)}</p>` : ''}
      </div>`;
  }

  renderEdit() {
    return `
      <div class="cell-edit space-y-2" data-entry-id="${this.data.id}" data-section-type="education">
        <div class="flex items-center gap-2 mb-1">
          <input type="checkbox" id="esel-${this.data.id}" name="is_selected" class="entry-select"
            ${this.data.is_selected ? 'checked' : ''} aria-label="Include this entry in resume">
          <label for="esel-${this.data.id}" class="text-xs text-gray-500">Include in resume</label>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label for="title-${this.data.id}" class="text-xs font-medium text-gray-600">Institution</label>
            <input id="title-${this.data.id}" type="text" name="title" value="${escAttr(this.data.title || '')}"
              class="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              aria-label="Institution name">
          </div>
          <div>
            <label for="date-${this.data.id}" class="text-xs font-medium text-gray-600">Graduation Year</label>
            <input id="date-${this.data.id}" type="text" name="date" value="${escAttr(this.data.date || '')}"
              class="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              aria-label="Graduation year">
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label for="subtitle-${this.data.id}" class="text-xs font-medium text-gray-600">Degree</label>
            <input id="subtitle-${this.data.id}" type="text" name="subtitle" value="${escAttr(this.data.subtitle || '')}"
              class="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              aria-label="Degree name">
          </div>
          <div>
            <label for="extra-${this.data.id}" class="text-xs font-medium text-gray-600">GPA (optional)</label>
            <input id="extra-${this.data.id}" type="text" name="extra" value="${escAttr(this.data.extra || '')}"
              class="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              aria-label="GPA">
          </div>
        </div>
      </div>`;
  }
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function escAttr(str) {
  return String(str).replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
```

- [ ] **Step 3: Write public/js/cells/SkillCell.js**

```javascript
// AI-generated: view/edit templates for skills category entries
export class SkillCell {
  constructor(data) { this.data = data; }

  renderView() {
    return `
      <div class="cell-view" role="article" aria-label="Skills: ${escHtml(this.data.title || 'category')}">
        <span class="font-semibold text-gray-900">${escHtml(this.data.title || '')}: </span>
        <span class="text-gray-800 text-sm">${escHtml(this.data.extra || '')}</span>
      </div>`;
  }

  renderEdit() {
    return `
      <div class="cell-edit space-y-2" data-entry-id="${this.data.id}" data-section-type="skills">
        <div class="flex items-center gap-2 mb-1">
          <input type="checkbox" id="esel-${this.data.id}" name="is_selected" class="entry-select"
            ${this.data.is_selected ? 'checked' : ''} aria-label="Include this entry in resume">
          <label for="esel-${this.data.id}" class="text-xs text-gray-500">Include in resume</label>
        </div>
        <div>
          <label for="title-${this.data.id}" class="text-xs font-medium text-gray-600">Category Name</label>
          <input id="title-${this.data.id}" type="text" name="title" value="${escAttr(this.data.title || '')}"
            class="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            aria-label="Skill category name (e.g. Languages, Frameworks)">
        </div>
        <div>
          <label for="extra-${this.data.id}" class="text-xs font-medium text-gray-600">Skills (comma-separated)</label>
          <textarea id="extra-${this.data.id}" name="extra" rows="2"
            class="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none"
            aria-label="Comma-separated skill list">${escHtml(this.data.extra || '')}</textarea>
          <button class="skill-refine text-xs text-blue-600 hover:text-blue-800 mt-1"
            aria-label="Get AI skill suggestions">✦ AI Suggestions</button>
        </div>
      </div>`;
  }
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function escAttr(str) {
  return String(str).replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
```

- [ ] **Step 4: Write public/js/cells/AwardCell.js**

```javascript
// AI-generated: view/edit templates for awards and certifications
export class AwardCell {
  constructor(data) { this.data = data; }

  renderView() {
    return `
      <div class="cell-view" role="article" aria-label="${escHtml(this.data.title || 'Award/Certification')}">
        <div class="flex justify-between items-baseline">
          <h3 class="entry-title font-semibold text-gray-900">${escHtml(this.data.title || '')}</h3>
          <span class="text-sm text-gray-600">${escHtml(this.data.date || '')}</span>
        </div>
        ${this.data.extra ? `<p class="text-gray-600 text-sm italic">${escHtml(this.data.extra)}</p>` : ''}
      </div>`;
  }

  renderEdit() {
    return `
      <div class="cell-edit space-y-2" data-entry-id="${this.data.id}" data-section-type="awards">
        <div class="flex items-center gap-2 mb-1">
          <input type="checkbox" id="esel-${this.data.id}" name="is_selected" class="entry-select"
            ${this.data.is_selected ? 'checked' : ''} aria-label="Include this entry in resume">
          <label for="esel-${this.data.id}" class="text-xs text-gray-500">Include in resume</label>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label for="title-${this.data.id}" class="text-xs font-medium text-gray-600">Title</label>
            <input id="title-${this.data.id}" type="text" name="title" value="${escAttr(this.data.title || '')}"
              class="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              aria-label="Award or certification title">
          </div>
          <div>
            <label for="date-${this.data.id}" class="text-xs font-medium text-gray-600">Year</label>
            <input id="date-${this.data.id}" type="text" name="date" value="${escAttr(this.data.date || '')}"
              class="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              aria-label="Year received">
          </div>
        </div>
        <div>
          <label for="extra-${this.data.id}" class="text-xs font-medium text-gray-600">Issuer / Details</label>
          <input id="extra-${this.data.id}" type="text" name="extra" value="${escAttr(this.data.extra || '')}"
            class="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            aria-label="Issuer or award details">
          <button class="award-refine text-xs text-blue-600 hover:text-blue-800 mt-1"
            aria-label="Refine description with AI">✦ AI Refine</button>
        </div>
      </div>`;
  }
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function escAttr(str) {
  return String(str).replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
```

- [ ] **Step 5: Write public/js/cells/CellFactory.js**

```javascript
// AI-generated: factory pattern — returns correct cell instance for section type
import { ExperienceCell } from './ExperienceCell.js';
import { EducationCell }  from './EducationCell.js';
import { SkillCell }      from './SkillCell.js';
import { AwardCell }      from './AwardCell.js';

export class CellFactory {
  static create(type, data) {
    switch (type) {
      case 'experience': return new ExperienceCell(data);
      case 'education':  return new EducationCell(data);
      case 'skills':     return new SkillCell(data);
      case 'awards':
      case 'certs':      return new AwardCell(data);
      default: throw new Error(`Unknown cell type: ${type}`);
    }
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add public/js/cells/
git commit -m "feat: CellFactory and all cell types (experience, education, skills, awards)"
```

---

## Task 11: ui.js

**Files:**
- Create: `public/js/ui.js`

- [ ] **Step 1: Write public/js/ui.js**

```javascript
// AI-generated: DOM rendering layer — reads resumeData, writes to #page-canvas
import { resumeData } from './state.js';
import { CellFactory } from './cells/CellFactory.js';

export function renderCanvas() {
  const canvas = document.getElementById('page-canvas');
  canvas.innerHTML = '';

  if (!resumeData.sections.length) {
    canvas.innerHTML = '<p class="text-gray-400 text-sm text-center mt-4">Click "Add Section" to get started.</p>';
    return;
  }

  for (const section of resumeData.sections) {
    if (!section.is_visible) continue;

    const sectionEl = document.createElement('section');
    sectionEl.className = 'resume-section mb-5';
    sectionEl.dataset.sectionId = section.id;
    sectionEl.dataset.sectionType = section.type;
    sectionEl.setAttribute('aria-label', section.name);

    const heading = document.createElement('h2');
    heading.className = 'section-heading text-sm font-bold uppercase tracking-widest border-b border-gray-400 pb-0.5 mb-2 text-gray-900';
    heading.setAttribute('role', 'heading');
    heading.setAttribute('aria-level', '2');
    heading.textContent = section.name;
    sectionEl.appendChild(heading);

    for (const entry of section.entries || []) {
      const cellWrapper = document.createElement('div');
      cellWrapper.className = 'cell-wrapper relative mb-2 px-2 py-1 rounded cursor-pointer hover:outline hover:outline-1 hover:outline-blue-200';
      cellWrapper.dataset.entryId = entry.id;
      cellWrapper.dataset.sectionType = section.type;

      if (!entry.is_selected) {
        cellWrapper.classList.add('entry-deselected', 'opacity-50');
      }

      const cell = CellFactory.create(section.type, entry);
      cellWrapper.innerHTML = cell.renderView();
      sectionEl.appendChild(cellWrapper);
    }

    canvas.appendChild(sectionEl);
  }
}

export function swapToEdit(cellWrapper) {
  const entryId = parseInt(cellWrapper.dataset.entryId);
  const type = cellWrapper.dataset.sectionType;
  const entry = findEntry(type, entryId);
  if (!entry) return;

  const cell = CellFactory.create(type, entry);
  cellWrapper.innerHTML = cell.renderEdit();
  cellWrapper.classList.add('ring-2', 'ring-blue-400', 'bg-blue-50');
  cellWrapper.querySelector('input:not([type="checkbox"]), textarea')?.focus();
}

export function swapToView(cellWrapper) {
  const entryId = parseInt(cellWrapper.dataset.entryId);
  const type = cellWrapper.dataset.sectionType;
  const entry = findEntry(type, entryId);
  if (!entry) return;

  const cell = CellFactory.create(type, entry);
  cellWrapper.innerHTML = cell.renderView();
  cellWrapper.classList.remove('ring-2', 'ring-blue-400', 'bg-blue-50');

  if (!entry.is_selected) {
    cellWrapper.classList.add('entry-deselected', 'opacity-50');
  } else {
    cellWrapper.classList.remove('entry-deselected', 'opacity-50');
  }
}

export function injectToolbar(cellWrapper) {
  removeToolbar();
  const toolbar = document.createElement('div');
  toolbar.id = 'cell-toolbar';
  toolbar.className = 'no-print absolute -left-24 top-0 flex flex-col gap-1 bg-white border border-gray-200 rounded-lg shadow-lg p-1.5 z-10';
  toolbar.setAttribute('role', 'toolbar');
  toolbar.setAttribute('aria-label', 'Entry actions');
  toolbar.innerHTML = `
    <button class="toolbar-btn px-2 py-1 text-xs hover:bg-gray-100 rounded" data-action="move-up" aria-label="Move entry up">↑ Up</button>
    <button class="toolbar-btn px-2 py-1 text-xs hover:bg-gray-100 rounded" data-action="move-down" aria-label="Move entry down">↓ Down</button>
    <button class="toolbar-btn px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded" data-action="delete" aria-label="Delete entry">🗑 Del</button>
    <button class="toolbar-btn px-2 py-1 text-xs text-blue-500 hover:bg-blue-50 rounded" data-action="ai-refine" aria-label="Refine with AI">✦ AI</button>
  `;
  cellWrapper.appendChild(toolbar);
}

export function removeToolbar() {
  document.getElementById('cell-toolbar')?.remove();
}

function findEntry(type, entryId) {
  const section = resumeData.sections.find(s => s.type === type);
  return section?.entries.find(e => e.id === entryId);
}
```

- [ ] **Step 2: Commit**

```bash
git add public/js/ui.js
git commit -m "feat: ui.js — renderCanvas, swapToEdit/View, toolbar injection"
```

---

## Task 12: core.js — Init, Click-to-Edit, Blur-Save

**Files:**
- Create: `public/js/core.js`

- [ ] **Step 1: Write public/js/core.js (init + canvas wiring + saveCell)**

```javascript
// AI-generated: application entry point — event delegation, blur-save, toolbar actions
import { resumeData } from './state.js';
import * as api from './api.js';
import { renderCanvas, swapToEdit, swapToView, injectToolbar, removeToolbar } from './ui.js';
import { refine } from './ai.js';

let activeCell = null;

async function init() {
  try {
    const data = await api.getResume();
    resumeData.sections = data;
    renderCanvas();
  } catch (err) {
    console.error('Failed to load resume data:', err);
  }
  wireCanvas();
  // wireAddMenu, wireSettingsPanel, wirePrintButton, wireThankYouModal added in Task 14
}

function wireCanvas() {
  const canvas = document.getElementById('page-canvas');

  canvas.addEventListener('click', (e) => {
    // Toolbar button actions (delegated)
    const toolbarBtn = e.target.closest('[data-action]');
    if (toolbarBtn) {
      e.stopPropagation();
      handleToolbarAction(toolbarBtn.dataset.action, activeCell);
      return;
    }

    // Bullet-specific actions (delegated)
    if (e.target.classList.contains('bullet-add')) {
      handleAddBullet(e.target.closest('.cell-wrapper'));
      return;
    }
    if (e.target.classList.contains('bullet-delete')) {
      handleDeleteBullet(e.target.closest('.bullet-row'));
      return;
    }
    if (e.target.classList.contains('bullet-refine')) {
      handleRefineBullet(e.target.closest('.bullet-row'));
      return;
    }
    if (e.target.classList.contains('skill-refine') || e.target.classList.contains('award-refine')) {
      handleRefineEntryText(e.target.closest('.cell-wrapper'));
      return;
    }

    // Cell activation
    const cellWrapper = e.target.closest('.cell-wrapper');
    if (cellWrapper && cellWrapper !== activeCell) {
      if (activeCell) saveCell(activeCell).then(() => swapToView(activeCell));
      activeCell = cellWrapper;
      swapToEdit(cellWrapper);
      injectToolbar(cellWrapper);
    }
  });

  // Blur-save: fires when focus leaves a cell's inputs
  canvas.addEventListener('focusout', () => {
    setTimeout(() => {
      const toolbar = document.getElementById('cell-toolbar');
      const stillInCell = activeCell?.contains(document.activeElement);
      const inToolbar = toolbar?.contains(document.activeElement);
      if (!stillInCell && !inToolbar && activeCell) {
        const cellToSave = activeCell;
        activeCell = null;
        saveCell(cellToSave).then(() => {
          swapToView(cellToSave);
          removeToolbar();
        });
      }
    }, 150);
  });
}

async function saveCell(cellWrapper) {
  const editForm = cellWrapper.querySelector('.cell-edit');
  if (!editForm) return;


  const entryId = parseInt(cellWrapper.dataset.entryId);
  const type = cellWrapper.dataset.sectionType;
  const section = resumeData.sections.find(s => s.type === type);
  const entry = section?.entries.find(e => e.id === entryId);
  if (!entry) return;

  // Collect entry-level fields
  const patch = {};
  for (const field of ['title', 'subtitle', 'date', 'extra']) {
    const el = editForm.querySelector(`[name="${field}"]`);
    if (el) patch[field] = el.value;
  }
  const selEl = editForm.querySelector('[name="is_selected"]');
  if (selEl) patch.is_selected = selEl.checked ? 1 : 0;

  await api.updateEntry(entryId, patch);
  Object.assign(entry, patch);

  // Save bullets if present
  const bulletRows = editForm.querySelectorAll('.bullet-row');
  for (const row of bulletRows) {
    const bulletId = parseInt(row.dataset.bulletId);
    const text = row.querySelector('.bullet-text')?.value ?? '';
    const is_selected = row.querySelector('.bullet-select')?.checked ? 1 : 0;
    await api.updateBullet(bulletId, { text, is_selected });
    const bullet = entry.bullets?.find(b => b.id === bulletId);
    if (bullet) { bullet.text = text; bullet.is_selected = is_selected; }
  }
}

document.addEventListener('DOMContentLoaded', init);
```

- [ ] **Step 2: Seed test data via curl, then test click-to-edit in browser**

The Add Menu isn't wired until Task 14, so seed data manually:

```bash
npm start
```

In a second terminal:
```bash
# Create a section (note the id in the response — likely 1)
curl -s -X POST http://localhost:3001/api/sections \
  -H "Content-Type: application/json" \
  -d '{"name":"Work Experience","type":"experience","order_index":0}'

# Create an entry under section id 1
curl -s -X POST http://localhost:3001/api/entries \
  -H "Content-Type: application/json" \
  -d '{"section_id":1,"order_index":0}'
```

Refresh `http://localhost:3001`. Expected: A blank experience cell on the canvas. Click it → edit form appears with Company/Date/Role fields. No console errors.

- [ ] **Step 3: Test blur-save in browser**

Type "Acme Corp" in the Company field. Click outside the cell. Expected: Cell returns to view mode showing "Acme Corp". Refresh page — "Acme Corp" still there (persisted to SQLite).

- [ ] **Step 4: Commit**

```bash
git add public/js/core.js
git commit -m "feat: core.js — init, click-to-edit, blur-save with state sync"
```

---

## Task 13: Toolbar Actions — Move, Delete, Bullet CRUD

**Files:**
- Modify: `public/js/core.js` (add handler functions)

- [ ] **Step 1: Add toolbar and bullet handlers to core.js**

Append these functions to `public/js/core.js` **before** the `document.addEventListener('DOMContentLoaded', init)` line at the bottom:

```javascript
async function handleToolbarAction(action, cellWrapper) {
  if (!cellWrapper) return;
  const entryId = parseInt(cellWrapper.dataset.entryId);
  const type = cellWrapper.dataset.sectionType;
  const section = resumeData.sections.find(s => s.type === type);
  const entries = section?.entries || [];
  const idx = entries.findIndex(e => e.id === entryId);

  if (action === 'delete') {
    if (!confirm('Delete this entry? This cannot be undone.')) return;
    await saveCell(cellWrapper);
    await api.deleteEntry(entryId);
    entries.splice(idx, 1);
    removeToolbar();
    activeCell = null;
    renderCanvas();
  }

  if (action === 'move-up' && idx > 0) {
    const prev = entries[idx - 1];
    const curIdx = entries[idx].order_index;
    const prevIdx = prev.order_index;
    await api.updateEntry(entryId, { order_index: prevIdx });
    await api.updateEntry(prev.id, { order_index: curIdx });
    entries[idx].order_index = prevIdx;
    prev.order_index = curIdx;
    [entries[idx], entries[idx - 1]] = [entries[idx - 1], entries[idx]];
    activeCell = null;
    removeToolbar();
    renderCanvas();
  }

  if (action === 'move-down' && idx < entries.length - 1) {
    const next = entries[idx + 1];
    const curIdx = entries[idx].order_index;
    const nextIdx = next.order_index;
    await api.updateEntry(entryId, { order_index: nextIdx });
    await api.updateEntry(next.id, { order_index: curIdx });
    entries[idx].order_index = nextIdx;
    next.order_index = curIdx;
    [entries[idx], entries[idx + 1]] = [entries[idx + 1], entries[idx]];
    activeCell = null;
    removeToolbar();
    renderCanvas();
  }

  if (action === 'ai-refine') {
    await handleRefineEntryText(cellWrapper);
  }
}

async function handleAddBullet(cellWrapper) {
  const entryId = parseInt(cellWrapper.dataset.entryId);
  const type = cellWrapper.dataset.sectionType;
  const section = resumeData.sections.find(s => s.type === type);
  const entry = section?.entries.find(e => e.id === entryId);
  if (!entry) return;
  const order_index = entry.bullets?.length || 0;
  const newBullet = await api.createBullet({ entry_id: entryId, text: '', order_index });
  entry.bullets = entry.bullets || [];
  entry.bullets.push(newBullet);
  swapToEdit(cellWrapper);
}

async function handleDeleteBullet(bulletRow) {
  if (!bulletRow) return;
  const bulletId = parseInt(bulletRow.dataset.bulletId);
  const cellWrapper = bulletRow.closest('.cell-wrapper');
  const entryId = parseInt(cellWrapper.dataset.entryId);
  const type = cellWrapper.dataset.sectionType;
  const section = resumeData.sections.find(s => s.type === type);
  const entry = section?.entries.find(e => e.id === entryId);
  await api.deleteBullet(bulletId);
  if (entry) entry.bullets = entry.bullets.filter(b => b.id !== bulletId);
  swapToEdit(cellWrapper);
}

async function handleRefineBullet(bulletRow) {
  if (!bulletRow) return;
  const textInput = bulletRow.querySelector('.bullet-text');
  const original = textInput.value;
  if (!original.trim()) return;
  textInput.value = 'Refining…';
  textInput.disabled = true;
  try {
    const { refined } = await refine('experience', original);
    textInput.value = refined;
  } catch (err) {
    textInput.value = original;
    alert('AI refine failed: ' + err.message);
  } finally {
    textInput.disabled = false;
  }
}

async function handleRefineEntryText(cellWrapper) {
  if (!cellWrapper) return;
  const type = cellWrapper.dataset.sectionType;
  const entryId = parseInt(cellWrapper.dataset.entryId);
  const section = resumeData.sections.find(s => s.type === type);
  const entry = section?.entries.find(e => e.id === entryId);

  let inputEl, input;
  if (type === 'skills') {
    inputEl = cellWrapper.querySelector('[name="extra"]');
    input = inputEl?.value || entry?.extra || '';
  } else {
    inputEl = cellWrapper.querySelector('[name="title"]');
    input = inputEl?.value || entry?.title || '';
  }
  if (!input.trim()) return;

  const origPlaceholder = inputEl?.placeholder;
  if (inputEl) { inputEl.disabled = true; inputEl.placeholder = 'Refining…'; }

  try {
    const { refined } = await refine(type, input);
    if (type === 'skills' && inputEl) {
      inputEl.value = inputEl.value ? `${inputEl.value}, ${refined}` : refined;
    } else {
      alert(`AI suggestion:\n\n${refined}`);
    }
  } catch (err) {
    alert('AI refine failed: ' + err.message);
  } finally {
    if (inputEl) { inputEl.disabled = false; inputEl.placeholder = origPlaceholder; }
  }
}
```

- [ ] **Step 2: Test toolbar delete in browser**

If DB has a test entry from Task 12, use it. Otherwise seed via curl:
```bash
curl -s -X POST http://localhost:3001/api/sections -H "Content-Type: application/json" -d '{"name":"Work Experience","type":"experience","order_index":0}'
curl -s -X POST http://localhost:3001/api/entries -H "Content-Type: application/json" -d '{"section_id":1,"order_index":0}'
```

Refresh `http://localhost:3001`. Click the cell. Click "🗑 Del" in the left toolbar. Confirm dialog → OK. Expected: entry disappears. Refresh — still gone.

- [ ] **Step 3: Test move up/down in browser**

Seed two entries under section 1:
```bash
curl -s -X POST http://localhost:3001/api/entries -H "Content-Type: application/json" -d '{"section_id":1,"title":"First Job","order_index":0}'
curl -s -X POST http://localhost:3001/api/entries -H "Content-Type: application/json" -d '{"section_id":1,"title":"Second Job","order_index":1}'
```

Refresh. Click "Second Job" entry. Click "↑ Up" in toolbar. Expected: entries swap. Refresh — new order persists.

- [ ] **Step 4: Test add bullet in browser**

Click an experience entry to edit. Click "+ Add bullet". Expected: new empty bullet text field appears in the edit form.

- [ ] **Step 5: Commit**

```bash
git add public/js/core.js
git commit -m "feat: toolbar delete/move, bullet add/delete/AI refine"
```

---

## Task 14: Add Menu, Settings Panel, Print, Credits Modal

**Files:**
- Modify: `public/js/core.js` (add remaining wire functions, update init())

- [ ] **Step 1: Update `init()` in public/js/core.js**

Replace the existing `init()` function (which currently only calls `wireCanvas()`) with:

```javascript
async function init() {
  try {
    const data = await api.getResume();
    resumeData.sections = data;
    renderCanvas();
  } catch (err) {
    console.error('Failed to load resume data:', err);
  }
  wireCanvas();
  wireAddMenu();
  wireSettingsPanel();
  wirePrintButton();
  wireThankYouModal();
}
```

- [ ] **Step 2: Append these functions to public/js/core.js, BEFORE the `document.addEventListener('DOMContentLoaded', init)` line**

```javascript
function wireAddMenu() {
  const addBtn = document.getElementById('add-btn');
  const addMenu = document.getElementById('add-menu');

  addBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const expanded = addMenu.classList.toggle('hidden');
    addBtn.setAttribute('aria-expanded', String(!expanded));
  });

  document.addEventListener('click', () => {
    addMenu.classList.add('hidden');
    addBtn.setAttribute('aria-expanded', 'false');
  });

  addMenu.addEventListener('click', async (e) => {
    const type = e.target.closest('[data-type]')?.dataset.type;
    if (!type) return;
    addMenu.classList.add('hidden');
    addBtn.setAttribute('aria-expanded', 'false');
    await addEntry(type);
  });
}

async function addEntry(type) {
  const typeNames = {
    experience: 'Work Experience',
    education:  'Education',
    skills:     'Skills',
    awards:     'Awards',
    certs:      'Certifications'
  };

  let section = resumeData.sections.find(s => s.type === type);
  if (!section) {
    const order_index = resumeData.sections.length;
    section = await api.createSection({ name: typeNames[type], type, order_index });
    section.entries = [];
    resumeData.sections.push(section);
  }

  const order_index = section.entries.length;
  const entry = await api.createEntry({ section_id: section.id, order_index });
  entry.bullets = [];
  section.entries.push(entry);

  renderCanvas();

  const newCell = document.querySelector(`[data-entry-id="${entry.id}"]`);
  if (newCell) {
    activeCell = newCell;
    swapToEdit(newCell);
    injectToolbar(newCell);
    newCell.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function wireSettingsPanel() {
  const settingsBtn   = document.getElementById('settings-btn');
  const settingsPanel = document.getElementById('settings-panel');
  const saveKeyBtn    = document.getElementById('save-key-btn');
  const apiKeyInput   = document.getElementById('api-key-input');

  settingsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const hidden = settingsPanel.classList.toggle('hidden');
    settingsBtn.setAttribute('aria-expanded', String(!hidden));
  });

  document.addEventListener('click', (e) => {
    if (!settingsPanel.contains(e.target) && e.target !== settingsBtn) {
      settingsPanel.classList.add('hidden');
      settingsBtn.setAttribute('aria-expanded', 'false');
    }
  });

  // Show masked key hint if one exists
  api.getConfig('gemini_key')
    .then(({ value }) => {
      if (value) apiKeyInput.placeholder = `Key set (ends in …${value.slice(-4)})`;
    })
    .catch(() => {});

  saveKeyBtn.addEventListener('click', async () => {
    const key = apiKeyInput.value.trim();
    if (!key) return;
    await api.setConfig('gemini_key', key);
    apiKeyInput.value = '';
    apiKeyInput.placeholder = `Key saved ✓ (ends in …${key.slice(-4)})`;
    settingsPanel.classList.add('hidden');
  });
}

function wirePrintButton() {
  document.getElementById('print-btn')?.addEventListener('click', () => {
    if (activeCell) {
      saveCell(activeCell).then(() => {
        swapToView(activeCell);
        removeToolbar();
        activeCell = null;
        window.print();
      });
    } else {
      window.print();
    }
  });
}

function wireThankYouModal() {
  const thanksBtn   = document.getElementById('thanks-btn');
  const thanksModal = document.getElementById('thanks-modal');
  const closeBtn    = document.getElementById('close-thanks');

  thanksBtn.addEventListener('click', () => {
    thanksModal.classList.remove('hidden');
    closeBtn.focus();
  });
  closeBtn.addEventListener('click', () => {
    thanksModal.classList.add('hidden');
    thanksBtn.focus();
  });
  thanksModal.addEventListener('click', (e) => {
    if (e.target === thanksModal) thanksModal.classList.add('hidden');
  });
}
```

- [ ] **Step 3: Test full flow in browser**

```bash
npm start
```

- Click "+ Add Section" → "Work Experience" → blank cell appears → type company name → click away → refresh → data persists ✓
- Click "+ Add Section" → "Skills Category" → type category and skills → blur → refresh ✓
- Click Settings → enter a fake key "AIzaFAKEKEY" → Save Key → panel closes ✓
- Click Credits → modal opens → close button works ✓
- Click Print / PDF → browser print dialog opens, sidebar hidden ✓

- [ ] **Step 4: Commit**

```bash
git add public/js/core.js
git commit -m "feat: add menu, settings panel, print trigger, credits modal"
```

---

## Task 15: Accessibility Pass — Lighthouse 93+

**Files:**
- Modify: `public/index.html` (minor ARIA fixes)
- Modify: cell class files if needed

- [ ] **Step 1: Run Lighthouse**

In Chrome:
1. Open `http://localhost:3001`
2. DevTools → Lighthouse tab → Accessibility only → Run audit
3. Note the score and any flagged issues.

Common issues and fixes:

**Issue: "Buttons do not have accessible names"**
→ Verify every `<button>` has `aria-label` or visible text. Check the toolbar buttons in `ui.js` — they already have `aria-label`. If the add-menu emoji buttons fail, add explicit text:
```html
<!-- Change: -->
<button data-type="experience" role="menuitem">💼 Work Experience</button>
<!-- These already have text, so they should pass. -->
```

**Issue: "Form elements do not have associated labels"**
→ Each input in cell edit forms uses `<label for="id">` where id matches `input id`. Verify all cell classes do this. The `id` is `title-${this.data.id}`, `date-${this.data.id}`, etc. — these are unique per entry.

**Issue: "Background and foreground colors do not have sufficient contrast ratio"**
→ Replace `text-gray-400` with `text-gray-600` in any hint text. The "empty-hint" paragraph in index.html uses `text-gray-400` — change to `text-gray-500`.

**Issue: "Heading elements are not in a sequentially-descending order"**
→ The app has: no `<h1>` (header uses a `<span>`). Add an `<h1>` to the header:
```html
<!-- In header, change: -->
<span class="font-bold text-gray-900 text-xl tracking-tight">BlockDraft</span>
<!-- To: -->
<h1 class="font-bold text-gray-900 text-xl tracking-tight m-0">BlockDraft</h1>
```

**Issue: "Links do not have a discernible name"**
→ The Settings panel has an `<a>` tag to Google AI Studio. It has visible text "Google AI Studio" — should already pass.

- [ ] **Step 2: Fix identified issues**

Apply fixes from Step 1. Re-run Lighthouse after each fix. Target: 93+.

- [ ] **Step 3: Rebuild Tailwind after HTML changes**

```bash
npm run build:css
```

- [ ] **Step 4: Take Lighthouse screenshot**

Save the Lighthouse report screenshot to `docs/lighthouse-score.png`.

- [ ] **Step 5: Commit**

```bash
git add public/index.html public/js/cells/ public/css/tailwind.css docs/lighthouse-score.png
git commit -m "fix: accessibility improvements for Lighthouse 93+ score"
```

---

## Task 16: Branding — Favicon, Icons, ai_usage.log

**Files:**
- Create: `public/assets/favicon.ico`
- Update: `ai_usage.log`

- [ ] **Step 1: Create a favicon**

Option A — Use an online tool: Go to `https://favicon.io/favicon-generator/`, type "BD", choose colors (blue background `#2563EB`, white text), download the `.ico` file, save to `public/assets/favicon.ico`.

Option B — Create an SVG favicon (modern browsers support this):
Create `public/assets/favicon.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#2563EB"/>
  <text x="16" y="22" font-family="Georgia,serif" font-size="16" font-weight="bold"
    fill="white" text-anchor="middle">BD</text>
</svg>
```

Update `index.html` to reference both:
```html
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
<link rel="icon" href="assets/favicon.ico" type="image/x-icon">
```

- [ ] **Step 2: Update ai_usage.log with all sessions**

Append to `ai_usage.log`:
```
[2026-05-03] | Claude Code (claude-sonnet-4-6) | Full implementation planning and code generation | All files in server/, public/js/, public/index.html
[2026-05-03] | Google Gemini 1.5 Flash | Runtime AI: resume bullet refinement, skill suggestions, award rewrites | server/routes/ai.js
```

- [ ] **Step 3: Verify favicon appears in browser tab**

Open `http://localhost:3001`. Check browser tab — favicon should be visible.

- [ ] **Step 4: Commit**

```bash
git add public/assets/ public/index.html ai_usage.log
git commit -m "feat: BlockDraft favicon/branding, updated AI usage log"
```

---

## Task 17: Electron Wrapper

**Files:**
- Create: `main.js`

- [ ] **Step 1: Write main.js**

```javascript
const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

let serverProcess;

function startServer() {
  serverProcess = spawn(process.execPath, [path.join(__dirname, 'server', 'app.js')], {
    env: { ...process.env, PORT: '3001' },
    stdio: 'pipe'
  });
  serverProcess.stdout.on('data', d => console.log('[server]', d.toString().trim()));
  serverProcess.stderr.on('data', d => console.error('[server]', d.toString().trim()));
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 900,
    title: 'BlockDraft',
    icon: path.join(__dirname, 'public', 'assets', 'favicon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Give Express 1.5s to start before loading
  setTimeout(() => win.loadURL('http://localhost:3001'), 1500);
}

app.whenReady().then(() => {
  startServer();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (serverProcess) serverProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});
```

- [ ] **Step 2: Test Electron launch**

```bash
npm run electron
```

Expected: Electron window opens showing the BlockDraft app. Add an entry, blur to save, close and reopen — data persists.

If the window shows blank after 1.5s: increase the `setTimeout` to `2500` (some machines are slower).

If `better-sqlite3` crashes with a native module error in Electron:
```bash
./node_modules/.bin/electron-rebuild
```
This rebuilds native modules for the Electron version. If `electron-rebuild` is not installed:
```bash
npm install --save-dev electron-rebuild
./node_modules/.bin/electron-rebuild
```

- [ ] **Step 3: Commit**

```bash
git add main.js
git commit -m "feat: Electron wrapper — spawns Express, loads localhost:3001"
```

---

## Task 18: Documentation & Compliance Final Check

**Files:**
- Verify: `ai_usage.log`
- Verify: `.gitignore`
- Verify: `CLAUDE.md` (update to reflect Tailwind change from Bootstrap)
- Verify: compliance checklist from spec

- [ ] **Step 1: Update CLAUDE.md to reflect Tailwind**

In `CLAUDE.md`, change:
```
- **Styling:** Use Bootstrap. Minimize custom CSS.
```
To:
```
- **Styling:** Use Tailwind CSS (local compiled). Minimize custom CSS.
```

- [ ] **Step 2: Verify .gitignore completeness**

Confirm `.gitignore` contains:
```
node_modules/
.env
*.db
```

Run `git status` — verify `.env` and `*.db` files are not tracked.

- [ ] **Step 3: Add AI-usage comments to all AI-generated files**

Every file in `public/js/` and `server/routes/ai.js` already starts with `// AI-generated:`. Verify all files have the comment. Add to any that are missing.

- [ ] **Step 4: Run compliance checklist**

```
[x] No CDNs — Tailwind compiled locally in public/css/tailwind.css
[x] .env in .gitignore
[x] AI usage documented in ai_usage.log
[x] AI code commented with // AI-generated: prefix
[x] Gemini key entered by user via Settings panel, stored in SQLite, never hardcoded
[ ] Lighthouse screenshot saved to docs/lighthouse-score.png (done in Task 15)
[x] "Thank You" Credits modal with all library attributions
[x] Unique branding: BlockDraft name, BD favicon
[x] CLAUDE.md (rules file) included in project
```

- [ ] **Step 5: Generate example resume PDF**

1. Start app: `npm start`
2. Add realistic resume data (name section at top, 2+ work entries, education, skills)
3. Click "Print / PDF" → Save as PDF → `docs/example-resume.pdf`

- [ ] **Step 6: Final commit**

```bash
git add CLAUDE.md ai_usage.log docs/example-resume.pdf
git commit -m "docs: compliance checklist complete, example resume PDF, AI usage log finalized"
```

- [ ] **Step 7: Push to GitHub and make repo public**

```bash
git push origin main
```

Verify repo is public at your GitHub URL. Copy the URL for inclusion in submission ZIP.

---

## Submission ZIP Contents Checklist

```
blockdraft-submission.zip
├── (all project files — run npm install to restore node_modules)
├── CLAUDE.md                    ← rules file
├── ai_usage.log                 ← AI usage documentation
├── docs/
│   ├── lighthouse-score.png     ← Lighthouse 93+ screenshot
│   ├── example-resume.pdf       ← sample resume built with the app
│   └── superpowers/specs/       ← design spec
├── .env.example                 ← template (NOT .env with real keys)
└── README.md or instructions    ← how to run, GitHub link
```
