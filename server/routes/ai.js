const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getEnvValue } = require('../env');

function buildPrompt(type, input) {
  switch (type) {
    case 'work-experience':
    case 'technical-projects':
    case 'clubs-and-organization':
      return `Rewrite as an impact-driven resume bullet point. Start with an action verb. Include a measurable outcome if possible. Return ONLY the rewritten bullet, no explanation, no prefix. Input: ${input}`;
    case 'certifications':
      return `Rewrite this certification entry to be more professional and impactful for a resume. Return ONLY the improved text: ${input}`;
    case 'awards':
      return `Rewrite this award or honor to highlight its significance for a resume. Return ONLY the improved text: ${input}`;
    case 'skills':
      return `Given these skills: ${input}. Suggest 3 missing high-value keywords for a software developer role. Return ONLY a comma-separated list, no explanation.`;
    case 'education':
      return `Write one professional sentence highlighting academic achievement based on: ${input}. Return ONLY the sentence.`;
    default:
      return `Improve this resume text to be more professional and concise. Return ONLY the improved text: ${input}`;
  }
}

function getApiKey() {
  return getEnvValue('GEMINI_API_KEY');
}

router.post('/refine', async (req, res) => {
  const { type, input } = req.body;
  if (!input) return res.status(400).json({ error: 'input required' });

  const apiKey = getApiKey();
  if (!apiKey) return res.status(400).json({ error: 'No Gemini API key configured. Add it in Settings.' });
  if (!/^[\x20-\x7E]+$/.test(apiKey)) {
    return res.status(400).json({ error: 'Stored API key contains invalid characters — re-enter it in Settings.' });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(buildPrompt(type, input));
    const refined = result.response.text().trim();
    res.json({ refined });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
