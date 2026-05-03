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
