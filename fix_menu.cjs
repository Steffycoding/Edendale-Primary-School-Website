const fs = require('fs');

// Fix JS
const jsPath = 'Edendale-Primary-School-main/edendale/src/main/webapp/js/main.js';
let js = fs.readFileSync(jsPath, 'utf8');

const oldJs = `document.addEventListener('DOMContentLoaded', () => {
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');
  
  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navLinks.classList.toggle('show');
      if (navLinks.classList.contains('show')) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!navLinks.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
        navLinks.classList.remove('show');
        document.body.style.overflow = '';
      }
    });
  }
});`;

const newJs = `document.addEventListener('DOMContentLoaded', () => {
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');
  
  if (mobileMenuBtn && navLinks) {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'mobile-menu-overlay';
    document.body.appendChild(overlay);

    mobileMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navLinks.classList.toggle('show');
      
      if (navLinks.classList.contains('show')) {
        document.body.style.overflow = 'hidden';
        overlay.classList.add('show');
      } else {
        document.body.style.overflow = '';
        overlay.classList.remove('show');
      }
    });
    
    // Close menu when clicking outside overlay
    overlay.addEventListener('click', () => {
      navLinks.classList.remove('show');
      overlay.classList.remove('show');
      document.body.style.overflow = '';
    });
  }
});`;

if (js.includes(oldJs)) {
  js = js.replace(oldJs, newJs);
  fs.writeFileSync(jsPath, js);
  console.log("Updated main.js");
} else {
  console.log("Could not find old JS to replace");
}

// Fix CSS
const cssPath = 'Edendale-Primary-School-main/edendale/src/main/webapp/css/style.css';
let css = fs.readFileSync(cssPath, 'utf8');

if (!css.includes('.mobile-menu-overlay')) {
  const overlayCss = `
.mobile-menu-overlay {
  display: none;
}
@media (max-width: 768px) {
  .mobile-menu-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0,0,0,0.5);
    z-index: 999;
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }
  .mobile-menu-overlay.show {
    display: block;
    opacity: 1;
    pointer-events: auto;
  }
}
`;
  css += overlayCss;
  fs.writeFileSync(cssPath, css);
  console.log("Added overlay to style.css");
}

