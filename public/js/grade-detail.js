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

'use strict';

/* ══════════════════════════════════════════
   GRADE IDENTITY
   ══════════════════════════════════════════ */

/** The grades this school offers — anything else is not a real page. */
const VALID_GRADES = ['R', '1', '2', '3', '4', '5', '6', '7'];

/**
 * The grade in the URL, or "R" when absent (this page is authored as Grade R).
 * Returns null for anything not in VALID_GRADES, so arbitrary query values
 * are never echoed back into the page.
 */
function currentGradeLabel() {
  const raw = new URLSearchParams(window.location.search).get('grade');
  if (raw === null) return 'R';

  const label = raw.trim().toUpperCase();
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
})();
