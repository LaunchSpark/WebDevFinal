// AI-generated: view/edit templates for skills category entries
export class SkillCell {
  constructor(data) { this.data = data; }

  renderView() {
    return `
      <div class="cell-view" role="article" aria-label="Skills: ${escHtml(this.data.title || 'category')}">
        <span class="font-semibold text-gray-900">${escHtml(this.data.title || '')}: </span>
        <span class="text-gray-800 text-sm">${escHtml(this.data.extra || '')}</span>
      </div>`;
  }

  renderEdit() {
    return `
      <div class="cell-edit space-y-2" data-entry-id="${this.data.id}" data-section-type="skills">
        <div class="flex items-center gap-2 mb-1">
          <input type="checkbox" id="esel-${this.data.id}" name="is_selected" class="entry-select"
            ${this.data.is_selected ? 'checked' : ''} aria-label="Include this entry in resume">
          <label for="esel-${this.data.id}" class="text-xs text-gray-500">Include in resume</label>
        </div>
        <div>
          <label for="title-${this.data.id}" class="text-xs font-medium text-gray-600">Category Name</label>
          <input id="title-${this.data.id}" type="text" name="title" value="${escAttr(this.data.title || '')}"
            class="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            aria-label="Skill category name (e.g. Languages, Frameworks)">
        </div>
        <div>
          <label for="extra-${this.data.id}" class="text-xs font-medium text-gray-600">Skills (comma-separated)</label>
          <textarea id="extra-${this.data.id}" name="extra" rows="2"
            class="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none"
            aria-label="Comma-separated skill list">${escHtml(this.data.extra || '')}</textarea>
          <button class="skill-refine text-xs text-blue-600 hover:text-blue-800 mt-1"
            aria-label="Get AI skill suggestions">✦ AI Suggestions</button>
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
