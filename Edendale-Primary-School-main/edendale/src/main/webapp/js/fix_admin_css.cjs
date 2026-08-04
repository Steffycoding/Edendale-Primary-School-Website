const fs = require('fs');
const path = 'Edendale-Primary-School-main/edendale/src/main/webapp/css/admin.css';
let css = fs.readFileSync(path, 'utf8');

css = css.replace(/#admin-toggle-btn {[\s\S]*?}/, `#admin-toggle-btn {
  width: 28px;
  height: 28px;
  background: transparent;
  border: none;
  cursor: pointer;
  opacity: 1;
  transition: opacity 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}`);

fs.writeFileSync(path, css);
console.log("Updated admin-toggle-btn CSS");
