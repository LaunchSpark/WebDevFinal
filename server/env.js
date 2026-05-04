const fs = require('fs');
const path = require('path');

const ENV_FILE = process.env.ENV_FILE || path.join(__dirname, '..', '.env');

function getEnvFilePath() {
  return ENV_FILE;
}

function readEnvFile() {
  try {
    return fs.readFileSync(ENV_FILE, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return '';
    throw err;
  }
}

function getEnvValue(key) {
  const content = readEnvFile();
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = content.match(new RegExp(`^${escapedKey}=(.*)$`, 'm'));

  if (!match) return process.env[key] || null;

  const rawValue = match[1].trim();
  const quoted =
    (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
    (rawValue.startsWith("'") && rawValue.endsWith("'"));

  return quoted ? rawValue.slice(1, -1) : rawValue;
}

function setEnvValue(key, value) {
  const content = readEnvFile();
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^${escapedKey}=.*$`, 'm');
  const nextContent = pattern.test(content)
    ? content.replace(pattern, line)
    : `${content}${content && !content.endsWith('\n') ? '\n' : ''}${line}\n`;

  fs.writeFileSync(ENV_FILE, nextContent, 'utf8');
  process.env[key] = value;
}

module.exports = {
  getEnvFilePath,
  getEnvValue,
  setEnvValue
};
