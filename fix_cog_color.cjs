const fs = require('fs');

let css = fs.readFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/css/admin.css', 'utf8');

css = css.replace(/#admin-toggle-btn svg \{\n  width: 100%;\n  height: 100%;\n  fill: var\(--gold\);\n\}/, '#admin-toggle-btn svg {\n  width: 100%;\n  height: 100%;\n  fill: var(--navy);\n}');

fs.writeFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/css/admin.css', css);
console.log("Fixed cog color");
