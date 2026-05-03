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
