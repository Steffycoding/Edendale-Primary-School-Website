const fs = require('fs');
let file = 'Edendale-Primary-School-main/edendale/src/main/webapp/css/global.css';
let css = fs.readFileSync(file, 'utf8');
css = css.replace(/\.admissions-cta \{\n  margin-top: 48px;\n  padding: 32px;\n  background: white;\n  border-radius: 18px;\n  text-align: center;\n\}/g,
`.admissions-cta {
  margin-top: 48px;
  padding: 32px;
  background: linear-gradient(135deg, var(--white) 0%, #e6f0fa 100%);
  border: 2px solid var(--gold);
  border-radius: 18px;
  text-align: center;
  box-shadow: var(--shadow);
}`);
fs.writeFileSync(file, css);
console.log("Patched admissions cta");
