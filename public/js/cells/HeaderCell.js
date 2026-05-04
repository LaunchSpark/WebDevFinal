// AI-generated: view/edit templates for sticky resume header fields
export class HeaderCell {
  constructor(data) { this.data = data; }

  renderView() {
    const contactItems = [
      this.data.phone,
      this.data.email,
      this.data.link,
      this.data.address
    ].filter(Boolean);

    return `
      <div class="cell-view" role="banner" aria-label="Resume header">
        <h1 class="font-bold text-gray-900 text-center" style="font-size:22pt; line-height:1.05">
          ${escHtml(this.data.name || 'Your Name')}
        </h1>
        ${contactItems.length ? `
          <p class="text-gray-900 text-center" style="font-size:11pt; line-height:1.25; margin-top:6pt">
            ${contactItems.map(escHtml).join(' • ')}
          </p>
        ` : `
          <p class="text-gray-500 text-center" style="font-size:10pt; line-height:1.2; margin-top:6pt">
            Add your phone, email, link, and address.
          </p>
        `}
      </div>`;
  }

  renderEdit() {
    return `
      <div class="cell-edit space-y-3" data-section-type="header">
        <div>
          <label for="header-name" class="text-xs font-medium text-gray-600">Name</label>
          <input id="header-name" type="text" name="name" value="${escAttr(this.data.name || '')}"
            class="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            aria-label="Full name">
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label for="header-phone" class="text-xs font-medium text-gray-600">Phone</label>
            <input id="header-phone" type="text" name="phone" value="${escAttr(this.data.phone || '')}"
              class="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              aria-label="Phone number">
          </div>
          <div>
            <label for="header-email" class="text-xs font-medium text-gray-600">Email</label>
            <input id="header-email" type="email" name="email" value="${escAttr(this.data.email || '')}"
              class="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              aria-label="Email address">
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label for="header-link" class="text-xs font-medium text-gray-600">Link</label>
            <input id="header-link" type="text" name="link" value="${escAttr(this.data.link || '')}"
              class="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              aria-label="Portfolio or profile link">
          </div>
          <div>
            <label for="header-address" class="text-xs font-medium text-gray-600">Address</label>
            <input id="header-address" type="text" name="address" value="${escAttr(this.data.address || '')}"
              class="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              aria-label="Address">
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
