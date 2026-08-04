const fs = require('fs');
const glob = require('glob');

const files = glob.sync('Edendale-Primary-School-main/edendale/src/main/webapp/**/*.html');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('id="edit-popup"')) {
    if (!content.includes('edit-popup-link-row')) {
      content = content.replace(
        /<div id="edit-popup-image-row" style="display:none;">\s*<input type="url" id="edit-popup-image-url" placeholder="Paste image URL or upload path">\s*<\/div>/,
        '<div id="edit-popup-image-row" style="display:none;">\n      <input type="url" id="edit-popup-image-url" placeholder="Paste image URL or upload path">\n    </div>\n    <div id="edit-popup-link-row" style="display:none;">\n      <input type="url" id="edit-popup-link-url" placeholder="Paste destination link URL">\n    </div>'
      );
      fs.writeFileSync(file, content);
    }
  }
});
console.log("Updated popups");
