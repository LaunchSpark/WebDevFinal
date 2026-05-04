const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'blockdraft.db');
const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

// Wipe existing data
db.exec('DELETE FROM bullets; DELETE FROM entries; DELETE FROM sections; DELETE FROM config;');

// Header
db.prepare("INSERT INTO config (key, value) VALUES ('resume_header', ?)").run(
  JSON.stringify({
    name:    'Lucas Starkey',
    phone:   '(931) 881-8495',
    email:   'LucasStarkey255@gmail.com',
    link:    'github.com/LaunchSpark',
    address: 'Cookeville, TN'
  })
);

function addSection(name, type, order_index) {
  return db.prepare(
    'INSERT INTO sections (name, type, order_index) VALUES (?, ?, ?)'
  ).run(name, type, order_index).lastInsertRowid;
}

function addEntry(section_id, { title = '', subtitle = '', date = '', extra = '' }, order_index) {
  return db.prepare(
    'INSERT INTO entries (section_id, title, subtitle, date, extra, order_index) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(section_id, title, subtitle, date, extra, order_index).lastInsertRowid;
}

function addBullet(entry_id, text, order_index) {
  db.prepare(
    'INSERT INTO bullets (entry_id, text, order_index) VALUES (?, ?, ?)'
  ).run(entry_id, text, order_index);
}

// ── Education ────────────────────────────────────────────────────────────────
const eduSec = addSection('Education', 'education', 0);
const eduEnt = addEntry(eduSec, {
  title:    'Tennessee Technological University',
  subtitle: 'Major: Computer Science — Concentration: Data Science and Artificial Intelligence',
  date:     'Exp: Dec 2026',
  extra:    'Cookeville, TN'
}, 0);

// ── Technical Projects ────────────────────────────────────────────────────────
const projSec = addSection('Technical Projects', 'technical-projects', 1);
const projEnt = addEntry(projSec, {
  title:    'Ticket to Ride Simulation & AI Framework',
  subtitle: 'Architect & Solo Developer',
  date:     'Python, Graph Theory, Stochastic Modeling',
  extra:    ''
}, 0);
[
  'Simulation Engine: Engineered a high-fidelity game engine from scratch, implementing Adjacency-list graph construction and CSV-driven data ingestion to enable modular, scalable map loading.',
  'Graph Algorithms: Developed a custom path-evaluation system using Recursive Depth-First Search (DFS) to calculate connected components and recompute Longest Path metrics in O(V+E) time during real-time state changes.',
  'Security & Architecture: Built a secure agent interface using Defensive Deepcopying and Weak References to enforce hidden-information constraints, preventing memory leaks and state-injection during competitive play.',
  'AI & Decision Theory: Built a probabilistic decision-making agent that maximizes expected utility using Bayesian inference to estimate opponent hidden states from observed actions, enabling predictive modeling, uncertainty quantification, and data-driven strategic optimization in a partially observable environment.',
  'Data Interpretability: Analyzed tournament execution logs to extract winning heuristics, translating complex agent behavior into interpretable strategies and actionable insights for human competitive play.'
].forEach((text, i) => addBullet(projEnt, text, i));

// ── Work Experience ───────────────────────────────────────────────────────────
const workSec = addSection('Work Experience', 'work-experience', 2);
const workEnt = addEntry(workSec, {
  title:    'Averitt Express',
  subtitle: 'Tech Support Specialist',
  date:     'Feb 2025 - Current',
  extra:    'Cookeville, TN'
}, 0);
[
  'Orchestrate weekly maintenance for hybrid IBM AS/400 and Windows production environments, utilizing Bash and CLI to ensure 99.9% system uptime.',
  'Cross-Functional Data Integration: Collaborated with three internal departments to audit monitoring requirements; engineered custom integrations to fetch and centralize siloed metrics into Grafana for real-time enterprise observability.',
  'Execute system IPL processes and manage Hardware Management Console (HMC) operations to minimize downtime during critical maintenance windows.',
  'Proactively monitor infrastructure health using VMware, Adeptia, and WhatsUp Gold to identify and resolve system bottlenecks before they impact operations.'
].forEach((text, i) => addBullet(workEnt, text, i));

// ── Clubs and Organization ────────────────────────────────────────────────────
const clubSec = addSection('Clubs and Organization', 'clubs-and-organization', 3);
const clubEnt = addEntry(clubSec, {
  title:    'Baptist Collegiate Ministry',
  subtitle: 'Technical Leadership & Data Systems',
  date:     'Jan 2024 - Current',
  extra:    'Cookeville, TN'
}, 0);
[
  'Engineered an end-to-end attendance and engagement tracking system to resolve critical visibility gaps in organizational growth metrics.',
  'Developed and deployed automated leader assessments and surveys; analyzed results to bridge the gap between "idealized" goals and "on-the-ground" reality.',
  'Leveraged survey data to overhaul the leadership interviewing process and design targeted training curricula, ensuring clear, data-backed expectations for over 45 small group leaders.',
  "Developed custom integration using Canva's REST API to automate slide aggregation, reducing weekly event setup time by 50%."
].forEach((text, i) => addBullet(clubEnt, text, i));

// ── Skills ────────────────────────────────────────────────────────────────────
const skillSec = addSection('Skills', 'skills', 4);
[
  { title: 'Languages & Frameworks', extra: 'Python (NumPy, Pandas), R, C++, JavaScript, Bash, SQL, YAML, HTML/CSS.' },
  { title: 'Data & AI',              extra: 'Bayesian Inference, Expected Utility, Stochastic Modeling, Graph Theory, Grafana, RESTful APIs, JSON.' },
  { title: 'DevOps & Infrastructure', extra: 'Docker, Git/GitHub, Linux Admin, VMware, IBM iSeries (AS/400).' },
  { title: 'Developer Tools',        extra: 'VS Code, PyCharm, Knox Manage, Adeptia, RDP.' }
].forEach((row, i) => addEntry(skillSec, row, i));

console.log('Seeded resume for Lucas Starkey.');
db.close();
