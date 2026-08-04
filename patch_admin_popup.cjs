const fs = require('fs');

let css = fs.readFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/css/admin.css', 'utf8');

css = css.replace(/background: var\(--white\);/,
`background: linear-gradient(135deg, var(--white) 0%, #e6f0fa 100%);`);

fs.writeFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/css/admin.css', css);
console.log("Patched admin popup");
