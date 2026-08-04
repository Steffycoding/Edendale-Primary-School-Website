const fs = require('fs');

const jsPath = 'Edendale-Primary-School-main/edendale/src/main/webapp/js/main.js';
let js = fs.readFileSync(jsPath, 'utf8');

const oldClose = `    overlay.addEventListener('click', () => {
      navLinks.classList.remove('show');
      overlay.classList.remove('show');
      document.body.classList.remove('no-scroll');
    });`;

const newClose = `    overlay.addEventListener('click', () => {
      navLinks.classList.remove('show');
      overlay.classList.remove('show');
      document.body.classList.remove('no-scroll');
      mobileMenuBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>';
    });`;

if (js.includes(oldClose)) {
  js = js.replace(oldClose, newClose);
  fs.writeFileSync(jsPath, js);
  console.log("Updated close listener");
} else {
  console.log("Could not find close listener");
}
