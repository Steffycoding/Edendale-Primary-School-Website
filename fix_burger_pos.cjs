const fs = require('fs');
const path = 'Edendale-Primary-School-main/edendale/src/main/webapp/css/style.css';
let css = fs.readFileSync(path, 'utf8');

css = css.replace(/  \.nav-links\.show \+ \.mobile-menu-btn {\n    color: var\(--navy\);\n    background: transparent;\n    border-color: transparent;\n  }/, `  .nav-links.show + .mobile-menu-btn {
    color: var(--navy);
    background: transparent;
    border-color: transparent;
    position: fixed;
    top: 20px;
    right: 20px;
  }`);

fs.writeFileSync(path, css);
console.log("Fixed burger pos");
