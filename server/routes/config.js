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
