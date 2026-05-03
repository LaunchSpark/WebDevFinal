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
