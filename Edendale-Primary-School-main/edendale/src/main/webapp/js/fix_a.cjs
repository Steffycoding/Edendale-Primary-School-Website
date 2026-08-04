const fs = require('fs');

const cssPath = 'Edendale-Primary-School-main/edendale/src/main/webapp/css/style.css';
let css = fs.readFileSync(cssPath, 'utf8');

css = css.replace(/  \.nav-links a {\n    color: var\(--text-dark\);\n    font-size: 1\.1rem;\n    padding: 12px 0;\n    border-bottom: 1px solid #eaeaea;\n    width: 100%;\n  }/, `  .nav-links a {
    display: block;
    color: var(--text-dark);
    font-size: 1.1rem;
    padding: 12px 0;
    border-bottom: 1px solid #eaeaea;
    width: 100%;
  }`);

fs.writeFileSync(cssPath, css);
console.log("Fixed A tags");
