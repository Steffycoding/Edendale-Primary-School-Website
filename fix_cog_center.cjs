const fs = require('fs');

let css = fs.readFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/css/admin.css', 'utf8');

css = css.replace(/transform: translateX\(-50\%\);/, 'top: 50%;\n  transform: translate(-50%, -50%);');

fs.writeFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/css/admin.css', css);
console.log("Fixed cog vertical centering");
