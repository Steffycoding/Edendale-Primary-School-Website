const fs = require('fs');

const cssPath = 'Edendale-Primary-School-main/edendale/src/main/webapp/css/style.css';
let css = fs.readFileSync(cssPath, 'utf8');

const oldCss = `  .nav-links {
    display: none;
    flex-direction: column;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background-color: var(--primary);
    padding: 1rem;
    box-shadow: 0 4px 6px rgba(0,0,0,0.2);
    z-index: 1000;
  }
  .nav-links.show {
    display: flex;
  }`;

const newCss = `  .nav-links {
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0;
    right: -300px;
    width: 280px;
    height: 100vh;
    background-color: white;
    padding: 100px 20px 20px 20px;
    box-shadow: -4px 0 15px rgba(0,0,0,0.1);
    z-index: 1000;
    transition: right 0.3s ease;
    overflow-y: auto;
  }
  .nav-links.show {
    right: 0;
  }
  .nav-links a {
    color: var(--text-dark);
    font-size: 1.1rem;
    padding: 12px 0;
    border-bottom: 1px solid #eaeaea;
    width: 100%;
  }
  .nav-links a.active,
  .nav-links a:hover {
    color: var(--primary);
  }`;

css = css.replace(oldCss, newCss);
fs.writeFileSync(cssPath, css);

const jsPath = 'Edendale-Primary-School-main/edendale/src/main/webapp/js/main.js';
let js = fs.readFileSync(jsPath, 'utf8');

const oldJs = `document.addEventListener('DOMContentLoaded', () => {
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');
  
  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navLinks.classList.toggle('show');
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!navLinks.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
        navLinks.classList.remove('show');
      }
    });
  }
});`;

const newJs = `document.addEventListener('DOMContentLoaded', () => {
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

js = js.replace(oldJs, newJs);
fs.writeFileSync(jsPath, js);
