# Resume Styling — Match LucasStarkeyResume.html Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update BlockDraft's cell view rendering, section headings, canvas typography, and print CSS to visually match the LucasStarkeyResume.html reference — Times New Roman throughout, correct section/entry/bullet sizing, tight line-height, correct print margins.

**Architecture:** All changes are purely cosmetic — no DB schema changes, no route changes, no new files. Four layers touched: (1) `public/index.html` canvas font, (2) `public/js/ui.js` section heading style, (3) all four `public/js/cells/*.js` `renderView()` methods, (4) `public/css/print.css` typography and margin corrections. `renderEdit()` methods are untouched (edit UI stays in Tailwind/sans-serif).

**Tech Stack:** Vanilla JS ES6 modules, Tailwind CSS (inline `style=` attributes used for pt-based font sizes — Tailwind doesn't expose pt units without JIT rebuild). Print CSS `@media print` block.

**Reference observations from LucasStarkeyResume.html:**
- Font: `Times New Roman` everywhere, black text
- Name header: 20pt bold centered (handled separately — not in this plan's scope)
- Section headings: 13pt bold, left-aligned, **no uppercase**, border-bottom black
- Experience entries: `[date — left]` / `[company bold — right]` on one row; role bold 12pt on second row; bullets 11pt
- Education entries: `[institution bold — left]` / `[grad year — right]`; degree 11pt below; GPA if present
- Skills: inline `**Category:** skills list` — no bullets, 11pt
- Awards/Certs: `[title bold — left]` / `[year — right]`; issuer italic 11pt below
- Print margins: 36pt top/bottom, 72pt left/right (≈ 0.5in / 1in)
- Line-height: 0.9–1.15 (tight)

---

## Files Modified

| File | What changes |
|---|---|
| `public/index.html` | Add `font-family: 'Times New Roman', serif` to `#page-canvas` inline style |
| `public/js/ui.js` | Section heading: remove `uppercase tracking-widest text-sm`, change border color, add `font-size: 13pt` |
| `public/js/cells/ExperienceCell.js` | `renderView()` — flip layout (date left / company right), role bold 12pt, bullets 11pt tight |
| `public/js/cells/EducationCell.js` | `renderView()` — institution left / date right, degree italic 11pt |
| `public/js/cells/SkillCell.js` | `renderView()` — inline bold-category + normal-weight skills, 11pt |
| `public/js/cells/AwardCell.js` | `renderView()` — title left / year right, issuer italic 11pt |
| `public/css/print.css` | Fix unit-less padding bug, correct @page margins, section heading 13pt non-uppercase, entry title 12pt, body 11pt tight line-height |

---

## Task 1: Canvas Base Typography + Section Heading

**Files:**
- Modify: `public/index.html` (line 95 — #page-canvas style attribute)
- Modify: `public/js/ui.js` (line 24 — heading.className)

- [ ] **Step 1: Add Times New Roman to #page-canvas**

In `public/index.html`, find the `#page-canvas` div. Change:
```html
        style="width: 8.5in; min-height: 11in;"
```
To:
```html
        style="width: 8.5in; min-height: 11in; font-family: 'Times New Roman', Times, serif;"
```

- [ ] **Step 2: Update section heading in ui.js**

In `public/js/ui.js`, find the `heading.className = ...` line (line 24). Replace the entire `heading.className` assignment AND add a `heading.style.fontSize` line:

Replace:
```javascript
    heading.className = 'section-heading text-sm font-bold uppercase tracking-widest border-b border-gray-400 pb-0.5 mb-2 text-gray-900';
```
With:
```javascript
    heading.className = 'section-heading font-bold border-b border-gray-800 pb-0.5 mb-2 text-gray-900';
    heading.style.fontSize = '13pt';
```

- [ ] **Step 3: Verify visually**

```bash
node server/app.js &
sleep 2
curl -s http://localhost:3001 | grep -c "Times New Roman"
```
Expected: `1` (the font-family string is present in served HTML).

Kill the server: `kill %1`

- [ ] **Step 4: Commit**

```bash
git add public/index.html public/js/ui.js
git commit -m "style: canvas Times New Roman font, section heading 13pt non-uppercase"
```

---

## Task 2: ExperienceCell renderView()

**Files:**
- Modify: `public/js/cells/ExperienceCell.js` (`renderView()` method only — `renderEdit()` unchanged)

Reference layout:
```
[Feb 2025 – Current]            [Averitt Express]   ← date left, company bold right
[Tech Support Specialist]                            ← role bold 12pt
• Bullet one (11pt)
• Bullet two
```

- [ ] **Step 1: Replace renderView() in ExperienceCell.js**

Find the `renderView()` method (lines 5–19). Replace it entirely with:

```javascript
  renderView() {
    const bullets = (this.data.bullets || [])
      .filter(b => b.is_selected)
      .map(b => `<li style="font-size:11pt; line-height:1.2; margin-left:1.2em">${escHtml(b.text)}</li>`)
      .join('');
    return `
      <div class="cell-view" role="article" aria-label="Work experience: ${escHtml(this.data.title || 'untitled')}">
        <div class="flex justify-between items-baseline">
          <span class="text-gray-900" style="font-size:11pt">${escHtml(this.data.date || '')}</span>
          <h3 class="entry-title font-bold text-gray-900" style="font-size:12pt">${escHtml(this.data.title || '')}</h3>
        </div>
        <p class="font-bold text-gray-900" style="font-size:11pt; line-height:1.2">${escHtml(this.data.subtitle || '')}</p>
        ${bullets ? `<ul class="list-none text-gray-900" style="margin-top:2pt">${bullets}</ul>` : ''}
      </div>`;
  }
```

- [ ] **Step 2: Commit**

```bash
git add public/js/cells/ExperienceCell.js
git commit -m "style: ExperienceCell view — date left/company right, role bold 12pt, bullets 11pt"
```

---

## Task 3: EducationCell renderView()

**Files:**
- Modify: `public/js/cells/EducationCell.js` (`renderView()` only)

Reference layout:
```
[Tennessee Technological University]      [Cookeville, TN]   ← institution left, date right
[Major: Computer Science]                                    ← degree 11pt
[Concentration: ...]                                         ← extra (GPA) 11pt if present
```

Note: `date` field = graduation year, `extra` field = GPA. No location in schema — skip location.

- [ ] **Step 1: Replace renderView() in EducationCell.js**

Find the `renderView()` method (lines 5–15). Replace it entirely with:

```javascript
  renderView() {
    return `
      <div class="cell-view" role="article" aria-label="Education: ${escHtml(this.data.title || 'untitled')}">
        <div class="flex justify-between items-baseline">
          <h3 class="entry-title font-bold text-gray-900" style="font-size:12pt">${escHtml(this.data.title || '')}</h3>
          <span class="text-gray-900" style="font-size:11pt">${escHtml(this.data.date || '')}</span>
        </div>
        <p class="text-gray-900" style="font-size:11pt; line-height:1.2">${escHtml(this.data.subtitle || '')}</p>
        ${this.data.extra ? `<p class="text-gray-900" style="font-size:11pt; line-height:1.2">GPA: ${escHtml(this.data.extra)}</p>` : ''}
      </div>`;
  }
```

- [ ] **Step 2: Commit**

```bash
git add public/js/cells/EducationCell.js
git commit -m "style: EducationCell view — institution left/date right, degree 11pt"
```

---

## Task 4: SkillCell renderView()

**Files:**
- Modify: `public/js/cells/SkillCell.js` (`renderView()` only)

Reference layout (single line, no bullets):
```
Languages & Frameworks: Python (NumPy, Pandas), R, C++, JavaScript, Bash, SQL
```
Bold category name + colon, then normal weight skills, all inline 11pt.

- [ ] **Step 1: Replace renderView() in SkillCell.js**

Find the `renderView()` method (lines 5–11). Replace it entirely with:

```javascript
  renderView() {
    return `
      <div class="cell-view" role="article" aria-label="Skills: ${escHtml(this.data.title || 'category')}">
        <p class="text-gray-900" style="font-size:11pt; line-height:1.3">
          <span class="font-bold">${escHtml(this.data.title || '')}: </span><span>${escHtml(this.data.extra || '')}</span>
        </p>
      </div>`;
  }
```

- [ ] **Step 2: Commit**

```bash
git add public/js/cells/SkillCell.js
git commit -m "style: SkillCell view — inline bold-category + normal skills list 11pt"
```

---

## Task 5: AwardCell renderView()

**Files:**
- Modify: `public/js/cells/AwardCell.js` (`renderView()` only)

Layout (consistent with other entry types):
```
[Award Name bold]                         [Year]   ← title left, date right
[Issuer — italic]                                  ← extra italic 11pt if present
```

- [ ] **Step 1: Replace renderView() in AwardCell.js**

Find the `renderView()` method (lines 5–14). Replace it entirely with:

```javascript
  renderView() {
    return `
      <div class="cell-view" role="article" aria-label="${escHtml(this.data.title || 'Award/Certification')}">
        <div class="flex justify-between items-baseline">
          <h3 class="entry-title font-bold text-gray-900" style="font-size:12pt">${escHtml(this.data.title || '')}</h3>
          <span class="text-gray-900" style="font-size:11pt">${escHtml(this.data.date || '')}</span>
        </div>
        ${this.data.extra ? `<p class="italic text-gray-900" style="font-size:11pt; line-height:1.2">${escHtml(this.data.extra)}</p>` : ''}
      </div>`;
  }
```

- [ ] **Step 2: Commit**

```bash
git add public/js/cells/AwardCell.js
git commit -m "style: AwardCell view — title left/year right, issuer italic 11pt"
```

---

## Task 6: Print CSS Corrections

**Files:**
- Modify: `public/css/print.css`

**Issues to fix:**
1. Unit-less `padding-left: 15 !important` and `padding-right: 15 !important` on `#page-canvas` — invalid CSS (no unit). Remove since padding is already reset to 0.
2. `@page` margin: reference uses 36pt/72pt (0.5in top/bottom, 1in left/right). Update from `0.75in` all-around.
3. `h2.section-heading`: remove `text-transform: uppercase` and `letter-spacing`, change font-size to 13pt, border color to black.
4. `h3.entry-title`: ensure 12pt bold, black.
5. `p, li, span`: ensure 11pt, line-height 1.15 (tight but readable).
6. Add `font-family: 'Times New Roman', Times, serif` to `#page-canvas` print rule.

- [ ] **Step 1: Rewrite print.css**

Replace the entire content of `public/css/print.css` with:

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
    font-family: 'Times New Roman', Times, serif !important;
    font-size: 11pt;
    color: black;
  }

  /* Hide deselected entries */
  .entry-deselected {
    display: none !important;
  }

  /* Section headings — 13pt bold, left-aligned, bottom border, no uppercase */
  h2.section-heading {
    font-size: 13pt;
    font-weight: bold;
    text-transform: none;
    letter-spacing: normal;
    border-bottom: 1px solid black;
    padding-bottom: 1pt;
    margin-bottom: 4pt;
    margin-top: 8pt;
    color: black;
  }

  /* Entry titles */
  h3.entry-title {
    font-size: 12pt;
    font-weight: bold;
    color: black;
    margin: 0;
  }

  p, li, span {
    font-size: 11pt;
    line-height: 1.15;
    color: black;
  }

  ul {
    margin-left: 1.2em;
    padding-left: 0;
    list-style-type: disc;
  }

  .cell-wrapper {
    cursor: default !important;
    margin-bottom: 4pt !important;
    background: transparent !important;
    border: none !important;
    padding: 0 !important;
    outline: none !important;
  }

  /* Page margins: 0.5in top/bottom, 1in left/right — matches reference */
  @page {
    margin: 0.5in 1in;
    size: letter portrait;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add public/css/print.css
git commit -m "style: print CSS — Times New Roman, 13pt headings, correct margins, fix unit-less padding bug"
```

---

## Task 7: Rebuild Tailwind + Final Verification

**Files:**
- Modify: `public/css/tailwind.css` (auto-generated by build step)

- [ ] **Step 1: Rebuild Tailwind**

```bash
npm run build:css
```

Expected: exits 0, `Done in Xms`.

- [ ] **Step 2: Start server and verify in browser**

```bash
node server/app.js &
sleep 2
curl -s http://localhost:3001 | grep "Times New Roman"
```

Expected: line containing `font-family: 'Times New Roman', Times, serif;`

Kill server: `kill %1`

- [ ] **Step 3: Smoke-test the full cell render chain**

Start server (`npm start`). In browser at `http://localhost:3001`:
1. Click "+ Add Section" → "Work Experience" → a blank ExperienceCell appears
2. Click the cell to edit → type `Acme Corp` in Company, `2023–Present` in Date, `Software Engineer` in Role → click outside → **cell should render:** date on left, "Acme Corp" bold on right, "Software Engineer" bold below in Times New Roman
3. Click "+ Add Section" → "Skills Category" → type `Languages` in category, `Python, JavaScript, SQL` in skills → blur → **renders:** "**Languages:** Python, JavaScript, SQL" inline
4. Click "⎙ Print / PDF" → print preview → verify: sidebar hidden, Times New Roman visible, no colored rings

- [ ] **Step 4: Commit rebuilt CSS**

```bash
git add public/css/tailwind.css
git commit -m "build: rebuild Tailwind after resume styling pass"
```

---

## Self-Review

**Spec coverage:**
- ✅ Times New Roman canvas font — Task 1
- ✅ Section headings 13pt bold no-uppercase — Tasks 1+6
- ✅ Experience date/company row layout — Task 2
- ✅ Experience role bold 12pt — Task 2
- ✅ Bullets 11pt tight — Task 2
- ✅ Education institution/date row — Task 3
- ✅ Skills inline bold-category format — Task 4
- ✅ Awards title/year row, issuer italic — Task 5
- ✅ Print margins 0.5in/1in — Task 6
- ✅ Print font-family override — Task 6
- ✅ Unit-less padding bug fixed — Task 6

**Placeholder scan:** None found. All code blocks are complete.

**Type consistency:** `escHtml()` and `escAttr()` already defined in each cell file — used consistently across all renderView() replacements.

**Gaps noted (out of scope for this plan):**
- Name/contact header block (Lucas Starkey, email, phone) — no `header` section type in DB schema. Separate plan needed.
- `entry-deselected` entries currently show as `opacity-50` on screen but are fully hidden in print — correct behavior.
- `renderEdit()` methods are unchanged — edit UI intentionally stays in sans-serif Tailwind style to distinguish edit vs. view modes.
