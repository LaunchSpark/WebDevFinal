// AI-generated: view/edit templates for work experience entries
export class ExperienceCell {
  constructor(data) { this.data = data; }

  renderView() {
    const bullets = (this.data.bullets || [])
      .filter(b => b.is_selected)
      .map(b => `<li style="font-size:11pt; line-height:1.2; margin-left:1.2em">${escHtml(b.text)}</li>`)
      .join('');
    return `
      <div class="cell-view" role="article" aria-label="Work experience: ${escHtml(this.data.title || 'untitled')}">
        <div class="flex justify-between items-baseline">
          <span class="text-gray-900" style="font-size:11pt">${escHtml(this.data.date || '')}</span>
          <h3 class="entry-title font-bold text-gray-900" style="font-size:12pt">${escHtml(this.data.title || '')}</h3>
        </div>
        <p class="font-bold text-gray-900" style="font-size:11pt; line-height:1.2">${escHtml(this.data.subtitle || '')}</p>
        ${bullets ? `<ul class="list-none text-gray-900" style="margin-top:2pt">${bullets}</ul>` : ''}
      </div>`;
  }

  renderEdit() {
    const bullets = (this.data.bullets || []).map((b, i) => `
      <div class="bullet-row flex gap-2 items-center" data-bullet-id="${b.id}">
        <input type="checkbox" id="bsel-${b.id}" class="bullet-select shrink-0"
          ${b.is_selected ? 'checked' : ''} aria-label="Include bullet ${i + 1} in resume">
        <input type="text" value="${escAttr(b.text)}" class="bullet-text flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
          aria-label="Bullet point ${i + 1}">
        <button class="bullet-refine text-blue-500 text-xs hover:text-blue-700 shrink-0"
          aria-label="Refine bullet ${i + 1} with AI">✦ AI</button>
        <button class="bullet-delete text-red-400 text-xs hover:text-red-600 shrink-0"
          aria-label="Delete bullet ${i + 1}">✕</button>
      </div>`).join('');
    return `
      <div class="cell-edit space-y-2" data-entry-id="${this.data.id}" data-section-type="experience">
        <div class="flex items-center gap-2 mb-1">
          <input type="checkbox" id="esel-${this.data.id}" name="is_selected" class="entry-select"
            ${this.data.is_selected ? 'checked' : ''} aria-label="Include this entry in resume">
          <label for="esel-${this.data.id}" class="text-xs text-gray-500">Include in resume</label>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label for="title-${this.data.id}" class="text-xs font-medium text-gray-600">Company</label>
            <input id="title-${this.data.id}" type="text" name="title" value="${escAttr(this.data.title || '')}"
              class="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              aria-label="Company name">
          </div>
          <div>
            <label for="date-${this.data.id}" class="text-xs font-medium text-gray-600">Date Range</label>
            <input id="date-${this.data.id}" type="text" name="date" value="${escAttr(this.data.date || '')}"
              class="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              aria-label="Employment date range">
          </div>
        </div>
        <div>
          <label for="subtitle-${this.data.id}" class="text-xs font-medium text-gray-600">Role / Title</label>
          <input id="subtitle-${this.data.id}" type="text" name="subtitle" value="${escAttr(this.data.subtitle || '')}"
            class="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            aria-label="Job title">
        </div>
        <div class="space-y-1">
          <p class="text-xs font-medium text-gray-600">Bullet Points</p>
          <div class="bullets-container space-y-1">${bullets}</div>
          <button class="bullet-add text-xs text-blue-600 hover:text-blue-800 mt-1"
            aria-label="Add bullet point">+ Add bullet</button>
        </div>
      </div>`;
  }
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function escAttr(str) {
  return String(str).replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
