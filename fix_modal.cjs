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
<div id="admin-bar">
  <span>✏ Admin Edit Mode Active</span>
  <div class="admin-bar-actions">
    <button id="admin-save-btn">Save All Changes</button>
    <button id="admin-logout-btn">Logout</button>
  </div>
</div>
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
  
  if (!file.includes('_nav.html')) {
    if (!html.includes('id="admin-login-modal"')) {
      // Find the first script tag to insert before
      const scriptIndex = html.indexOf('<script>');
      if (scriptIndex !== -1) {
          html = html.substring(0, scriptIndex) + modalHtml + html.substring(scriptIndex);
      } else {
          html = html.replace('</body>', modalHtml + '</body>');
      }
      fs.writeFileSync(file, html);
    }
  }
});

console.log("Fixed HTML modals");
