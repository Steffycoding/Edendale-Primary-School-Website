const fs = require('fs');
const path = 'Edendale-Primary-School-main/edendale/src/main/webapp/css/global.css';
let css = fs.readFileSync(path, 'utf8');

css = css.replace(/body {\n  background: var\(--light-bg\);\n  color: var\(--text-dark\) !important;\n/g, 'body {\n  background: var(--light-bg);\n  color: var(--text-dark);\n');
fs.writeFileSync(path, css);
console.log("Fixed body color !important");
