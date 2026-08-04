const fs = require('fs');

let css = fs.readFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/css/style.css', 'utf8');

css = css.replace(/\.stats-grid \{\n    grid-template-columns: 1fr;\n  \}/, `.stats-grid, .why-grid {\n    grid-template-columns: 1fr;\n  }\n  .why-grid {\n    justify-items: center;\n  }`);

fs.writeFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/css/style.css', css);
console.log("Fixed tablet grid in style.css");
