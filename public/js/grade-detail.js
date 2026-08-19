/**
 * grade-detail.js — Per-Grade Content Handling
 * Edendale Primary School Website
 *
 * grade-detail.html serves every grade via ?grade=R … ?grade=7, but its
 * hardcoded markup is Grade R's content. Before this file existed, opening
 * ?grade=7 showed the heading "Grade 7" above Grade R's subtitle, quote,
 * activities and "Ages 5 – 6, Foundation Phase" — contradicting grades.html,
 * which lists Grade 7 as ages 12–13.
 *
 * What this does:
 *   ?grade=R  → leave the page exactly as authored (it IS the Grade R page)
 *   ?grade=N  → hide the Grade R sections immediately, show a "coming soon"
 *               panel, then ask the backend whether that grade has content.
 *               If it does, the real content is applied and the sections
 *               come back. If it doesn't, the honest placeholder stays.
 *
 * Runs at parse time (script sits at the end of <body>, so the markup above
 * it already exists) and hides the sections synchronously — there is never
 * a frame where Grade R's text is visible under another grade's heading.
 *
 * Must load BEFORE cards.js: it strips data-card-section from the hidden
 * grids so cards.js does not harvest Grade R's cards for another grade.
 */

console.log('[Grade-Detail] === SCRIPT STARTING ===');

'use strict';

console.log('[Grade-Detail] Strict mode enabled');

/* ══════════════════════════════════════════
   GALLERY VIEWER (immediate setup)
   ══════════════════════════════════════════ */

let currentGalleryImages = [];
let currentGalleryIndex = 0;

console.log('[Gallery] Setting up gallery viewer immediately');

// Use event delegation for gallery clicks - this works even with dynamic content
document.addEventListener('click', (e) => {
  console.log('[Gallery] Document click detected, target:', e.target);
  const galleryItem = e.target.closest('.gallery-item');
  console.log('[Gallery] Closest gallery item:', galleryItem);
  
  if (galleryItem) {
    e.preventDefault();
    e.stopPropagation();
    
    // Find the index of this item in the current gallery
    const galleryGrid = document.querySelector('.gallery-grid');
    console.log('[Gallery] Gallery grid:', galleryGrid);
    if (!galleryGrid) {
      console.log('[Gallery] No gallery grid found');
      return;
    }
    
    const galleryItems = Array.from(galleryGrid.querySelectorAll('.gallery-item'));
    console.log('[Gallery] Gallery items:', galleryItems);
    const index = galleryItems.indexOf(galleryItem);
    console.log('[Gallery] Item index:', index);
    
    if (index !== -1) {
      console.log('[Gallery] Clicked item via delegation', index);
      
      // Update current gallery images
      currentGalleryImages = galleryItems.map(item => {
        const img = item.querySelector('img');
        const caption = item.querySelector('figcaption');
        return {
          src: img ? img.src : '',
          alt: img ? img.alt : '',
          title: caption ? caption.textContent : '',
          date: ''
        };
      });
      
      openGalleryViewer(index);
    }
  }
});

// Setup close button
const closeBtn = document.getElementById('gallery-close');
console.log('[Gallery] Close button element:', closeBtn);
if (closeBtn && !closeBtn.dataset.galleryHandler) {
  closeBtn.dataset.galleryHandler = 'true';
  closeBtn.addEventListener('click', closeGalleryViewer);
  console.log('[Gallery] Close button handler attached');
}

// Setup navigation buttons
const prevBtn = document.getElementById('gallery-prev');
const nextBtn = document.getElementById('gallery-next');
console.log('[Gallery] Prev button element:', prevBtn);
console.log('[Gallery] Next button element:', nextBtn);

if (prevBtn && !prevBtn.dataset.galleryHandler) {
  prevBtn.dataset.galleryHandler = 'true';
  prevBtn.addEventListener('click', () => navigateGallery(-1));
  console.log('[Gallery] Prev button handler attached');
}

if (nextBtn && !nextBtn.dataset.galleryHandler) {
  nextBtn.dataset.galleryHandler = 'true';
  nextBtn.addEventListener('click', () => navigateGallery(1));
  console.log('[Gallery] Next button handler attached');
}

// Keyboard navigation
document.addEventListener('keydown', (e) => {
  const viewer = document.getElementById('gallery-viewer');
  if (!viewer || !viewer.classList.contains('active')) return;
  
  if (e.key === 'Escape') {
    closeGalleryViewer();
  } else if (e.key === 'ArrowLeft') {
    navigateGallery(-1);
  } else if (e.key === 'ArrowRight') {
    navigateGallery(1);
  }
});

function openGalleryViewer(index) {
  console.log('[Gallery] Opening viewer for index', index);
  const viewer = document.getElementById('gallery-viewer');
  const imageEl = document.getElementById('gallery-viewer-image');
  const titleEl = document.getElementById('gallery-viewer-title');
  const dateEl = document.getElementById('gallery-viewer-date');

  console.log('[Gallery] Viewer element:', viewer);
  console.log('[Gallery] Image element:', imageEl);
  console.log('[Gallery] Title element:', titleEl);
  console.log('[Gallery] Date element:', dateEl);

  if (!viewer || !imageEl || !titleEl || !dateEl) {
    console.error('[Gallery] Missing required elements');
    return;
  }

  currentGalleryIndex = index;
  const imageData = currentGalleryImages[index];

  console.log('[Gallery] Image data:', imageData);

  imageEl.src = imageData.src;
  imageEl.alt = imageData.alt;
  titleEl.textContent = imageData.title;
  dateEl.textContent = imageData.date || '';

  // Attach admin edit handlers if in admin mode
  if (document.body.classList.contains('admin-mode')) {
    // Remove existing listeners to avoid duplicates
    titleEl.removeEventListener('click', handleGalleryAdminEdit);
    dateEl.removeEventListener('click', handleGalleryAdminEdit);
    
    // Add admin edit handlers
    titleEl.addEventListener('click', handleGalleryAdminEdit);
    dateEl.addEventListener('click', handleGalleryAdminEdit);
  }

  console.log('[Gallery] Showing viewer');
  viewer.style.display = 'flex';
  // Trigger reflow for transition
  viewer.offsetHeight;
  viewer.classList.add('active');

  // Prevent body scroll
  document.body.style.overflow = 'hidden';
}

function handleGalleryAdminEdit(e) {
  if (!document.body.classList.contains('admin-mode')) return;
  
  e.preventDefault();
  e.stopPropagation();
  
  // Trigger the admin edit popup
  if (typeof handleEditClick === 'function') {
    // Create a mock event object
    const mockEvent = {
      preventDefault: () => {},
      currentTarget: e.currentTarget,
      target: e.target
    };
    handleEditClick(mockEvent);
  }
}

function closeGalleryViewer() {
  const viewer = document.getElementById('gallery-viewer');
  if (!viewer) return;

  viewer.classList.remove('active');
  setTimeout(() => {
    viewer.style.display = 'none';
  }, 300);

  // Restore body scroll
  document.body.style.overflow = '';
}

function navigateGallery(direction) {
  const newIndex = currentGalleryIndex + direction;
  console.log('[Gallery] Navigating from index', currentGalleryIndex, 'to', newIndex);
  
  if (newIndex >= 0 && newIndex < currentGalleryImages.length) {
    currentGalleryIndex = newIndex;
    const imageData = currentGalleryImages[currentGalleryIndex];
    
    console.log('[Gallery] New image data:', imageData);

    const imageEl = document.getElementById('gallery-viewer-image');
    const titleEl = document.getElementById('gallery-viewer-title');
    const dateEl = document.getElementById('gallery-viewer-date');

    if (imageEl) {
      imageEl.src = imageData.src;
      imageEl.alt = imageData.alt;
    }
    if (titleEl) titleEl.textContent = imageData.title;
    if (dateEl) dateEl.textContent = imageData.date || '';
  } else {
    console.log('[Gallery] Navigation out of bounds');
  }
}

console.log('[Gallery] Gallery viewer setup complete');

/* ══════════════════════════════════════════
   GRADE IDENTITY
   ══════════════════════════════════════════ */

/** The grades this school offers — anything else is not a real page. */
const VALID_GRADES = ['R', '1', '2', '3', '4', '5', '6', '7'];

console.log('[Grade-Detail] VALID_GRADES defined');

/**
 * The grade in the URL, or "R" when absent (this page is authored as Grade R).
 * Returns null for anything not in VALID_GRADES, so arbitrary query values
 * are never echoed back into the page.
 */
function currentGradeLabel() {
  console.log('[Grade-Detail] Getting current grade label');
  const raw = new URLSearchParams(window.location.search).get('grade');
  console.log('[Grade-Detail] Raw grade from URL:', raw);
  if (raw === null) return 'R';

  const label = raw.trim().toUpperCase();
  console.log('[Grade-Detail] Processed label:', label);
  return VALID_GRADES.includes(label) ? label : null;
}

/** "R" → "grade_r", "3" → "grade_3" — the `page` key used by the API. */
function gradePageKey(label) {
  return 'grade_' + label.toLowerCase();
}

/* ══════════════════════════════════════════
   PLACEHOLDER
   ══════════════════════════════════════════ */

/**
 * @param {string|null} label a valid grade, or null when the URL named a
 *                            grade this school does not offer
 */
function buildComingSoonPanel(label) {
  const section = document.createElement('section');
  section.className = 'section grade-coming-soon';
  section.id = 'grade-coming-soon';

  const heading = label
    ? `Grade ${label} details are coming soon`
    : 'That grade could not be found';

  const message = label
    ? `We are still putting this page together. In the meantime, the school
       office is happy to answer any questions about Grade ${label}.`
    : `Edendale Primary School offers Grades R to 7. Please pick a grade from
       the list to see its details.`;

  section.innerHTML = `
    <div class="container">
      <div class="coming-soon-panel">
        <span class="coming-soon-icon" aria-hidden="true">${label ? '📝' : '🔍'}</span>
        <h2></h2>
        <p class="coming-soon-message"></p>
        ${label ? `<p class="coming-soon-admin">
          Logged in as an admin? Add this grade's content and it will appear here.
        </p>` : ''}
        <div class="coming-soon-actions">
          <a href="contact.html" class="btn btn-primary">Contact the School</a>
          <a href="grades.html" class="btn btn-outline">Back to All Grades</a>
        </div>
      </div>
    </div>`;

  // Set as text, never markup — label is already validated, but this keeps
  // the guarantee local rather than depending on a check made elsewhere.
  section.querySelector('h2').textContent = heading;
  section.querySelector('.coming-soon-message').textContent =
      message.replace(/\s+/g, ' ').trim();

  return section;
}

/* ══════════════════════════════════════════
   SHOW / HIDE GRADE CONTENT
   ══════════════════════════════════════════ */

function hideGradeContent() {
  const sections = document.querySelectorAll('[data-grade-content]');

  sections.forEach(section => {
    section.hidden = true;

    // Stop cards.js from harvesting this grade's (wrong) static cards.
    section.querySelectorAll('[data-card-section]').forEach(grid => {
      grid.dataset.pendingCardSection = grid.dataset.cardSection;
      delete grid.dataset.cardSection;
    });
  });

  return sections;
}

function revealGradeContent() {
  document.querySelectorAll('[data-grade-content]').forEach(section => {
    section.hidden = false;

    section.querySelectorAll('[data-pending-card-section]').forEach(grid => {
      grid.dataset.cardSection = grid.dataset.pendingCardSection;
      delete grid.dataset.pendingCardSection;
    });
  });

  const panel = document.getElementById('grade-coming-soon');
  if (panel) panel.remove();
}

/* ══════════════════════════════════════════
   LOAD REAL CONTENT FOR THIS GRADE
   ══════════════════════════════════════════ */

/**
 * Asks the backend whether this grade has content. Only a non-empty reply
 * brings the sections back — no backend, or an empty one, leaves the
 * placeholder in place rather than showing another grade's text.
 */
async function loadGradeContent(label) {
  const page = gradePageKey(label);

  let content = null;
  try {
    const res = await fetch(`/api/content?page=${encodeURIComponent(page)}`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    content = await res.json();
  } catch (err) {
    console.info(`[Grade] No content available for "${page}" — showing the `
               + `placeholder. (${err.message})`);
    return false;
  }

  if (!content || typeof content !== 'object' || Object.keys(content).length === 0) {
    console.info(`[Grade] Backend has no content yet for "${page}".`);
    return false;
  }

  revealGradeContent();

  // applyContent lives in main.js, which loads after this file; by the time
  // this promise settles it is defined.
  if (typeof applyContent === 'function') {
    applyContent(content);
  }

  // Now that the grids are back, let cards.js populate them.
  if (typeof initCards === 'function') {
    if (typeof cardState === 'object' && cardState) cardState.initialised = false;
    initCards();
  }

  console.info(`[Grade] Loaded ${Object.keys(content).length} fields for "${page}".`);
  return true;
}

/* ══════════════════════════════════════════
   BOOT
   ══════════════════════════════════════════ */

(function initGradeDetail() {
  const label = currentGradeLabel();
  document.body.dataset.grade = label || 'unknown';

  // Owns the heading and title so there is one source of truth for what
  // grade this page claims to be. The page's inline script used to set
  // these from the raw query value, unvalidated.
  const headingEl = document.getElementById('grade-detail-heading');
  if (headingEl) {
    headingEl.textContent = label ? 'Grade ' + label : 'Grade not found';
  }
  document.title = (label ? 'Grade ' + label : 'Grade not found')
                 + ' – Edendale Primary School';

  // Grade R is what this page is authored as — nothing to swap.
  if (label === 'R') return;

  const sections = hideGradeContent();
  if (sections.length === 0) return;   // not the grade-detail page

  const header = document.querySelector('.page-header');
  const panel  = buildComingSoonPanel(label);

  if (header && header.parentNode) {
    header.parentNode.insertBefore(panel, header.nextSibling);
  } else {
    document.body.appendChild(panel);
  }

  // Only a real grade can have content to fetch.
  if (label) loadGradeContent(label);

  console.log('[Gallery] Grade detail page loaded, setting up gallery');

  // Use event delegation for gallery clicks - this works even with dynamic content
  document.addEventListener('click', (e) => {
    console.log('[Gallery] Document click detected, target:', e.target);
    const galleryItem = e.target.closest('.gallery-item');
    console.log('[Gallery] Closest gallery item:', galleryItem);
    
    if (galleryItem) {
      e.preventDefault();
      e.stopPropagation();
      
      // Find the index of this item in the current gallery
      const galleryGrid = document.querySelector('.gallery-grid');
      console.log('[Gallery] Gallery grid:', galleryGrid);
      if (!galleryGrid) {
        console.log('[Gallery] No gallery grid found');
        return;
      }
      
      const galleryItems = Array.from(galleryGrid.querySelectorAll('.gallery-item'));
      console.log('[Gallery] Gallery items:', galleryItems);
      const index = galleryItems.indexOf(galleryItem);
      console.log('[Gallery] Item index:', index);
      
      if (index !== -1) {
        console.log('[Gallery] Clicked item via delegation', index);
        
        // Update current gallery images
        currentGalleryImages = galleryItems.map(item => {
          const img = item.querySelector('img');
          const caption = item.querySelector('figcaption');
          return {
            src: img ? img.src : '',
            alt: img ? img.alt : '',
            title: caption ? caption.textContent : '',
            date: ''
          };
        });
        
        openGalleryViewer(index);
      }
    }
  });

  // Setup close button
  const closeBtn = document.getElementById('gallery-close');
  console.log('[Gallery] Close button element:', closeBtn);
  if (closeBtn && !closeBtn.dataset.galleryHandler) {
    closeBtn.dataset.galleryHandler = 'true';
    closeBtn.addEventListener('click', closeGalleryViewer);
    console.log('[Gallery] Close button handler attached');
  }
})();

/* ══════════════════════════════════════════
   GALLERY VIEWER
   ══════════════════════════════════════════ */

function openGalleryViewer(index) {
  console.log('[Gallery] Opening viewer for index', index);
  const viewer = document.getElementById('gallery-viewer');
  const imageEl = document.getElementById('gallery-viewer-image');
  const titleEl = document.getElementById('gallery-viewer-title');
  const dateEl = document.getElementById('gallery-viewer-date');

  console.log('[Gallery] Viewer element:', viewer);
  console.log('[Gallery] Image element:', imageEl);
  console.log('[Gallery] Title element:', titleEl);
  console.log('[Gallery] Date element:', dateEl);

  if (!viewer || !imageEl || !titleEl || !dateEl) {
    console.error('[Gallery] Missing required elements');
    return;
  }

  currentGalleryIndex = index;
  const imageData = currentGalleryImages[index];

  console.log('[Gallery] Image data:', imageData);

  imageEl.src = imageData.src;
  imageEl.alt = imageData.alt;
  titleEl.textContent = imageData.title;
  dateEl.textContent = imageData.date || '';

  // Attach admin edit handlers if in admin mode
  if (document.body.classList.contains('admin-mode')) {
    // Remove existing listeners to avoid duplicates
    titleEl.removeEventListener('click', handleGalleryAdminEdit);
    dateEl.removeEventListener('click', handleGalleryAdminEdit);
    
    // Add admin edit handlers
    titleEl.addEventListener('click', handleGalleryAdminEdit);
    dateEl.addEventListener('click', handleGalleryAdminEdit);
  }

  console.log('[Gallery] Showing viewer');
  viewer.style.display = 'flex';
  // Trigger reflow for transition
  viewer.offsetHeight;
  viewer.classList.add('active');

  // Prevent body scroll
  document.body.style.overflow = 'hidden';
}

function handleGalleryAdminEdit(e) {
  if (!document.body.classList.contains('admin-mode')) return;
  
  e.preventDefault();
  e.stopPropagation();
  
  // Trigger the admin edit popup
  if (typeof handleEditClick === 'function') {
    // Create a mock event object
    const mockEvent = {
      preventDefault: () => {},
      currentTarget: e.currentTarget,
      target: e.target
    };
    handleEditClick(mockEvent);
  }
}

function closeGalleryViewer() {
  const viewer = document.getElementById('gallery-viewer');
  if (!viewer) return;

  viewer.classList.remove('active');
  setTimeout(() => {
    viewer.style.display = 'none';
  }, 300);

  // Restore body scroll
  document.body.style.overflow = '';
}
