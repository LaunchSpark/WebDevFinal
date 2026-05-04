// AI-generated: view/edit templates for education entries
export class EducationCell {
  constructor(data) { this.data = data; }

  renderView() {
    return `
      <div class="cell-view" role="article" aria-label="Education: ${escHtml(this.data.title || 'untitled')}">
        <div class="flex justify-between items-baseline">
          <h3 class="entry-title font-bold text-gray-900">${escHtml(this.data.title || '')}</h3>
          <span class="text-sm text-gray-600">${escHtml(this.data.date || '')}</span>
        </div>
        <p class="text-gray-700 italic text-sm">${escHtml(this.data.subtitle || '')}</p>
        ${this.data.extra ? `<p class="text-gray-600 text-sm">GPA: ${escHtml(this.data.extra)}</p>` : ''}
      </div>`;
  }

  renderEdit() {
    return `
      <div class="cell-edit space-y-2" data-entry-id="${this.data.id}" data-section-type="education">
        <div class="flex items-center gap-2 mb-1">
          <input type="checkbox" id="esel-${this.data.id}" name="is_selected" class="entry-select"
            ${this.data.is_selected ? 'checked' : ''} aria-label="Include this entry in resume">
          <label for="esel-${this.data.id}" class="text-xs text-gray-500">Include in resume</label>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label for="title-${this.data.id}" class="text-xs font-medium text-gray-600">Institution</label>
            <input id="title-${this.data.id}" type="text" name="title" value="${escAttr(this.data.title || '')}"
              class="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              aria-label="Institution name">
          </div>
          <div>
            <label for="date-${this.data.id}" class="text-xs font-medium text-gray-600">Graduation Year</label>
            <input id="date-${this.data.id}" type="text" name="date" value="${escAttr(this.data.date || '')}"
              class="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              aria-label="Graduation year">
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label for="subtitle-${this.data.id}" class="text-xs font-medium text-gray-600">Degree</label>
            <input id="subtitle-${this.data.id}" type="text" name="subtitle" value="${escAttr(this.data.subtitle || '')}"
              class="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              aria-label="Degree name">
          </div>
          <div>
            <label for="extra-${this.data.id}" class="text-xs font-medium text-gray-600">GPA (optional)</label>
            <input id="extra-${this.data.id}" type="text" name="extra" value="${escAttr(this.data.extra || '')}"
              class="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              aria-label="GPA">
          </div>
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
