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
