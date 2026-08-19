'use strict';

let isAdminMode = false;
let currentEditTarget = null;
let pendingChanges = {};

async function checkAdminStatus() {
  const token = localStorage.getItem('adminToken');
  if (!token) return;   // nothing to verify — stay logged out

  // Verify the token with the server BEFORE showing any admin UI. The old
  // version flipped on admin-mode as soon as a token existed, then only
  // reverted it after the server said no — so an expired or tampered
  // token would flash the full admin interface for a moment on every load.
  let valid = false;
  try {
    const res = await fetch('/api/admin/status', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await res.json();
    valid = !!data.admin;
  } catch (err) {
    // Fail SAFE, not open: a network hiccup should not leave admin
    // controls sitting on screen indefinitely just because a token was
    // once present. The old comment here said the opposite on purpose —
    // that was the bug.
    console.error('Error checking admin status:', err);
  }

  if (!valid) {
    localStorage.removeItem('adminToken');
    return;
  }

  isAdminMode = true;
  document.body.classList.add('admin-mode');
  document.documentElement.classList.add('admin-mode');
  const adminBar = document.getElementById('admin-bar');
  if (adminBar) adminBar.classList.add('active');
  notifyModeChange();

  // Save initial content state for undo functionality
  saveInitialContentState();
}

function saveInitialContentState() {
  // Both index.html and about.html share the same data (about page)
  let page = window.location.pathname.split('/').pop().replace('.html', '');
  if (!page || page === 'index' || page === 'home') page = 'about';
  
  const initialState = {};
  
  // Save all editable fields
  document.querySelectorAll('[data-editable]').forEach(el => {
    const field = el.dataset.field;
    if (field) {
      if (el.dataset.type === 'image') {
        initialState[field] = el.getAttribute('src');
      } else if (el.dataset.type === 'link') {
        initialState[field] = el.getAttribute('href');
      } else {
        initialState[field] = el.innerHTML;
      }
    }
  });
  
  // Save card data for about page
  initialState.cardData = collectAboutPageCardData();
  
  localStorage.setItem(`initialContent_${page}`, JSON.stringify(initialState));
}

function updateInitialContentState() {
  // Both index.html and about.html share the same data (about page)
  let page = window.location.pathname.split('/').pop().replace('.html', '');
  if (!page || page === 'index' || page === 'home') page = 'about';
  
  // Get existing state
  const existingState = JSON.parse(localStorage.getItem(`initialContent_${page}`) || '{}');
  
  // Update with current card data
  existingState.cardData = collectAboutPageCardData();
  
  localStorage.setItem(`initialContent_${page}`, JSON.stringify(existingState));
}

/** Lets cards.js attach or drop its controls when edit mode is toggled. */
function notifyModeChange() {
  document.dispatchEvent(new CustomEvent('admin:modechange', {
    detail: { active: isAdminMode }
  }));
}

async function exitAdminMode() {
  isAdminMode = false;
  document.body.classList.remove('admin-mode');
  document.documentElement.classList.remove('admin-mode');
  const adminBar = document.getElementById('admin-bar');
  if (adminBar) adminBar.classList.remove('active');
  pendingChanges = {};
  notifyModeChange();
  try {
    const token = localStorage.getItem('adminToken');
  await fetch('/api/admin/logout', { method: 'POST', headers: { 'Authorization': 'Bearer ' + token } });
  localStorage.removeItem('adminToken');
    window.location.reload();
  } catch (err) {
    console.error(err);
  }
}

function handleEditClick(e) {
  if (!isAdminMode) return;
  e.preventDefault();
  
  // Close any existing edit popup before opening a new one
  hideEditPopup();
  
  currentEditTarget = e.currentTarget;
  const isImage = currentEditTarget.dataset.type === 'image';
  const isLink = currentEditTarget.dataset.type === 'link';
  let currentVal = currentEditTarget.innerHTML;
  if (isImage) currentVal = currentEditTarget.getAttribute('src');
  if (isLink) currentVal = currentEditTarget.getAttribute('href');
  
  const editPopupToolbar = document.getElementById('edit-popup-toolbar');
  const editPopupImgRow = document.getElementById('edit-popup-image-row');
  const editPopupLinkRow = document.getElementById('edit-popup-link-row');
  const editPopupText   = document.getElementById('edit-popup-text');
  const editPopupImgUrl = document.getElementById('edit-popup-image-url');
  const editPopupLinkUrl = document.getElementById('edit-popup-link-url');
  const editPopup       = document.getElementById('edit-popup');
  
  if (isImage) {
    if (editPopupToolbar) editPopupToolbar.style.display = 'none';
    if (editPopupImgRow) editPopupImgRow.style.display = 'block';
    if (editPopupLinkRow) editPopupLinkRow.style.display = 'none';
    if (editPopupText) editPopupText.style.display = 'none';
    if (editPopupImgUrl) editPopupImgUrl.value = currentVal;
  } else if (isLink) {
    if (editPopupToolbar) editPopupToolbar.style.display = 'none';
    if (editPopupImgRow) editPopupImgRow.style.display = 'none';
    if (editPopupLinkRow) editPopupLinkRow.style.display = 'block';
    if (editPopupText) editPopupText.style.display = 'none';
    if (editPopupLinkUrl) editPopupLinkUrl.value = currentVal;
  } else {
    if (editPopupToolbar) editPopupToolbar.style.display = 'flex';
    if (editPopupImgRow) editPopupImgRow.style.display = 'none';
    if (editPopupLinkRow) editPopupLinkRow.style.display = 'none';
    if (editPopupText) {
      editPopupText.style.display = 'block';
      editPopupText.innerHTML = currentVal;
    }
  }

  applyEditLimit(currentEditTarget, isImage || isLink);

  if (editPopup) {
    editPopup.classList.add('active');
    positionEditPopup(editPopup, currentEditTarget);
  }
}

/**
 * Places the popup next to the element being edited.
 *
 * #edit-popup is position:fixed, so we use viewport coordinates.
 * Keeps position stable during scroll and avoids navbar/footer overlap.
 */
function positionEditPopup(popup, target) {
  const rect = target.getBoundingClientRect();
  const margin = 12;

  // Get navbar and footer heights to avoid overlap
  const navbar = document.querySelector('.navbar');
  const footer = document.querySelector('footer');
  const navbarHeight = navbar ? navbar.offsetHeight : 0;
  const footerHeight = footer ? footer.offsetHeight : 0;

  // Measured after .active has made it displayable, or both are 0.
  const width = popup.offsetWidth;
  const height = popup.offsetHeight;

  // Safe vertical area (between navbar and footer)
  const safeTop = navbarHeight + margin;
  const safeBottom = window.innerHeight - footerHeight - margin;
  const safeHeight = safeBottom - safeTop;

  // Prefer to the right of the element; flip to left when that would overflow.
  let left = rect.right + margin;
  if (left + width > window.innerWidth - margin) {
    left = rect.left - width - margin;
  }
  // Still no room either way (element wider than the viewport) — pin it.
  left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));

  // Vertically center with the element, but keep within safe area
  let top = rect.top + (rect.height / 2) - (height / 2);
  
  // Ensure it doesn't overlap navbar
  if (top < safeTop) {
    top = safeTop;
  }
  // Ensure it doesn't overlap footer
  if (top + height > safeBottom) {
    top = safeBottom - height;
  }
  
  // Final safety check
  top = Math.max(safeTop, Math.min(top, safeBottom - height));

  popup.style.top = top + 'px';
  popup.style.left = left + 'px';
}

/* ══════════════════════════════════════════
   LENGTH CONSTRAINTS
   ══════════════════════════════════════════ */

/**
 * Counts what the visitor actually sees. The popup is a contenteditable div,
 * so innerHTML would include the markup the toolbar inserts (<b>, <ul>…) and
 * a bolded word would eat into the budget for no visible reason.
 */
function editPopupTextLength() {
  const el = document.getElementById('edit-popup-text');
  return el ? el.textContent.length : 0;
}

// Held so the previous listener can actually be removed — passing a freshly
// built closure to removeEventListener matches nothing and the handlers pile
// up, one more on every edit.
let editLimitHandler = null;

/**
 * Wires the character counter for an element carrying data-limit, so a long
 * title cannot overflow the header it sits in. The counter is created on
 * demand, so pages need no extra markup, and elements without data-limit stay
 * unconstrained exactly as before.
 */
function applyEditLimit(el, skip) {
  const textEl = document.getElementById('edit-popup-text');
  if (!textEl) return;

  if (editLimitHandler) {
    textEl.removeEventListener('input', editLimitHandler);
    editLimitHandler = null;
  }

  const limit = Number(el.dataset.limit);
  let counter = document.getElementById('edit-popup-counter');

  if (skip || !limit || Number.isNaN(limit)) {
    if (counter) counter.style.display = 'none';
    setContentSaveDisabled(false);
    return;
  }

  if (!counter) {
    counter = document.createElement('span');
    counter.id = 'edit-popup-counter';
    counter.className = 'char-counter';
    textEl.insertAdjacentElement('afterend', counter);
  }
  counter.style.display = 'block';

  editLimitHandler = () => {
    const used = editPopupTextLength();
    counter.textContent = `${used} / ${limit}`;
    counter.classList.toggle('over', used > limit);
    counter.classList.toggle('warn', used <= limit && used >= limit * 0.8);
    setContentSaveDisabled(used > limit);
  };

  textEl.addEventListener('input', editLimitHandler);
  editLimitHandler();
}

function setContentSaveDisabled(disabled) {
  const saveBtn = document.getElementById('edit-popup-save');
  if (saveBtn) saveBtn.disabled = disabled;
}

function saveEdit() {
  if (!currentEditTarget) return;
  const isImage = currentEditTarget.dataset.type === 'image';
  const isLink = currentEditTarget.dataset.type === 'link';
  const fieldName = currentEditTarget.dataset.field;
  let newValue = '';
  
  if (isImage) {
    const input = document.getElementById('edit-popup-image-url');
    if (input) newValue = input.value.trim();
  } else if (isLink) {
    const input = document.getElementById('edit-popup-link-url');
    if (input) newValue = input.value.trim();
  } else {
    const textarea = document.getElementById('edit-popup-text');
    if (textarea) newValue = textarea.innerHTML.trim();

    // The disabled button is the visible cue; this is what actually stops an
    // over-length save (a paste can outrun the input event).
    const limit = Number(currentEditTarget.dataset.limit);
    if (limit && editPopupTextLength() > limit) return;
  }

  if (isImage) {
    currentEditTarget.setAttribute('src', newValue);
  } else if (isLink) {
    currentEditTarget.setAttribute('href', newValue);
  } else {
    currentEditTarget.innerHTML = newValue;
  }
  
  if (fieldName) {
    pendingChanges[fieldName] = newValue;
    
    // If this is a new card field (contains timestamp), update initial state
    if (fieldName.includes('new_')) {
      updateInitialContentState();
    }
  }
  
  hideEditPopup();
}


function undoChanges() {
  if (Object.keys(pendingChanges).length === 0) {
    alert('No unsaved changes to undo.');
    return;
  }
  // Both index.html and about.html share the same data (about page)
  let page = window.location.pathname.split('/').pop().replace('.html', '');
  if (!page || page === 'index' || page === 'home') page = 'about';
  
  const saved = localStorage.getItem(`initialContent_${page}`);
  if (saved) {
    const data = JSON.parse(saved);
    
    // Revert pending changes
    for (const field of Object.keys(pendingChanges)) {
       const el = document.querySelector(`[data-field="${field}"]`);
       if (!el) continue;
       
       const originalValue = data[field];
       if (originalValue !== undefined) {
         if (el.dataset.type === 'image') {
           el.setAttribute('src', originalValue);
         } else if (el.dataset.type === 'link') {
           el.setAttribute('href', originalValue);
         } else {
           el.innerHTML = originalValue;
         }
       }
    }
    
    // Also revert card structure
    if (data.cardData) {
      revertAboutPageCards(data.cardData);
    }
    
    pendingChanges = {};
    alert('Unsaved changes reverted.');
  } else {
    // Fallback
    window.location.reload();
  }
}

function revertAboutPageCards(cardData) {
  // Revert stats cards
  const statsGrid = document.querySelector('.stats-grid');
  if (statsGrid && cardData.stats) {
    // Remove all current stat boxes except add button
    statsGrid.querySelectorAll('.stat-box:not(.add-card-btn)').forEach(card => card.remove());
    
    // Recreate stat cards from saved data
    cardData.stats.forEach(stat => {
      const newCard = document.createElement('div');
      newCard.className = 'stat-box';
      newCard.innerHTML = `
        <button class="remove-card-btn admin-only">×</button>
        <div class="stat-number" data-editable data-field="${stat.numberField}">${stat.number}</div>
        <div class="stat-label" data-editable data-field="${stat.labelField}">${stat.label}</div>
      `;
      statsGrid.insertBefore(newCard, statsGrid.querySelector('.add-card-btn'));
      
      // Attach edit handlers
      newCard.querySelectorAll('[data-editable]').forEach(el => {
        el.addEventListener('click', handleEditClick);
      });
    });
  }
  
  // Revert mission cards
  const missionGrid = document.querySelector('.mission-grid');
  if (missionGrid && cardData.mission) {
    missionGrid.querySelectorAll('.card:not(.add-card-btn)').forEach(card => card.remove());
    
    cardData.mission.forEach(mission => {
      const newCard = document.createElement('div');
      newCard.className = 'card mission-card';
      newCard.innerHTML = `
        <button class="remove-card-btn admin-only">×</button>
        <div class="card-body">
          <h3 style="text-align:center;" data-editable data-field="${mission.titleField}">${mission.title}</h3>
          <p style="text-align:center;" data-editable data-field="${mission.descField}">${mission.desc}</p>
        </div>
      `;
      missionGrid.insertBefore(newCard, missionGrid.querySelector('.add-card-btn'));
      
      newCard.querySelectorAll('[data-editable]').forEach(el => {
        el.addEventListener('click', handleEditClick);
      });
    });
  }
  
  // Revert values cards
  const valuesGrid = document.querySelector('.why-grid');
  if (valuesGrid && cardData.values) {
    valuesGrid.querySelectorAll('.card:not(.add-card-btn)').forEach(card => card.remove());
    
    cardData.values.forEach(value => {
      const newCard = document.createElement('div');
      newCard.className = 'card why-card';
      newCard.innerHTML = `
        <button class="remove-card-btn admin-only">×</button>
        <div class="card-body">
          <h4 style="text-align:center;" data-editable data-field="${value.titleField}">${value.title}</h4>
          <p style="text-align:center;" data-editable data-field="${value.descField}">${value.desc}</p>
        </div>
      `;
      valuesGrid.insertBefore(newCard, valuesGrid.querySelector('.add-card-btn'));
      
      newCard.querySelectorAll('[data-editable]').forEach(el => {
        el.addEventListener('click', handleEditClick);
      });
    });
  }
}

function hideEditPopup() {
  const editPopup = document.getElementById('edit-popup');
  if (editPopup) editPopup.classList.remove('active');
  currentEditTarget = null;
  
  // Also close card editor if it's open
  const cardEditor = document.getElementById('card-editor');
  if (cardEditor && cardEditor.classList.contains('active')) {
    if (typeof closeCardEditor === 'function') {
      closeCardEditor();
    } else {
      cardEditor.classList.remove('active');
    }
  }
}

let isSaving = false;

async function saveAllChanges() {
  // Prevent multiple simultaneous saves
  if (isSaving) {
    console.log('[Save] Already saving, ignoring duplicate click');
    return;
  }
  
  isSaving = true;
  const saveBtn = document.getElementById('admin-save-btn');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
  }
  
  try {
    // Both index.html and about.html share the same data (about page)
    const pathname = window.location.pathname;
    let page = pathname.split('/').pop().replace('.html', '');
    
    // Default to 'about' for index/home pages, otherwise use actual page name
    if (!page || page === 'index' || page === 'home') {
      page = 'about';
    }
    
    console.log('[Save] Pathname:', pathname);
    console.log('[Save] Using page:', page);
    
    // Collect all current card data including new cards
    const cardData = collectAboutPageCardData();
    console.log('[Save] Card Data:', cardData);
    console.log('[Save] Pending Changes:', pendingChanges);
    
    // Check if there are any changes (field changes or card structure changes)
    const hasFieldChanges = Object.keys(pendingChanges).length > 0;
    const hasCardChanges = cardData && (
      (cardData.stats && cardData.stats.length > 0) ||
      (cardData.mission && cardData.mission.length > 0) ||
      (cardData.values && cardData.values.length > 0)
    );
    
    console.log('[Save] Has field changes:', hasFieldChanges);
    console.log('[Save] Has card changes:', hasCardChanges);
    
    if (!hasFieldChanges && !hasCardChanges) {
      alert('No changes to save.');
      return;
    }
    
    const token = localStorage.getItem('adminToken');
    const payload = { page, changes: pendingChanges, cardData };
    console.log('[Save] Sending payload:', payload);
    
    const response = await fetch('/api/content', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify(payload)
    });
    
    console.log('[Save] Response status:', response.status);
    const result = await response.json();
    console.log('[Save] Response:', result);
    
    if (response.ok) {
      alert('Changes saved successfully!');
      pendingChanges = {};
      // Update initial state after successful save
      updateInitialContentState();
    } else {
      alert('Failed to save changes. Please try again.');
    }
  } catch (err) {
    console.warn('[Admin] Backend not reachable — changes logged to console only.');
    console.table(pendingChanges);
    console.log('Card Data:', cardData);
    alert('(Dev mode) Changes logged to console. Connect backend to persist.');
    pendingChanges = {};
  } finally {
    isSaving = false;
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save All Changes';
    }
  }
}

function collectAboutPageCardData() {
  const cardData = {
    stats: [],
    mission: [],
    values: []
  };
  
  // Collect stats cards
  document.querySelectorAll('.stats-grid .stat-box:not(.add-card-btn)').forEach(card => {
    const number = card.querySelector('.stat-number');
    const label = card.querySelector('.stat-label');
    if (number && label) {
      cardData.stats.push({
        number: number.innerHTML,
        numberField: number.dataset.field,
        label: label.innerHTML,
        labelField: label.dataset.field
      });
    }
  });
  
  // Collect mission cards
  document.querySelectorAll('.mission-grid .card:not(.add-card-btn)').forEach(card => {
    const title = card.querySelector('h3');
    const desc = card.querySelector('p');
    if (title && desc) {
      cardData.mission.push({
        title: title.innerHTML,
        titleField: title.dataset.field,
        desc: desc.innerHTML,
        descField: desc.dataset.field
      });
    }
  });
  
  // Collect values cards
  document.querySelectorAll('.why-grid .card:not(.add-card-btn)').forEach(card => {
    const title = card.querySelector('h4');
    const desc = card.querySelector('p');
    if (title && desc) {
      cardData.values.push({
        title: title.innerHTML,
        titleField: title.dataset.field,
        desc: desc.innerHTML,
        descField: desc.dataset.field
      });
    }
  });
  
  return cardData;
}

function collectHomePageCardData() {
  const cardData = {
    stats: [],
    mission: [],
    values: []
  };
  
  // Collect stats cards
  document.querySelectorAll('.stats-grid .stat-box:not(.add-card-btn)').forEach(card => {
    const number = card.querySelector('.stat-number');
    const label = card.querySelector('.stat-label');
    if (number && label) {
      cardData.stats.push({
        number: number.innerHTML,
        numberField: number.dataset.field,
        label: label.innerHTML,
        labelField: label.dataset.field
      });
    }
  });
  
  // Collect mission cards
  document.querySelectorAll('.mission-grid .card:not(.add-card-btn)').forEach(card => {
    const title = card.querySelector('h3');
    const desc = card.querySelector('p');
    if (title && desc) {
      cardData.mission.push({
        title: title.innerHTML,
        titleField: title.dataset.field,
        desc: desc.innerHTML,
        descField: desc.dataset.field
      });
    }
  });
  
  // Collect values cards
  document.querySelectorAll('.why-grid .card:not(.add-card-btn)').forEach(card => {
    const title = card.querySelector('h4');
    const desc = card.querySelector('p');
    if (title && desc) {
      cardData.values.push({
        title: title.innerHTML,
        titleField: title.dataset.field,
        desc: desc.innerHTML,
        descField: desc.dataset.field
      });
    }
  });
  
  return cardData;
}

document.addEventListener('DOMContentLoaded', () => {
  checkAdminStatus();
  
  document.addEventListener('click', e => {
    
    const editPopupToolbarBtn = e.target.closest('#edit-popup-toolbar button');
    if (editPopupToolbarBtn) {
      e.preventDefault();
      const cmd = editPopupToolbarBtn.dataset.cmd;
      document.execCommand(cmd, false, null);
      // Ensure the contenteditable div stays focused
      document.getElementById('edit-popup-text').focus();
      return;
    }

    const adminLogoutBtn = e.target.closest('#admin-logout-btn');
    if (adminLogoutBtn) {
      exitAdminMode();
    }
    const editPopupSave = e.target.closest('#edit-popup-save');
    if (editPopupSave) {
      saveEdit();
    }
    const editPopupCancel = e.target.closest('#edit-popup-cancel');
    if (editPopupCancel) {
      hideEditPopup();
    }
    const adminUndoBtn = e.target.closest('#admin-undo-btn');
    if (adminUndoBtn) {
      undoChanges();
    }
    const adminSaveBtn = e.target.closest('#admin-save-btn');
    if (adminSaveBtn) {
      saveAllChanges();
    }
    
    const editPopup = document.getElementById('edit-popup');
    if (editPopup && editPopup.classList.contains('active')) {
      if (!editPopup.contains(e.target) && e.target !== currentEditTarget && !e.target.closest('[data-editable]')) {
        hideEditPopup();
      }
    }
  });
  
  // Close edit popup on scroll to prevent it from following content
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    const editPopup = document.getElementById('edit-popup');
    if (editPopup && editPopup.classList.contains('active')) {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        hideEditPopup();
      }, 150); // Small delay to avoid closing on minor scrolls
    }
  });
  
  document.querySelectorAll('[data-editable]').forEach(el => {
    el.addEventListener('click', handleEditClick);
  });
  
  // About page card management
  initAboutPageCardManagement();
});

/* ══════════════════════════════════════════
   ABOUT PAGE CARD MANAGEMENT
   ══════════════════════════════════════════ */

let aboutPageCardManagementInitialized = false;
let isRemovingCard_admin = false;

function initAboutPageCardManagement() {
  if (aboutPageCardManagementInitialized) return;
  aboutPageCardManagementInitialized = true;
  
  // Handle remove card buttons and add card buttons via event delegation
  document.addEventListener('click', function(e) {
    // Handle remove card buttons
    if (e.target.classList.contains('remove-card-btn')) {
      e.preventDefault();
      e.stopPropagation();
      
      // Prevent multiple rapid removals
      if (isRemovingCard_admin) {
        console.log('[Card Removal] Already removing a card, ignoring duplicate click');
        return;
      }
      
      const card = e.target.closest('.card, .stat-box');
      if (card && !card.classList.contains('add-card-btn')) {
        if (confirm('Are you sure you want to delete this card?')) {
          isRemovingCard_admin = true;
          
          // Add visual feedback
          card.style.opacity = '0.5';
          card.style.pointerEvents = 'none';
          
          // Use requestAnimationFrame for smoother performance
          requestAnimationFrame(() => {
            // Remove the editable fields from pending changes
            card.querySelectorAll('[data-editable]').forEach(el => {
              const fieldName = el.dataset.field;
              if (fieldName && pendingChanges[fieldName]) {
                delete pendingChanges[fieldName];
              }
            });
            
            // Remove card from DOM
            card.remove();
            
            // Update initial state to reflect the removal
            updateInitialContentState();
            
            isRemovingCard_admin = false;
          });
        }
      }
      return;
    }
    
    // Handle add card buttons for about page
    const addBtn = e.target.closest('.add-card-btn[data-section]');
    if (addBtn) {
      e.preventDefault();
      e.stopPropagation();
      const section = addBtn.dataset.section;
      const grid = addBtn.parentElement;
      
      // Create a new card based on section type, preserving exact structure
      const newCard = document.createElement('div');
      const timestamp = Date.now();
      
      if (section === 'stats') {
        newCard.className = 'stat-box';
        newCard.innerHTML = `
          <button class="remove-card-btn admin-only">×</button>
          <div class="stat-number" data-editable data-field="about_stat_new_${timestamp}">0</div>
          <div class="stat-label" data-editable data-field="about_stat_new_${timestamp}_label">Label</div>
        `;
      } else if (section === 'mission') {
        newCard.className = 'card mission-card';
        newCard.innerHTML = `
          <button class="remove-card-btn admin-only">×</button>
          <div class="card-body">
            <h3 style="text-align:center;" data-editable data-field="about_mission_new_${timestamp}_title">New Card</h3>
            <p style="text-align:center;" data-editable data-field="about_mission_new_${timestamp}_desc">Add your content here...</p>
          </div>
        `;
      } else if (section === 'values') {
        newCard.className = 'card why-card';
        newCard.innerHTML = `
          <button class="remove-card-btn admin-only">×</button>
          <div class="card-body">
            <h4 style="text-align:center;" data-editable data-field="about_values_new_${timestamp}_title">New Card</h4>
            <p style="text-align:center;" data-editable data-field="about_values_new_${timestamp}_desc">Add your content here...</p>
          </div>
        `;
      }
      
      // Insert before the add button
      grid.insertBefore(newCard, addBtn);
      
      // Attach edit handlers to new card's editable elements
      newCard.querySelectorAll('[data-editable]').forEach(el => {
        el.addEventListener('click', handleEditClick);
      });
      
      // Update initial state to include the new card
      updateInitialContentState();
    }
  });
}