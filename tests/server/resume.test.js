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
      "INSERT INTO sections (name, type, order_index) VALUES ('Work Experience', 'work-experience', 0)"
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
    expect(res.body[0].type).toBe('work-experience');
    expect(res.body[0].entries).toHaveLength(1);
    expect(res.body[0].entries[0].title).toBe('Acme Corp');
    expect(res.body[0].entries[0].bullets).toHaveLength(1);
    expect(res.body[0].entries[0].bullets[0].text).toBe('Built scalable systems');
  });
});

describe('POST /api/sections', () => {
  test('creates a section with new type and returns it', async () => {
    const res = await request(app)
      .post('/api/sections')
      .send({ name: 'Work Experience', type: 'work-experience', order_index: 0 });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.name).toBe('Work Experience');
    expect(res.body.type).toBe('work-experience');
  });

  test('creates technical-projects section', async () => {
    const res = await request(app)
      .post('/api/sections')
      .send({ name: 'Technical Projects', type: 'technical-projects', order_index: 0 });
    expect(res.status).toBe(201);
    expect(res.body.type).toBe('technical-projects');
  });

  test('creates clubs-and-organization section', async () => {
    const res = await request(app)
      .post('/api/sections')
      .send({ name: 'Clubs and Organization', type: 'clubs-and-organization', order_index: 0 });
    expect(res.status).toBe(201);
    expect(res.body.type).toBe('clubs-and-organization');
  });

  test('creates education section', async () => {
    const res = await request(app)
      .post('/api/sections')
      .send({ name: 'Education', type: 'education', order_index: 0 });
    expect(res.status).toBe(201);
    expect(res.body.type).toBe('education');
  });

  test('creates skills section', async () => {
    const res = await request(app)
      .post('/api/sections')
      .send({ name: 'Skills', type: 'skills', order_index: 0 });
    expect(res.status).toBe(201);
    expect(res.body.type).toBe('skills');
  });

  test('rejects legacy type experience with 500', async () => {
    const res = await request(app)
      .post('/api/sections')
      .send({ name: 'Old Style', type: 'experience', order_index: 0 });
    expect(res.status).toBe(500);
  });

  test('rejects legacy type awards with 500', async () => {
    const res = await request(app)
      .post('/api/sections')
      .send({ name: 'Awards', type: 'awards', order_index: 0 });
    expect(res.status).toBe(500);
  });

  test('rejects legacy type certs with 500', async () => {
    const res = await request(app)
      .post('/api/sections')
      .send({ name: 'Certs', type: 'certs', order_index: 0 });
    expect(res.status).toBe(500);
  });
});

describe('DELETE /api/sections/:id cascade', () => {
  test('deletes entries and bullets when section is deleted', async () => {
    const sec = db.prepare(
      "INSERT INTO sections (name, type, order_index) VALUES ('Test', 'work-experience', 0)"
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
      "INSERT INTO sections (name, type, order_index) VALUES ('Work', 'work-experience', 0)"
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
