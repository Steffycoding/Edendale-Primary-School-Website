const fs = require('fs');
const path = 'Edendale-Primary-School-main/edendale/src/main/webapp/css/style.css';
let css = fs.readFileSync(path, 'utf8');

css = css.replace(/  \.nav-links a {\n    display: block;\n    color: var\(--text-dark\);\n/g, '  .nav-links a {\n    display: block;\n    color: var(--text-dark) !important;\n');
fs.writeFileSync(path, css);
console.log("Fixed mobile link color !important");
