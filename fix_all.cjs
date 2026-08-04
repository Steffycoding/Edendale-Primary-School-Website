const fs = require('fs');
const glob = require('glob');

const modalHtml = `<div id="admin-login-modal">
  <div class="admin-modal-box">
    <button id="admin-close-btn" aria-label="Close Admin Login">&times;</button>
    <h2>Admin Login</h2>
    <input type="text" id="admin-username" placeholder="Username">
    <input type="password" id="admin-password" placeholder="Password">
    <button class="btn btn-primary" id="admin-login-btn">Login</button>
    <p id="admin-login-error" style="color:#ff6b6b; margin-top:10px; font-size:0.85rem;"></p>
  </div>
</div>
<!-- ══════════════════════════════════
     ADMIN EDIT BAR (bottom)
     ══════════════════════════════════ -->
<div id="admin-bar">
  <span>✏ Admin Edit Mode Active</span>
  <div class="admin-bar-actions">
    <button id="admin-save-btn">Save All Changes</button>
    <button id="admin-logout-btn">Logout</button>
  </div>
</div>
<!-- ══════════════════════════════════
     INLINE EDIT POPUP
     ══════════════════════════════════ -->
<div id="edit-popup">
  <h4>Edit Content</h4>
  <textarea id="edit-popup-text" rows="4"></textarea>
  <div id="edit-popup-image-row" style="display:none;">
    <input type="url" id="edit-popup-image-url" placeholder="Paste image URL or upload path">
  </div>
  <div class="popup-actions">
    <button class="btn btn-primary" id="edit-popup-save">Save</button>
    <button class="btn btn-outline" id="edit-popup-cancel">Cancel</button>
  </div>
</div>
`;

const files = glob.sync('Edendale-Primary-School-main/edendale/src/main/webapp/**/*.html');

files.forEach(file => {
  let html = fs.readFileSync(file, 'utf8');
  
  // 1. Ensure modal is in all files (except _nav.html)
  if (!file.includes('_nav.html')) {
    if (!html.includes('id="admin-login-modal"')) {
      html = html.replace('<!-- Scripts -->', modalHtml + '\n  <!-- Scripts -->');
    }
  }

  // 2. Fix order of admin-toggle-btn.
  // Move it BEFORE <ul class="nav-links">
  const adminBtnRegex = /<button id="admin-toggle-btn" title="Admin">[\s\S]*?<\/button>\s*/;
  const match = html.match(adminBtnRegex);
  
  if (match) {
      // Remove it from its current position
      html = html.replace(adminBtnRegex, '');
      
      // Insert it BEFORE <ul class="nav-links">
      if (html.includes('<ul class="nav-links">')) {
          html = html.replace('<ul class="nav-links">', match[0] + '<ul class="nav-links">');
      }
  }

  fs.writeFileSync(file, html);
});

console.log("Fixed HTML files");
