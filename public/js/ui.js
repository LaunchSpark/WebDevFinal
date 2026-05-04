// AI-generated: DOM rendering layer — reads resumeData, writes to #page-canvas
import { resumeData } from './state.js';
import { CellFactory } from './cells/CellFactory.js';

export function renderCanvas() {
  const canvas = document.getElementById('page-canvas');
  canvas.innerHTML = '';

  if (!resumeData.sections.length) {
    canvas.innerHTML = '<p class="text-gray-400 text-sm text-center mt-4">Click "Add Section" to get started.</p>';
    return;
  }

  for (const section of resumeData.sections) {
    if (!section.is_visible) continue;

    const sectionEl = document.createElement('section');
    sectionEl.className = 'resume-section mb-5';
    sectionEl.dataset.sectionId = section.id;
    sectionEl.dataset.sectionType = section.type;
    sectionEl.setAttribute('aria-label', section.name);

    const heading = document.createElement('h2');
    heading.className = 'section-heading font-bold border-b border-gray-800 pb-0.5 mb-2 text-gray-900';
    heading.style.fontSize = '13pt';
    heading.setAttribute('role', 'heading');
    heading.setAttribute('aria-level', '2');
    heading.textContent = section.name;
    sectionEl.appendChild(heading);

    for (const entry of section.entries || []) {
      const cellWrapper = document.createElement('div');
      cellWrapper.className = 'cell-wrapper relative mb-2 px-2 py-1 rounded cursor-pointer hover:outline hover:outline-1 hover:outline-blue-200';
      cellWrapper.dataset.entryId = entry.id;
      cellWrapper.dataset.sectionType = section.type;

      if (!entry.is_selected) {
        cellWrapper.classList.add('entry-deselected', 'opacity-50');
      }

      const cell = CellFactory.create(section.type, entry);
      cellWrapper.innerHTML = cell.renderView();
      sectionEl.appendChild(cellWrapper);
    }

    canvas.appendChild(sectionEl);
  }
}

export function swapToEdit(cellWrapper) {
  const entryId = parseInt(cellWrapper.dataset.entryId);
  const type = cellWrapper.dataset.sectionType;
  const entry = findEntry(type, entryId);
  if (!entry) return;

  const cell = CellFactory.create(type, entry);
  cellWrapper.innerHTML = cell.renderEdit();
  cellWrapper.classList.add('ring-2', 'ring-blue-400', 'bg-blue-50');
  cellWrapper.querySelector('input:not([type="checkbox"]), textarea')?.focus();
}

export function swapToView(cellWrapper) {
  const entryId = parseInt(cellWrapper.dataset.entryId);
  const type = cellWrapper.dataset.sectionType;
  const entry = findEntry(type, entryId);
  if (!entry) return;

  const cell = CellFactory.create(type, entry);
  cellWrapper.innerHTML = cell.renderView();
  cellWrapper.classList.remove('ring-2', 'ring-blue-400', 'bg-blue-50');

  if (!entry.is_selected) {
    cellWrapper.classList.add('entry-deselected', 'opacity-50');
  } else {
    cellWrapper.classList.remove('entry-deselected', 'opacity-50');
  }
}

export function injectToolbar(cellWrapper) {
  removeToolbar();
  const toolbar = document.createElement('div');
  toolbar.id = 'cell-toolbar';
  toolbar.className = 'no-print absolute -left-24 top-0 flex flex-col gap-1 bg-white border border-gray-200 rounded-lg shadow-lg p-1.5 z-10';
  toolbar.setAttribute('role', 'toolbar');
  toolbar.setAttribute('aria-label', 'Entry actions');
  toolbar.innerHTML = `
    <button class="toolbar-btn px-2 py-1 text-xs hover:bg-gray-100 rounded" data-action="move-up" aria-label="Move entry up">↑ Up</button>
    <button class="toolbar-btn px-2 py-1 text-xs hover:bg-gray-100 rounded" data-action="move-down" aria-label="Move entry down">↓ Down</button>
    <button class="toolbar-btn px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded" data-action="delete" aria-label="Delete entry">🗑 Del</button>
    <button class="toolbar-btn px-2 py-1 text-xs text-blue-500 hover:bg-blue-50 rounded" data-action="ai-refine" aria-label="Refine with AI">✦ AI</button>
  `;
  cellWrapper.appendChild(toolbar);
}

export function removeToolbar() {
  document.getElementById('cell-toolbar')?.remove();
}

function findEntry(type, entryId) {
  const section = resumeData.sections.find(s => s.type === type);
  return section?.entries.find(e => e.id === entryId);
}
