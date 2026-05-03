# BlockDraft — Design Spec
**Date:** 2026-05-03  
**Course:** CSC3100 Final  
**Target Grade:** A (100%)

---

## 1. Overview

BlockDraft is a desktop resume editor. Users build a resume by adding typed "cells" to a virtual paper canvas. Each cell maps to a resume section (Work Experience, Education, Skills, Awards/Certs). Cells toggle between a polished view state and a structured edit form on click. Data persists to SQLite via a local Express REST API. A Gemini AI integration refines individual entries on demand.

---

## 2. Technical Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | Vanilla JS (ES6 modules), HTML5 | No frameworks |
| Styling | Tailwind CSS (local compiled) + print.css | No CDN |
| Desktop wrapper | ElectronJS | Added after dev; wraps localhost server |
| Backend | Node.js + Express | RESTful API on localhost:3001 |
| Database | SQLite (better-sqlite3) | Local file |
| AI | Google Gemini API (generative-ai SDK) | Key stored in .env |

---

## 3. Folder Structure

```
BlockDraft/
├── main.js                     # Electron entry; spawns Express child process
├── .env                        # GEMINI_API_KEY (gitignored)
├── .gitignore                  # node_modules, .env, *.db
├── package.json
├── ai_usage.log                # Required AI documentation
├── server/
│   ├── app.js                  # Express setup, CORS, JSON middleware, route mounting
│   ├── db.js                   # SQLite connection, PRAGMA foreign_keys = ON, schema init
│   └── routes/
│       ├── sections.js         # GET /sections, POST, PATCH /:id, DELETE /:id
│       ├── entries.js          # GET /entries?sectionId=, POST, PATCH /:id, DELETE /:id
│       ├── bullets.js          # GET /bullets?entryId=, POST, PATCH /:id, DELETE /:id
│       ├── ai.js               # POST /ai/refine
│       └── config.js           # GET /config/:key, PUT /config/:key
├── public/
│   ├── index.html              # Single HTML file (SPA)
│   ├── css/
│   │   ├── tailwind.css        # Local compiled Tailwind output
│   │   └── print.css           # @media print rules
│   ├── js/
│   │   ├── state.js            # Exports shared resumeData = { sections: [] }
│   │   ├── api.js              # fetch() wrappers for all Express routes
│   │   ├── ui.js               # renderCanvas(), renderCell(), toolbar injection
│   │   ├── core.js             # Event delegation, blur-save, toolbar wiring, init
│   │   ├── ai.js               # refine(type, input) → POST /api/ai/refine
│   │   └── cells/
│   │       ├── CellFactory.js  # static create(type, data) switch statement
│   │       ├── ExperienceCell.js
│   │       ├── EducationCell.js
│   │       ├── SkillCell.js
│   │       └── AwardCell.js
│   ├── assets/
│   │   ├── favicon.ico
│   │   └── icon-*.svg          # BlockDraft UI icons (local, no CDN)
│   └── vendor/                 # Local copies of any third-party JS/CSS
└── docs/
    └── superpowers/
        └── specs/
            └── 2026-05-03-blockdraft-design.md
```

---

## 4. Database Schema

```sql
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
  title       TEXT,
  subtitle    TEXT,
  date        TEXT,
  extra       TEXT,   -- GPA for education; issuer for certs/awards; CSV skill list for skills
  is_selected INTEGER NOT NULL DEFAULT 1,
  order_index INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS bullets (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_id    INTEGER NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  text        TEXT NOT NULL,
  is_selected INTEGER NOT NULL DEFAULT 1,
  order_index INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS config (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

**Field usage by section type:**

| Type | title | subtitle | date | extra | bullets |
|---|---|---|---|---|---|
| experience | Company | Role/Title | Date range | — | Yes |
| education | Institution | Degree | Grad year | GPA | Optional |
| skills | Category name | — | — | CSV skill list | No |
| awards | Award name | — | Year | Issuer | No |
| certs | Cert name | — | Year | Issuer | No |

---

## 5. REST API

Base URL: `http://localhost:3001/api`

| Method | Route | Purpose |
|---|---|---|
| GET | /resume | Full nested resume: sections → entries → bullets (used on app load) |
| GET | /sections | Fetch all sections (ordered by order_index) |
| POST | /sections | Create section |
| PATCH | /sections/:id | Update name, order_index, is_visible |
| DELETE | /sections/:id | Delete section (cascades to entries + bullets) |
| GET | /entries?sectionId= | Fetch entries for a section |
| POST | /entries | Create entry |
| PATCH | /entries/:id | Update any entry fields |
| DELETE | /entries/:id | Delete entry (cascades to bullets) |
| GET | /bullets?entryId= | Fetch bullets for an entry |
| POST | /bullets | Create bullet |
| PATCH | /bullets/:id | Update text, is_selected, order_index |
| DELETE | /bullets/:id | Delete bullet |
| GET | /config/:key | Get config value (e.g. gemini_key) |
| PUT | /config/:key | Set config value |
| POST | /ai/refine | Body: { type, input } → returns { refined: string } |

---

## 6. Module Design

### state.js
Exports one object:
```js
export const resumeData = { sections: [] };
```
All modules import this. No getters/setters. Direct mutation is fine at this scale.

### api.js
One async function per operation. All return parsed JSON or throw.
Key exports: `getResume()` (calls `GET /resume`, returns full nested object), `createEntry(data)`, `updateEntry(id, patch)`, `deleteEntry(id)`, `createBullet(data)`, `updateBullet(id, patch)`, `deleteBullet(id)`, `createSection(data)`, `refineText(type, input)`, `getConfig(key)`, `setConfig(key, value)`.

### core.js
- Calls `getResume()` on load — one request returns full nested data — populates `resumeData`, calls `renderCanvas()`
- Single `click` listener on `#page-canvas` — delegates to active cell
- Single `focusout` listener on `#page-canvas` — triggers blur-save on active cell
- Wires toolbar buttons: Move Up/Down swaps `order_index` + re-renders; Delete calls DELETE route; AI Refine calls `ai.js`

### ui.js
- `renderCanvas()` — clears canvas, iterates `resumeData.sections`, calls `CellFactory.create()` per entry, appends to DOM
- `injectToolbar(cellEl)` — appends floating toolbar to left margin of active cell
- `removeToolbar()` — cleans up on blur

### CellFactory + Cell classes
```js
// CellFactory.js
static create(type, data) {
  switch(type) {
    case 'experience': return new ExperienceCell(data);
    case 'education':  return new EducationCell(data);
    case 'skills':     return new SkillCell(data);
    case 'awards':
    case 'certs':      return new AwardCell(data);
    default:           throw new Error(`Unknown cell type: ${type}`);
  }
}
```
Each cell class has two methods:
- `renderView()` → returns HTML string (semantic, ARIA-labelled)
- `renderEdit()` → returns HTML string (form fields matching section type)

### ai.js
```js
export async function refine(type, input) {
  const res = await fetch('/api/ai/refine', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, input })
  });
  return (await res.json()).refined;
}
```
Server-side (`routes/ai.js`) builds prompt by type, calls Gemini SDK, sanitizes output, returns it. Never exposes API key to frontend.

**Prompts by type:**
- `experience`: "Rewrite as an impact-driven resume bullet. Start with an action verb and include a measurable outcome if possible. Input: [text]"
- `skills`: "Given these skills: [CSV list], suggest 3 missing high-value keywords for a software developer role. Return as comma-separated values only."
- `awards`/`certs`: "Rewrite this award or certification description to sound more professional and concise: [text]"
- `education`: "Suggest one sentence that describes academic achievements based on: [text]"

---

## 7. UI/UX Architecture

### Paper Canvas
- `.page-canvas` — 8.5in × 11in, centered, white background, soft box-shadow on grey page background
- Sections render as stacked groups; entries within sections render as cells
- Section headers are `<h2>` with `role="heading"` and `aria-level`

### Cell Interaction
1. View state: semantic HTML (`<h3>`, `<p>`, `<ul>`) — read-only
2. Click → edit state: type-aware form fields replace view HTML
3. Blur (focusout) → PATCH entry → re-render view state
4. Active cell gets left-margin toolbar (position: absolute, outside print area)

### Add Menu
`[+ Add Section]` button opens a small dropdown:
- Add Work Experience
- Add Education
- Add Skills Category
- Add Award
- Add Certification

Each option creates a new Entry under the existing section of that type. If no section of that type exists yet, it is created automatically first. This means there is at most one section per type, but each section can have unlimited entries.

### Settings Panel
Hidden panel (toggled from header) for entering Gemini API key. Calls `PUT /config/gemini_key`. Key stored in SQLite `config` table, never in frontend JS.

### Print Flow
- `[Print / Export PDF]` button calls `window.print()`
- `print.css` hides: `#toolbar`, `#add-btn`, `.cell-edit-form`, `#settings-panel`, `.page-toolbar`
- `print.css` sets: `font-family: Georgia, serif`, `@page { margin: 0.75in }`, `.page-canvas { box-shadow: none; width: 100% }`

---

## 8. Accessibility (Lighthouse 93+ Target)

- All form inputs have `<label>` with `for` attribute
- All interactive elements have `aria-label` or visible text
- Toolbar buttons have `aria-label="Move entry up"` etc.
- Color contrast: Tailwind `text-gray-900` on `bg-white` minimum
- Section headers use correct `<h1>`–`<h3>` hierarchy
- Canvas has `role="main"` and `aria-label="Resume editor"`
- Print view hides decorative elements from screen readers with `aria-hidden="true"`

---

## 9. Compliance Checklist

- [ ] No CDNs — Tailwind compiled locally, all vendor files in `/public/vendor/`
- [ ] `.env` in `.gitignore`
- [ ] AI usage documented in `ai_usage.log` and inline comments
- [ ] Gemini API key entered by user, stored in SQLite config, never hardcoded
- [ ] Lighthouse score 93+ documented with screenshot
- [ ] "Thank You" popup attributing all third-party libraries
- [ ] Unique branding: BlockDraft name, custom favicon, custom icons
- [ ] Public GitHub repo link in submission
- [ ] Example PDF resume generated from the app included in submission
- [ ] `CLAUDE.md` and AI rules file included in submission ZIP

---

## 10. Development Phases

| Phase | Days | Deliverable |
|---|---|---|
| 1 — Shell | 1–2 | Git init, Electron stub, paper canvas CSS, Express + SQLite running |
| 2 — Block Builder | 3–5 | CellFactory + all cell types, click-to-edit, blur-save CRUD |
| 3 — AI Integration | 6 | Gemini route, refine button, API key settings panel |
| 4 — Polish | 7 | Lighthouse fixes, print CSS, Thank You popup, favicon/icons, ai_usage.log |
