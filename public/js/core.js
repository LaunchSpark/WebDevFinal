// AI-generated: application entry point — event delegation, blur-save, toolbar actions
import { defaultHeader, resumeData } from './state.js';
import * as api from './api.js';
import { renderCanvas, swapToEdit, swapToView, injectToolbar, removeToolbar } from './ui.js';
import { refine } from './ai.js';

let activeCell = null;

async function init() {
  try {
    const [data, header] = await Promise.all([
      api.getResume(),
      loadHeader()
    ]);
    resumeData.sections = data;
    resumeData.header = header;
    renderCanvas();
  } catch (err) {
    console.error('Failed to load resume data:', err);
  }
  wireCanvas();
  wireAddMenu();
  wireSettingsPanel();
  wirePrintButton();
  wireThankYouModal();
}

function wireCanvas() {
  const canvas = document.getElementById('page-canvas');

  canvas.addEventListener('click', (e) => {
    // Toolbar button actions (delegated)
    const toolbarBtn = e.target.closest('[data-action]');
    if (toolbarBtn) {
      e.stopPropagation();
      handleToolbarAction(toolbarBtn.dataset.action, activeCell);
      return;
    }

    // Bullet-specific actions (delegated)
    if (e.target.classList.contains('bullet-add')) {
      handleAddBullet(e.target.closest('.cell-wrapper'));
      return;
    }
    if (e.target.classList.contains('bullet-delete')) {
      handleDeleteBullet(e.target.closest('.bullet-row'));
      return;
    }
    if (e.target.classList.contains('bullet-refine')) {
      handleRefineBullet(e.target.closest('.bullet-row'));
      return;
    }
    if (e.target.classList.contains('skill-refine') || e.target.classList.contains('award-refine')) {
      handleRefineEntryText(e.target.closest('.cell-wrapper'));
      return;
    }

    // Cell activation
    const cellWrapper = e.target.closest('.cell-wrapper');
    if (cellWrapper && cellWrapper !== activeCell) {
      if (activeCell) {
        const previousCell = activeCell;
        saveCell(previousCell).then(() => swapToView(previousCell));
      }
      activeCell = cellWrapper;
      swapToEdit(cellWrapper);
      injectToolbar(cellWrapper);
    }
  });

  // Blur-save: fires when focus leaves a cell's inputs
  canvas.addEventListener('focusout', () => {
    setTimeout(() => {
      const toolbar = document.getElementById('cell-toolbar');
      const stillInCell = activeCell?.contains(document.activeElement);
      const inToolbar = toolbar?.contains(document.activeElement);
      if (!stillInCell && !inToolbar && activeCell) {
        const cellToSave = activeCell;
        activeCell = null;
        saveCell(cellToSave).then(() => {
          swapToView(cellToSave);
          removeToolbar();
        });
      }
    }, 150);
  });
}

async function saveCell(cellWrapper) {
  const editForm = cellWrapper.querySelector('.cell-edit');
  if (!editForm) return;

  const type = cellWrapper.dataset.sectionType;

  if (type === 'header') {
    const patch = {};
    for (const field of ['name', 'phone', 'email', 'link', 'address']) {
      patch[field] = editForm.querySelector(`[name="${field}"]`)?.value ?? '';
    }
    await api.setConfig('resume_header', JSON.stringify(patch));
    Object.assign(resumeData.header, patch);
    return;
  }

  const entryId = parseInt(cellWrapper.dataset.entryId);
  const section = resumeData.sections.find(s => s.type === type);
  const entry = section?.entries.find(e => e.id === entryId);
  if (!entry) return;

  // Collect entry-level fields
  const patch = {};
  for (const field of ['title', 'subtitle', 'date', 'extra']) {
    const el = editForm.querySelector(`[name="${field}"]`);
    if (el) patch[field] = el.value;
  }
  const selEl = editForm.querySelector('[name="is_selected"]');
  if (selEl) patch.is_selected = selEl.checked ? 1 : 0;

  await api.updateEntry(entryId, patch);
  Object.assign(entry, patch);

  // Save bullets if present
  const bulletRows = editForm.querySelectorAll('.bullet-row');
  for (const row of bulletRows) {
    const bulletId = parseInt(row.dataset.bulletId);
    const text = row.querySelector('.bullet-text')?.value ?? '';
    const is_selected = row.querySelector('.bullet-select')?.checked ? 1 : 0;
    await api.updateBullet(bulletId, { text, is_selected });
    const bullet = entry.bullets?.find(b => b.id === bulletId);
    if (bullet) { bullet.text = text; bullet.is_selected = is_selected; }
  }
}

async function loadHeader() {
  try {
    const { value } = await api.getConfig('resume_header');
    return { ...defaultHeader, ...JSON.parse(value) };
  } catch (err) {
    if (String(err.message).includes('404')) return { ...defaultHeader };
    throw err;
  }
}

async function handleToolbarAction(action, cellWrapper) {
  if (!cellWrapper) return;
  const entryId = parseInt(cellWrapper.dataset.entryId);
  const type = cellWrapper.dataset.sectionType;
  const section = resumeData.sections.find(s => s.type === type);
  const entries = section?.entries || [];
  const idx = entries.findIndex(e => e.id === entryId);

  if (action === 'delete') {
    if (!confirm('Delete this entry? This cannot be undone.')) return;
    await saveCell(cellWrapper);
    await api.deleteEntry(entryId);
    entries.splice(idx, 1);
    removeToolbar();
    activeCell = null;
    renderCanvas();
  }

  if (action === 'move-up' && idx > 0) {
    const prev = entries[idx - 1];
    const curIdx = entries[idx].order_index;
    const prevIdx = prev.order_index;
    await api.updateEntry(entryId, { order_index: prevIdx });
    await api.updateEntry(prev.id, { order_index: curIdx });
    entries[idx].order_index = prevIdx;
    prev.order_index = curIdx;
    [entries[idx], entries[idx - 1]] = [entries[idx - 1], entries[idx]];
    activeCell = null;
    removeToolbar();
    renderCanvas();
  }

  if (action === 'move-down' && idx < entries.length - 1) {
    const next = entries[idx + 1];
    const curIdx = entries[idx].order_index;
    const nextIdx = next.order_index;
    await api.updateEntry(entryId, { order_index: nextIdx });
    await api.updateEntry(next.id, { order_index: curIdx });
    entries[idx].order_index = nextIdx;
    next.order_index = curIdx;
    [entries[idx], entries[idx + 1]] = [entries[idx + 1], entries[idx]];
    activeCell = null;
    removeToolbar();
    renderCanvas();
  }

  if (action === 'ai-refine') {
    await handleRefineEntryText(cellWrapper);
  }
}

async function handleAddBullet(cellWrapper) {
  await saveCell(cellWrapper);
  const entryId = parseInt(cellWrapper.dataset.entryId);
  const type = cellWrapper.dataset.sectionType;
  const section = resumeData.sections.find(s => s.type === type);
  const entry = section?.entries.find(e => e.id === entryId);
  if (!entry) return;
  const order_index = entry.bullets?.length || 0;
  const newBullet = await api.createBullet({ entry_id: entryId, text: '', order_index });
  entry.bullets = entry.bullets || [];
  entry.bullets.push(newBullet);
  swapToEdit(cellWrapper);
}

async function handleDeleteBullet(bulletRow) {
  if (!bulletRow) return;
  const bulletId = parseInt(bulletRow.dataset.bulletId);
  const cellWrapper = bulletRow.closest('.cell-wrapper');
  const entryId = parseInt(cellWrapper.dataset.entryId);
  const type = cellWrapper.dataset.sectionType;
  const section = resumeData.sections.find(s => s.type === type);
  const entry = section?.entries.find(e => e.id === entryId);
  await api.deleteBullet(bulletId);
  if (entry) entry.bullets = entry.bullets.filter(b => b.id !== bulletId);
  swapToEdit(cellWrapper);
}

async function handleRefineBullet(bulletRow) {
  if (!bulletRow) return;
  const textInput = bulletRow.querySelector('.bullet-text');
  const original = textInput.value;
  if (!original.trim()) return;
  textInput.value = 'Refining…';
  textInput.disabled = true;
  try {
    const sectionType = bulletRow.closest('.cell-wrapper')?.dataset.sectionType || 'work-experience';
    const { refined } = await refine(sectionType, original);
    textInput.value = refined;
  } catch (err) {
    textInput.value = original;
    alert('AI refine failed: ' + err.message);
  } finally {
    textInput.disabled = false;
  }
}

async function handleRefineEntryText(cellWrapper) {
  if (!cellWrapper) return;
  const type = cellWrapper.dataset.sectionType;
  const entryId = parseInt(cellWrapper.dataset.entryId);
  const section = resumeData.sections.find(s => s.type === type);
  const entry = section?.entries.find(e => e.id === entryId);

  let inputEl, input;
  if (type === 'skills') {
    inputEl = cellWrapper.querySelector('[name="extra"]');
    input = inputEl?.value || entry?.extra || '';
  } else {
    inputEl = cellWrapper.querySelector('[name="title"]');
    input = inputEl?.value || entry?.title || '';
  }
  if (!input.trim()) return;

  const origPlaceholder = inputEl?.placeholder;
  if (inputEl) { inputEl.disabled = true; inputEl.placeholder = 'Refining…'; }

  try {
    const { refined } = await refine(type, input);
    if (type === 'skills' && inputEl) {
      inputEl.value = inputEl.value ? `${inputEl.value}, ${refined}` : refined;
    } else {
      alert(`AI suggestion:\n\n${refined}`);
    }
  } catch (err) {
    alert('AI refine failed: ' + err.message);
  } finally {
    if (inputEl) { inputEl.disabled = false; inputEl.placeholder = origPlaceholder; }
  }
}

function wireAddMenu() {
  const addBtn = document.getElementById('add-btn');
  const addMenu = document.getElementById('add-menu');

  addBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const expanded = addMenu.classList.toggle('hidden');
    addBtn.setAttribute('aria-expanded', String(!expanded));
  });

  document.addEventListener('click', () => {
    addMenu.classList.add('hidden');
    addBtn.setAttribute('aria-expanded', 'false');
  });

  addMenu.addEventListener('click', async (e) => {
    const type = e.target.closest('[data-type]')?.dataset.type;
    if (!type) return;
    addMenu.classList.add('hidden');
    addBtn.setAttribute('aria-expanded', 'false');
    await addEntry(type);
  });
}

async function addEntry(type) {
  const typeNames = {
    'work-experience':       'Work Experience',
    'technical-projects':    'Technical Projects',
    'clubs-and-organization':'Clubs and Organization',
    'education':             'Education',
    'skills':                'Skills'
  };

  let section = resumeData.sections.find(s => s.type === type);
  if (!section) {
    const order_index = resumeData.sections.length;
    section = await api.createSection({ name: typeNames[type], type, order_index });
    section.entries = [];
    resumeData.sections.push(section);
  }

  const order_index = section.entries.length;
  const entry = await api.createEntry({ section_id: section.id, order_index });
  entry.bullets = [];
  section.entries.push(entry);

  renderCanvas();

  const newCell = document.querySelector(`[data-entry-id="${entry.id}"]`);
  if (newCell) {
    activeCell = newCell;
    swapToEdit(newCell);
    injectToolbar(newCell);
    newCell.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function wireSettingsPanel() {
  const settingsBtn   = document.getElementById('settings-btn');
  const settingsPanel = document.getElementById('settings-panel');
  const saveKeyBtn    = document.getElementById('save-key-btn');
  const apiKeyInput   = document.getElementById('api-key-input');

  settingsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const hidden = settingsPanel.classList.toggle('hidden');
    settingsBtn.setAttribute('aria-expanded', String(!hidden));
  });

  document.addEventListener('click', (e) => {
    if (!settingsPanel.contains(e.target) && e.target !== settingsBtn) {
      settingsPanel.classList.add('hidden');
      settingsBtn.setAttribute('aria-expanded', 'false');
    }
  });

  // Show masked key hint if one exists
  api.getConfig('gemini_key')
    .then(({ value }) => {
      if (value) apiKeyInput.placeholder = `Key set (ends in …${value.slice(-4)})`;
    })
    .catch(() => {});

  saveKeyBtn.addEventListener('click', async () => {
    const key = apiKeyInput.value.trim();
    if (!key) return;
    await api.setConfig('gemini_key', key);
    apiKeyInput.value = '';
    apiKeyInput.placeholder = `Key saved ✓ (ends in …${key.slice(-4)})`;
    settingsPanel.classList.add('hidden');
  });
}

function wirePrintButton() {
  document.getElementById('print-btn')?.addEventListener('click', () => {
    if (activeCell) {
      saveCell(activeCell).then(() => {
        swapToView(activeCell);
        removeToolbar();
        activeCell = null;
        window.print();
      });
    } else {
      window.print();
    }
  });
}

function wireThankYouModal() {
  const thanksBtn   = document.getElementById('thanks-btn');
  const thanksModal = document.getElementById('thanks-modal');
  const closeBtn    = document.getElementById('close-thanks');

  thanksBtn.addEventListener('click', () => {
    thanksModal.classList.remove('hidden');
    closeBtn.focus();
  });
  closeBtn.addEventListener('click', () => {
    thanksModal.classList.add('hidden');
    thanksBtn.focus();
  });
  thanksModal.addEventListener('click', (e) => {
    if (e.target === thanksModal) thanksModal.classList.add('hidden');
  });
}

document.addEventListener('DOMContentLoaded', init);
