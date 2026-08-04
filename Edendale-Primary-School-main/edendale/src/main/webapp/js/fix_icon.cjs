const fs = require('fs');

const jsPath = 'Edendale-Primary-School-main/edendale/src/main/webapp/js/main.js';
let js = fs.readFileSync(jsPath, 'utf8');

const oldJs = `    mobileMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navLinks.classList.toggle('show');
      
      if (navLinks.classList.contains('show')) {
        document.body.classList.add('no-scroll');
        overlay.classList.add('show');
      } else {
        document.body.classList.remove('no-scroll');
        overlay.classList.remove('show');
      }
    });`;

const newJs = `    mobileMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navLinks.classList.toggle('show');
      
      if (navLinks.classList.contains('show')) {
        document.body.classList.add('no-scroll');
        overlay.classList.add('show');
        mobileMenuBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
      } else {
        document.body.classList.remove('no-scroll');
        overlay.classList.remove('show');
        mobileMenuBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>';
      }
    });`;

if (js.includes(oldJs)) {
  js = js.replace(oldJs, newJs);
  fs.writeFileSync(jsPath, js);
  console.log("Updated main.js with toggle icon");
} else {
  console.log("Could not find JS to replace for icon");
}
