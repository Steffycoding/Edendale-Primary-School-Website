const fs = require('fs');
const path = 'Edendale-Primary-School-main/edendale/src/main/webapp/css/style.css';
let css = fs.readFileSync(path, 'utf8');

css = css.replace(/@media \(max-width: 768px\) {\n  \.mobile-menu-btn {\n    position: absolute;\n    top: 50%;\n    transform: translateY\(-50%\);\n    right: 16px;/, `@media (max-width: 768px) {
  .mobile-menu-btn {
    position: static;
    transform: none;
    margin: 0;`);

fs.writeFileSync(path, css);
console.log("Fixed burger CSS");
