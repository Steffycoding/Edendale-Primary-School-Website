const fs = require('fs');
const path = require('path');

const dir = 'Edendale-Primary-School-main/edendale/src/main/webapp';

function fixFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  const btnStr = `      <button class="mobile-menu-btn" aria-label="Toggle Navigation">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>`;
  
  // Also remove potential mis-formatted ones (regex search)
  const regex = /\s*<button class="mobile-menu-btn"[\s\S]*?<\/button>/g;
  content = content.replace(regex, '');

  // Now, correctly insert it ONLY after the </ul class="nav-links">
  // if it exists
  const navLinksRegex = /(<ul class="nav-links">[\s\S]*?<\/ul>)/;
  if (content.match(navLinksRegex)) {
    content = content.replace(navLinksRegex, "$1\n" + btnStr);
    fs.writeFileSync(file, content);
  }
}

const files = require('child_process').execSync(`find ${dir} -name "*.html"`).toString().trim().split('\n');
files.forEach(fixFile);
console.log("Fixed HTML files");
