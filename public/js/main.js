/**
 * main.js — General Site JavaScript
 * Edendale Primary School Website
 *
 * Responsibilities:
 *  - Page-level UI interactions (smooth scroll, active nav)
 *  - Fetch dynamic content from Node.js Express backend via fetch API
 */

'use strict';

/* ══════════════════════════════════════════
   1. AUTO-SET ACTIVE NAV LINK
   ══════════════════════════════════════════ */
(function setActiveNav() {
  const links = document.querySelectorAll('.nav-links a');
  const currentPath = window.location.pathname.split('/').pop();
  links.forEach(link => {
    const href = link.getAttribute('href').split('/').pop();
    if (href === currentPath) {
      link.classList.add('active');
    }
  });
})();

/* ══════════════════════════════════════════
   2. FOOTER YEAR
   ══════════════════════════════════════════ */
const yearEl = document.getElementById('footer-year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ══════════════════════════════════════════
   3. SMOOTH SCROLL FOR ANCHOR LINKS
   ══════════════════════════════════════════ */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

/* ══════════════════════════════════════════
   4. DYNAMIC CONTENT LOADER
   Fetches page content from Node.js Express API.
   ══════════════════════════════════════════ */

/**
 * Fetch content for a specific page from the backend.
 * @param {string} page - Page identifier (e.g. 'home', 'grades', 'events')
 */
async function loadPageContent(page) {
  try {
    const response = await fetch(`/api/content?page=${page}`, { credentials: 'include' });
    if (!response.ok) throw new Error('Failed to fetch content');
    const data = await response.json();
    localStorage.setItem(`initialContent_${page}`, JSON.stringify(data));
    applyContent(data);
    snapshotInitialState(page);
  } catch (err) {
    // Silently fail — static skeleton content remains visible
    console.warn('[Content] Could not load dynamic content:', err.message);
    snapshotInitialState(page);
  }
}

/**
 * Apply fetched content to [data-field] elements.
 * @param {Object} contentMap - { fieldName: value }
 */
function applyContent(contentMap) {
  Object.entries(contentMap).forEach(([field, value]) => {
    const el = document.querySelector(`[data-field="${field}"]`);
    if (!el) return;
    if (el.dataset.type === 'image') {
      el.src = value;
    } else if (el.dataset.type === 'link') {
      el.href = value;
    } else if (el.dataset.type === 'bg') {
      el.style.backgroundImage = `url(${value})`;
    } else if (el.dataset.type === 'link_text') {
      // custom logic for link texts if needed, but else if fine.
      } else {
      el.innerHTML = value;
    }
  });
}

// Determine current page from URL and fetch content
let currentPage = window.location.pathname.split('/').pop().replace('.html', '');
if (!currentPage || currentPage === 'index') currentPage = 'home';
loadPageContent(currentPage);

/* ══════════════════════════════════════════
   5. MOBILE MENU TOGGLE
   ══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
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
        
        overlay.classList.add('show');
        mobileMenuBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
      } else {
        
        overlay.classList.remove('show');
        mobileMenuBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>';
      }
    });
    
    // Close menu when clicking outside overlay
    overlay.addEventListener('click', () => {
      navLinks.classList.remove('show');
      overlay.classList.remove('show');
      
      mobileMenuBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>';
    });
  }
});


function snapshotInitialState(page) {
  const state = {};
  document.querySelectorAll('[data-editable]').forEach(el => {
    const field = el.dataset.field;
    if (!field) return;
    if (el.dataset.type === 'image') {
      state[field] = el.getAttribute('src');
    } else if (el.dataset.type === 'link') {
      state[field] = el.getAttribute('href');
    } else {
      state[field] = el.innerHTML;
    }
  });
  localStorage.setItem(`initialContent_${page}`, JSON.stringify(state));
}
