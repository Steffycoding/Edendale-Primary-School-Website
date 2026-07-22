/**
 * main.js — General Site JavaScript
 * Edendale Primary School Website
 *
 * Responsibilities:
 *  - Page-level UI interactions (smooth scroll, active nav)
 *  - TODO: Fetch dynamic content from Java backend via AJAX
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
   Fetches page content from Java Servlet API.
   TODO: Implement once backend is ready.
   ══════════════════════════════════════════ */

/**
 * Fetch content for a specific page from the backend.
 * @param {string} page - Page identifier (e.g. 'home', 'grades', 'events')
 */
async function loadPageContent(page) {
  try {
    // TODO: Update URL to match your Java Servlet mapping
    const response = await fetch(`/api/content?page=${page}`);
    if (!response.ok) throw new Error('Failed to fetch content');
    const data = await response.json();
    applyContent(data);
  } catch (err) {
    // Silently fail — static skeleton content remains visible
    console.warn('[Content] Could not load dynamic content:', err.message);
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
    } else {
      el.innerHTML = value;
    }
  });
}

// TODO: Call loadPageContent with the current page identifier
// Example: loadPageContent('home');
