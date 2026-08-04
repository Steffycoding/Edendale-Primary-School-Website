const fs = require('fs');

const cssPath = 'Edendale-Primary-School-main/edendale/src/main/webapp/css/style.css';
let css = fs.readFileSync(cssPath, 'utf8');

css = css.replace(/  \.nav-links\.show \+ \.mobile-menu-btn {\n    color: var\(--navy\);\n  }/, `  .nav-links.show + .mobile-menu-btn {
    color: var(--navy);
    background: transparent;
    border-color: transparent;
  }`);

fs.writeFileSync(cssPath, css);
console.log("Fixed button colors");
