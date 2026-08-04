const fs = require('fs');
const glob = require('glob');

const files = glob.sync('Edendale-Primary-School-main/edendale/src/main/webapp/**/*.html');

files.forEach(file => {
  let html = fs.readFileSync(file, 'utf8');
  
  // Find the admin button
  const adminBtnRegex = /<button id="admin-toggle-btn" title="Admin">[\s\S]*?<\/button>\s*/;
  const match = html.match(adminBtnRegex);
  
  if (match) {
      // Remove it from its current position
      html = html.replace(adminBtnRegex, '');
      
      // Insert it after nav-links, before mobile-menu-btn
      // Let's find <button class="mobile-menu-btn"
      if (html.includes('<button class="mobile-menu-btn"')) {
          html = html.replace('<button class="mobile-menu-btn"', match[0] + '<button class="mobile-menu-btn"');
      }
      
      fs.writeFileSync(file, html);
  }
});
console.log("Fixed HTML order");
