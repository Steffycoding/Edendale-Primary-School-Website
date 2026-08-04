const fs = require('fs');
const path = 'Edendale-Primary-School-main/edendale/src/main/webapp/css/style.css';
let css = fs.readFileSync(path, 'utf8');

if (!css.includes('white-space: nowrap;')) {
    css = css.replace(/\.nav-logo span {[\s\S]*?}/, `.nav-logo span {
  color: white;
  font-weight: bold;
  font-size: 1rem;
  white-space: nowrap;
}`);
    fs.writeFileSync(path, css);
    console.log("Added white-space: nowrap");
}
