const fs = require('fs');
const path = 'Edendale-Primary-School-main/edendale/src/main/webapp/css/global.css';
let css = fs.readFileSync(path, 'utf8');

css = css.replace(/  \.nav-links {\s+display: none;\s+\.hero-title {/g, '  .hero-title {');

fs.writeFileSync(path, css);
console.log("Fixed global.css properly");
