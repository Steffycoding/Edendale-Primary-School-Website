const fs = require('fs');
let css = fs.readFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/css/admin.css', 'utf8');

css = css.replace(/opacity: 1;/g, 'opacity: 0;');
css = css.replace(/#admin-toggle-btn:hover \{\n  opacity: 0\.6;\n\}/, '#admin-toggle-btn:hover {\n  opacity: 1;\n}');

css = css.replace(/#admin-toggle-btn svg \{\n  width: 100%;\n  height: 100%;\n  fill: var\(--navy\);\n\}/, '#admin-toggle-btn svg {\n  width: 100%;\n  height: 100%;\n  fill: var(--gold);\n}');

fs.writeFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/css/admin.css', css);
console.log("Patched admin CSS");
