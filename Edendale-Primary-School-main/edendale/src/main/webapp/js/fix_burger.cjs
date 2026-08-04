const fs = require('fs');
const path = 'Edendale-Primary-School-main/edendale/src/main/webapp/css/style.css';
let css = fs.readFileSync(path, 'utf8');

css = css.replace(/\.mobile-menu-btn {\n    position: absolute;\n    top: 66px;\n    right: 16px;\n    background: var\(--navy\);\n    border: 1px solid var\(--gold\);\n    padding: 6px;\n    border-radius: 4px;\n    z-index: 1001;\n    display: block;\n  }\n  \.navbar {\n    min-height: 110px;\n  }/, `.mobile-menu-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    right: 16px;
    background: var(--navy);
    border: 1px solid var(--gold);
    padding: 6px;
    border-radius: 4px;
    z-index: 1001;
    display: block;
  }
  .navbar {
    min-height: unset;
  }`);

fs.writeFileSync(path, css);
console.log("Fixed burger vertically centered");
