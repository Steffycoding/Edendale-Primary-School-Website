const fs = require('fs');

let css = fs.readFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/css/admin.css', 'utf8');

css = css.replace(/#admin-toggle-btn {[\s\S]*?}/,
`#admin-toggle-btn {
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
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}`);

// Remove the desktop override if it exists
css = css.replace(/@media \(min-width: 769px\) {\s*#admin-toggle-btn {\s*order: 3;\s*margin-left: 20px;\s*}\s*}/, '');

fs.writeFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/css/admin.css', css);
console.log("Fixed admin btn css");
