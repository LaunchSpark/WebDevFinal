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
