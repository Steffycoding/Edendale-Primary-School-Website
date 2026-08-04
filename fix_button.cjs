const fs = require('fs');

const cssPath = 'Edendale-Primary-School-main/edendale/src/main/webapp/css/style.css';
let css = fs.readFileSync(cssPath, 'utf8');

// Fix navbar position
css = css.replace(/  \.navbar {\n    position: relative;\n    min-height: 110px;\n    position: relative;\n  }/g, `  .navbar {
    min-height: 110px;
  }`);
  
// Fix button color when banner is open
const buttonCss = `
  .nav-links.show + .mobile-menu-btn {
    color: var(--navy);
  }
`;

if (!css.includes('.nav-links.show + .mobile-menu-btn')) {
  // Insert inside the media query
  css = css.replace(/  \.nav-links\.show {\n    right: 0;\n  }/, `  .nav-links.show {
    right: 0;
  }
  .nav-links.show + .mobile-menu-btn {
    color: var(--navy);
  }`);
}

fs.writeFileSync(cssPath, css);
console.log("Fixed CSS");
