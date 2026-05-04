// AI-generated: view/edit templates for awards and certifications
export class AwardCell {
  constructor(data) { this.data = data; }

  renderView() {
    return `
      <div class="cell-view" role="article" aria-label="${escHtml(this.data.title || 'Award/Certification')}">
        <div class="flex justify-between items-baseline">
          <h3 class="entry-title font-bold text-gray-900" style="font-size:12pt">${escHtml(this.data.title || '')}</h3>
          <span class="text-gray-900" style="font-size:11pt">${escHtml(this.data.date || '')}</span>
        </div>
        ${this.data.extra ? `<p class="italic text-gray-900" style="font-size:11pt; line-height:1.2">${escHtml(this.data.extra)}</p>` : ''}
      </div>`;
  }

  renderEdit() {
    return `
      <div class="cell-edit space-y-2" data-entry-id="${this.data.id}" data-section-type="awards">
        <div class="flex items-center gap-2 mb-1">
          <input type="checkbox" id="esel-${this.data.id}" name="is_selected" class="entry-select"
            ${this.data.is_selected ? 'checked' : ''} aria-label="Include this entry in resume">
          <label for="esel-${this.data.id}" class="text-xs text-gray-500">Include in resume</label>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label for="title-${this.data.id}" class="text-xs font-medium text-gray-600">Title</label>
            <input id="title-${this.data.id}" type="text" name="title" value="${escAttr(this.data.title || '')}"
              class="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              aria-label="Award or certification title">
          </div>
          <div>
            <label for="date-${this.data.id}" class="text-xs font-medium text-gray-600">Year</label>
            <input id="date-${this.data.id}" type="text" name="date" value="${escAttr(this.data.date || '')}"
              class="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              aria-label="Year received">
          </div>
        </div>
        <div>
          <label for="extra-${this.data.id}" class="text-xs font-medium text-gray-600">Issuer / Details</label>
          <input id="extra-${this.data.id}" type="text" name="extra" value="${escAttr(this.data.extra || '')}"
            class="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            aria-label="Issuer or award details">
          <button class="award-refine text-xs text-blue-600 hover:text-blue-800 mt-1"
            aria-label="Refine description with AI">✦ AI Refine</button>
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
