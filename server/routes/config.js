const express = require('express');
const router = express.Router();
const db = require('../db');
const { getEnvValue, setEnvValue } = require('../env');

router.get('/:key', (req, res) => {
  if (req.params.key === 'gemini_key') {
    const value = getEnvValue('GEMINI_API_KEY');
    if (!value) return res.status(404).json({ error: 'Key not found' });
    return res.json({ key: req.params.key, value });
  }

  const row = db.prepare('SELECT value FROM config WHERE key = ?').get(req.params.key);
  if (!row) return res.status(404).json({ error: 'Key not found' });
  res.json({ key: req.params.key, value: row.value });
});

router.put('/:key', (req, res) => {
  const { value } = req.body;
  if (value === undefined) return res.status(400).json({ error: 'value required' });

  if (req.params.key === 'gemini_key') {
    const clean = String(value).trim();
    if (!/^[\x20-\x7E]+$/.test(clean)) {
      return res.status(400).json({ error: 'API key contains invalid characters — re-paste it.' });
    }
    setEnvValue('GEMINI_API_KEY', clean);
    return res.json({ ok: true });
  }

  db.prepare('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)').run(req.params.key, value);
  res.json({ ok: true });
});

module.exports = router;
