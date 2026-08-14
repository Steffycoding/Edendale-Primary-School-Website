/**
 * calendar.js — Events Calendar Logic
 * Edendale Primary School Website
 *
 * Responsibilities:
 *  - Render a monthly grid AND a weekly grid (toggleable)
 *  - Load events from the backend (falls back to localStorage /
 *    seed data when the API isn't reachable, same pattern used
 *    elsewhere on this site)
 *  - Highlight event days, click a day to filter the list below
 *  - Render a paginated "Upcoming Events" card grid
 *  - Admin: Add / Edit / Delete events (admin-mode only)
 */

'use strict';

/* ══════════════════════════════════════════
   STATE
   ══════════════════════════════════════════ */
const STORAGE_KEY = 'edendaleEventsData';

const today = new Date();

let events = []; // { id, title, description, date:'YYYY-MM-DD', startTime, endTime, allDay, isHoliday, isCustom }

let currentView = 'monthly'; // 'monthly' | 'weekly'
let currentYear = today.getFullYear();
let currentMonth = today.getMonth(); // 0-indexed, monthly view anchor
let weekOffset = 0; // weeks relative to the current week, weekly view anchor
let selectedDate = null; // 'YYYY-MM-DD' string, filters the list below when set
let eventPage = 0;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/* ══════════════════════════════════════════
   ELEMENT REFERENCES
   ══════════════════════════════════════════ */
const viewToggle = document.getElementById('cal-view-toggle');
const monthlyViewEl = document.getElementById('cal-monthly-view');
const weeklyViewEl = document.getElementById('cal-weekly-view');

const calendarGrid = document.getElementById('calendar-grid');
const calendarTitle = document.getElementById('calendar-month-title');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');

const weekGrid = document.getElementById('week-grid');
const weekTitle = document.getElementById('calendar-week-title');
const prevWeekBtn = document.getElementById('prev-week');
const nextWeekBtn = document.getElementById('next-week');

const todayBtn = document.getElementById('cal-today-btn');

const eventsList = document.getElementById('events-list');
const eventsListTitle = document.getElementById('events-list-title');
const addEventBtn = document.getElementById('add-event-btn');

const paginationControls = document.getElementById('pagination-controls');
const pagePrevBtn = document.getElementById('page-prev-btn');
const pageNextBtn = document.getElementById('page-next-btn');
const pageDotsEl = document.getElementById('page-dots');
const pageIndicatorEl = document.getElementById('page-indicator');

const eventModal = document.getElementById('event-modal');
const eventModalHeading = document.getElementById('event-modal-heading');
const eventModalClose = document.getElementById('event-modal-close');
const eventModalSave = document.getElementById('event-modal-save');
const eventModalCancel = document.getElementById('event-modal-cancel');
const eventModalId = document.getElementById('event-modal-id');
const eventModalTitle = document.getElementById('event-modal-title');
const eventModalDesc = document.getElementById('event-modal-desc');
const eventModalDate = document.getElementById('event-modal-date');
const eventModalStart = document.getElementById('event-modal-start');
const eventModalEnd = document.getElementById('event-modal-end');
const eventModalAllDay = document.getElementById('event-modal-allday');
const eventModalHoliday = document.getElementById('event-modal-holiday');

const toastEl = document.getElementById('cal-toast');

const dayModal = document.getElementById('day-info-modal');
const dayModalClose = document.getElementById('day-info-close');
const dayModalTitle = document.getElementById('day-info-title');
const dayModalList = document.getElementById('day-info-list');
let dayModalDate = null; // date currently shown in the day-info modal

/* ══════════════════════════════════════════
   SEED DATA (used the first time there is
   nothing in localStorage / the API fails)
   ══════════════════════════════════════════ */
function seedEvents() {
  const y = currentYear;
  const m = currentMonth;
  const iso = (yr, mo, d) => `${yr}-${pad(mo + 1)}-${pad(d)}`;
  return [
    { id: 1, title: 'Term 2 Begins', description: 'Start of second school term.', date: iso(y, m, 7), startTime: '07:30', endTime: '', allDay: false, isHoliday: false, isCustom: true },
    { id: 2, title: 'Parents Meeting', description: 'Parent-teacher interviews.', date: iso(y, m, 15), startTime: '14:00', endTime: '16:00', allDay: false, isHoliday: false, isCustom: true },
    { id: 3, title: 'Sports Day', description: 'Annual inter-grade sports day.', date: iso(y, m, 22), startTime: '09:00', endTime: '13:00', allDay: false, isHoliday: false, isCustom: true },
    { id: 4, title: 'Public Holiday', description: 'School closed for a public holiday.', date: iso(y, m, 1), startTime: '', endTime: '', allDay: true, isHoliday: true, isCustom: false }
  ];
}

/* ══════════════════════════════════════════
   INIT
   ══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  fetchEvents().then(() => {
    renderAll();
  });

  if (viewToggle) {
    viewToggle.addEventListener('click', (e) => {
      const btn = e.target.closest('.cal-view-btn');
      if (!btn) return;
      setView(btn.dataset.view);
    });
  }

  if (prevMonthBtn) prevMonthBtn.addEventListener('click', () => shiftMonth(-1));
  if (nextMonthBtn) nextMonthBtn.addEventListener('click', () => shiftMonth(1));
  if (prevWeekBtn) prevWeekBtn.addEventListener('click', () => shiftWeek(-1));
  if (nextWeekBtn) nextWeekBtn.addEventListener('click', () => shiftWeek(1));
  if (todayBtn) todayBtn.addEventListener('click', jumpToToday);

  if (addEventBtn) addEventBtn.addEventListener('click', () => openEventModal());
  if (eventModalSave) eventModalSave.addEventListener('click', saveEvent);
  if (eventModalCancel) eventModalCancel.addEventListener('click', closeEventModal);
  if (eventModalClose) eventModalClose.addEventListener('click', closeEventModal);
  if (eventModal) {
    eventModal.addEventListener('click', (e) => {
      if (e.target === eventModal) closeEventModal();
    });
  }

  if (dayModalClose) dayModalClose.addEventListener('click', closeDayModal);
  if (dayModal) {
    dayModal.addEventListener('click', (e) => {
      if (e.target === dayModal) closeDayModal();
    });
  }

  if (pagePrevBtn) pagePrevBtn.addEventListener('click', () => { eventPage--; renderEventsList(); });
  if (pageNextBtn) pageNextBtn.addEventListener('click', () => { eventPage++; renderEventsList(); });

  [eventModalStart, eventModalEnd].forEach(input => {
    if (!input) return;
    input.addEventListener('input', () => formatTimeInput(input));
  });

  window.addEventListener('resize', () => renderEventsList());

  // Live-update admin-only controls (add/edit/delete) when admin mode
  // is toggled without a full page reload.
  document.addEventListener('admin:modechange', () => {
    renderEventsList();
    updateAddButtonVisibility();
  });
});

function updateAddButtonVisibility() {
  if (!addEventBtn) return;
  addEventBtn.style.display = document.body.classList.contains('admin-mode') ? 'inline-block' : 'none';
}

/* ══════════════════════════════════════════
   VIEW SWITCHING
   ══════════════════════════════════════════ */
function setView(view) {
  currentView = view;
  if (viewToggle) {
    viewToggle.querySelectorAll('.cal-view-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === view);
    });
  }
  if (monthlyViewEl) monthlyViewEl.hidden = view !== 'monthly';
  if (weeklyViewEl) weeklyViewEl.hidden = view !== 'weekly';
  eventPage = 0;
  renderAll();
}

function jumpToToday() {
  currentYear = today.getFullYear();
  currentMonth = today.getMonth();
  weekOffset = 0;
  selectedDate = isoDate(today);
  eventPage = 0;
  renderAll();
}

/* ══════════════════════════════════════════
   FETCH / PERSIST EVENTS
   ══════════════════════════════════════════ */
async function fetchEvents() {
  try {
    const response = await fetch(`/api/events`, { credentials: 'include' });
    if (!response.ok) throw new Error('Failed to fetch');
    events = await response.json();
    saveLocal();
  } catch (err) {
    console.warn('[Calendar] API not reachable — using locally stored / seed events.');
    const stored = loadLocal();
    events = stored && stored.length ? stored : seedEvents();
    if (!stored) saveLocal();
  }
}

function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveLocal() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch { /* storage unavailable — non-fatal */ }
}

/* ══════════════════════════════════════════
   RENDER — DISPATCH
   ══════════════════════════════════════════ */
function renderAll() {
  updateAddButtonVisibility();
  if (currentView === 'monthly') {
    renderMonthly();
  } else {
    renderWeekly();
  }
  renderEventsList();
}

/* ══════════════════════════════════════════
   RENDER — MONTHLY GRID
   ══════════════════════════════════════════ */
function renderMonthly() {
  if (!calendarGrid || !calendarTitle) return;

  calendarTitle.textContent = `${MONTH_NAMES[currentMonth]} ${currentYear}`;
  calendarGrid.innerHTML = '';

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement('div');
    empty.className = 'calendar-cell calendar-cell--empty';
    calendarGrid.appendChild(empty);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = isoDate(new Date(currentYear, currentMonth, day));
    const dayEvents = eventsOn(dateStr);

    const cell = document.createElement('div');
    cell.className = 'calendar-cell';
    if (isSameDayStr(dateStr, isoDate(today))) cell.classList.add('calendar-cell--today');
    if (dayEvents.length) cell.classList.add('calendar-cell--has-event');
    if (dateStr === selectedDate) cell.classList.add('calendar-cell--selected');

    const relLabel = relativeDayLabel(dateStr);
    if (relLabel) cell.dataset.relative = relLabel;

    const numEl = document.createElement('span');
    numEl.className = 'calendar-day-num';
    numEl.textContent = String(day);
    cell.appendChild(numEl);

    dayEvents.slice(0, 2).forEach(ev => {
      const chip = document.createElement('span');
      chip.className = 'cal-event-chip';
      chip.textContent = ev.title;
      cell.appendChild(chip);
    });
    if (dayEvents.length > 2) {
      const more = document.createElement('span');
      more.className = 'cal-event-more';
      more.textContent = `+${dayEvents.length - 2} more`;
      cell.appendChild(more);
    }

    cell.addEventListener('click', () => selectDay(dateStr));
    calendarGrid.appendChild(cell);
  }
}

function shiftMonth(delta) {
  currentMonth += delta;
  if (currentMonth < 0) { currentMonth = 11; currentYear--; }
  if (currentMonth > 11) { currentMonth = 0; currentYear++; }
  selectedDate = null;
  eventPage = 0;
  renderAll();
}

/* ══════════════════════════════════════════
   RENDER — WEEKLY GRID
   ══════════════════════════════════════════ */
function getWeekStart() {
  const d = new Date(today);
  d.setDate(d.getDate() - d.getDay() + weekOffset * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

function renderWeekly() {
  if (!weekGrid || !weekTitle) return;

  const start = getWeekStart();
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  weekTitle.textContent =
    `${start.getDate()} ${MONTH_SHORT[start.getMonth()]} – ${end.getDate()} ${MONTH_SHORT[end.getMonth()]} ${end.getFullYear()}`;

  weekGrid.innerHTML = '';

  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const dateStr = isoDate(d);
    const dayEvents = eventsOn(dateStr);

    const col = document.createElement('div');
    col.className = 'week-day-col';
    if (isSameDayStr(dateStr, isoDate(today))) col.classList.add('calendar-cell--today');
    if (dateStr === selectedDate) col.classList.add('calendar-cell--selected');

    const relLabel = relativeDayLabel(dateStr);
    if (relLabel) col.dataset.relative = relLabel;

    col.innerHTML = `
      <div class="week-day-header">
        <span class="week-day-name">${DAY_SHORT[d.getDay()]}</span>
        <span class="week-day-num">${d.getDate()}</span>
      </div>
      <div class="week-day-events">
        ${dayEvents.length
          ? dayEvents.map(ev => `<span class="week-event-pill">${escapeHtml(ev.title)}</span>`).join('')
          : `<span class="week-no-events">No events</span>`}
      </div>
    `;

    col.addEventListener('click', () => selectDay(dateStr));
    weekGrid.appendChild(col);
  }
}

function shiftWeek(delta) {
  weekOffset += delta;
  selectedDate = null;
  eventPage = 0;
  renderAll();
}

/* ══════════════════════════════════════════
   DAY SELECTION (click a cell to filter the list)
   ══════════════════════════════════════════ */
function selectDay(dateStr) {
  const wasSelected = selectedDate === dateStr;
  selectedDate = wasSelected ? null : dateStr;
  eventPage = 0;
  if (currentView === 'monthly') renderMonthly(); else renderWeekly();
  renderEventsList();
  if (!wasSelected) openDayModal(dateStr);
}

/* ══════════════════════════════════════════
   DAY INFO MODAL (opens on clicking a day)
   ══════════════════════════════════════════ */
function openDayModal(dateStr) {
  if (!dayModal) return;
  dayModalDate = dateStr;

  const isAdmin = document.body.classList.contains('admin-mode');
  const dayEvents = eventsOn(dateStr).slice().sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

  if (dayModalTitle) dayModalTitle.textContent = formatReadable(dateStr);

  if (dayModalList) {
    dayModalList.innerHTML = '';
    if (!dayEvents.length) {
      const msg = document.createElement('p');
      msg.className = 'events-empty-msg';
      msg.textContent = 'No events on this day.';
      dayModalList.appendChild(msg);
    } else {
      dayEvents.forEach(ev => dayModalList.appendChild(buildEventCard(ev, isAdmin)));
    }
  }

  document.body.classList.add('modal-open');
  dayModal.style.display = 'flex';
}

function closeDayModal() {
  if (dayModal) dayModal.style.display = 'none';
  dayModalDate = null;
  document.body.classList.remove('modal-open');
}

/* ══════════════════════════════════════════
   RENDER — EVENTS LIST (paginated cards)
   ══════════════════════════════════════════ */
function eventsPerPage() {
  return window.innerWidth <= 640 ? 4 : 6;
}

function listSourceEvents() {
  if (selectedDate) {
    return eventsOn(selectedDate).slice().sort(sortByDate);
  }
  if (currentView === 'weekly') {
    const start = getWeekStart();
    const end = new Date(start); end.setDate(end.getDate() + 6);
    return events
      .filter(ev => {
        const d = new Date(ev.date + 'T00:00:00');
        return d >= start && d <= end;
      })
      .sort(sortByDate);
  }
  // monthly
  return events
    .filter(ev => {
      const d = new Date(ev.date + 'T00:00:00');
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    })
    .sort(sortByDate);
}

function sortByDate(a, b) {
  return a.date.localeCompare(b.date);
}

function renderEventsList() {
  if (!eventsList) return;

  if (eventsListTitle) {
    eventsListTitle.textContent = selectedDate
      ? `Events on ${formatReadable(selectedDate)}`
      : 'Upcoming Events';
  }

  const source = listSourceEvents();
  const perPage = eventsPerPage();
  const totalPages = Math.max(1, Math.ceil(source.length / perPage));
  if (eventPage >= totalPages) eventPage = totalPages - 1;
  if (eventPage < 0) eventPage = 0;

  const pageItems = source.slice(eventPage * perPage, (eventPage + 1) * perPage);
  const isAdmin = document.body.classList.contains('admin-mode');

  eventsList.innerHTML = '';

  if (!pageItems.length) {
    const msg = document.createElement('p');
    msg.className = 'events-empty-msg';
    msg.textContent = selectedDate
      ? 'No events on this day.'
      : 'No upcoming events. Check back soon!';
    eventsList.appendChild(msg);
  } else {
    pageItems.forEach(ev => eventsList.appendChild(buildEventCard(ev, isAdmin)));
  }

  renderPagination(totalPages);
}

function buildEventCard(ev, isAdmin) {
  const d = new Date(ev.date + 'T00:00:00');
  const card = document.createElement('div');
  card.className = 'event-item';
  card.dataset.id = ev.id;

  const protectedHoliday = ev.isHoliday && !ev.isCustom;

  card.innerHTML = `
    ${isAdmin ? `
      <div class="event-item-actions">
        <button class="event-item-action-btn edit" title="Edit event" type="button">✏️</button>
        <button class="event-item-action-btn remove" title="${protectedHoliday ? 'Public holidays cannot be deleted' : 'Delete event'}" type="button" ${protectedHoliday ? 'disabled' : ''}>✕</button>
      </div>` : ''}
    <div class="event-date-badge">
      <span class="event-day">${d.getDate()}</span>
      <span class="event-month">${MONTH_SHORT[d.getMonth()]}</span>
    </div>
    <div class="event-details">
      ${ev.isHoliday ? `<span class="event-holiday-badge">🏛 Public Holiday</span>` : ''}
      <h4 class="event-title">${escapeHtml(ev.title)}</h4>
      <p class="event-description">${escapeHtml(ev.description || '')}</p>
      ${!ev.allDay && (ev.startTime || ev.endTime)
        ? `<span class="event-time">🕐 ${ev.startTime || 'TBD'}${ev.endTime ? ' – ' + ev.endTime : ''}</span>`
        : (ev.allDay ? `<span class="event-time">All Day</span>` : '')}
    </div>
  `;

  if (isAdmin) {
    const editBtn = card.querySelector('.event-item-action-btn.edit');
    const removeBtn = card.querySelector('.event-item-action-btn.remove');
    if (editBtn) editBtn.addEventListener('click', (e) => { e.stopPropagation(); openEventModal(ev); });
    if (removeBtn) removeBtn.addEventListener('click', (e) => { e.stopPropagation(); handleDeleteEvent(ev.id, protectedHoliday); });
  }

  card.addEventListener('click', () => {
    selectedDate = ev.date;
    eventPage = 0;
    if (currentView === 'monthly') {
      currentMonth = d.getMonth();
      currentYear = d.getFullYear();
      renderMonthly();
    } else {
      weekOffset = Math.round((startOfWeek(d) - startOfWeek(today)) / (7 * 86400000));
      renderWeekly();
    }
    renderEventsList();
  });

  return card;
}

function startOfWeek(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function renderPagination(totalPages) {
  if (!paginationControls) return;
  if (totalPages <= 1) {
    paginationControls.hidden = true;
    return;
  }
  paginationControls.hidden = false;

  if (pagePrevBtn) pagePrevBtn.disabled = eventPage === 0;
  if (pageNextBtn) pageNextBtn.disabled = eventPage >= totalPages - 1;
  if (pageIndicatorEl) pageIndicatorEl.textContent = `${eventPage + 1} / ${totalPages}`;

  if (pageDotsEl) {
    pageDotsEl.innerHTML = '';
    for (let p = 0; p < totalPages; p++) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'page-dot' + (p === eventPage ? ' active' : '');
      dot.addEventListener('click', () => { eventPage = p; renderEventsList(); });
      pageDotsEl.appendChild(dot);
    }
  }
}

/* ══════════════════════════════════════════
   ADMIN: ADD / EDIT / DELETE
   ══════════════════════════════════════════ */
function openEventModal(ev = null, prefillDate = null) {
  if (!eventModal) return;
  if (!document.body.classList.contains('admin-mode')) return;

  closeDayModal(); // avoid stacking the day-info modal underneath the edit form

  if (ev) {
    eventModalHeading.textContent = '✏️ Edit Event';
    eventModalId.value = ev.id;
    eventModalTitle.value = ev.title;
    eventModalDesc.value = ev.description || '';
    eventModalDate.value = ev.date;
    eventModalStart.value = ev.startTime || '';
    eventModalEnd.value = ev.endTime || '';
    eventModalAllDay.checked = !!ev.allDay;
    eventModalHoliday.checked = !!ev.isHoliday;
  } else {
    eventModalHeading.textContent = '＋ New Event';
    eventModalId.value = '';
    eventModalTitle.value = '';
    eventModalDesc.value = '';
    eventModalDate.value = prefillDate || isoDate(today);
    eventModalStart.value = '';
    eventModalEnd.value = '';
    eventModalAllDay.checked = false;
    eventModalHoliday.checked = false;
  }

  document.body.classList.add('modal-open');
  eventModal.style.display = 'flex';
}

function closeEventModal() {
  if (eventModal) eventModal.style.display = 'none';
  document.body.classList.remove('modal-open');
}

async function saveEvent() {
  const id = eventModalId.value;
  const title = eventModalTitle.value.trim();
  const date = eventModalDate.value;
  const description = eventModalDesc.value.trim();
  const startTime = eventModalStart.value.trim();
  const endTime = eventModalEnd.value.trim();
  const allDay = eventModalAllDay.checked;
  const isHoliday = eventModalHoliday.checked;

  if (!title || !date) {
    alert('Title and date are required.');
    return;
  }

  const payload = { title, description, date, startTime, endTime, allDay, isHoliday };

  try {
    const token = localStorage.getItem('adminToken');
    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/events/${id}` : '/api/events';
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Save failed');
    const saved = await response.json();
    applySavedEvent(id, saved, payload);
  } catch (err) {
    console.warn('[Calendar] Backend not reachable — saving locally.');
    applySavedEvent(id, null, payload);
  }

  saveLocal();
  closeEventModal();
  selectedDate = date;
  currentMonth = new Date(date + 'T00:00:00').getMonth();
  currentYear = new Date(date + 'T00:00:00').getFullYear();
  renderAll();
  showToast(id ? 'Event updated successfully' : 'Event added successfully');
}

function applySavedEvent(id, serverEvent, payload) {
  if (id) {
    const idx = events.findIndex(e => String(e.id) === String(id));
    if (idx !== -1) {
      events[idx] = {
        ...events[idx],
        ...payload,
        id: events[idx].id,
        isCustom: events[idx].isCustom !== false // preserve ownership flag
      };
    }
  } else {
    events.push({
      id: (serverEvent && serverEvent.id) || Date.now(),
      ...payload,
      isCustom: true
    });
  }
}

function handleDeleteEvent(id, isProtected) {
  if (isProtected) {
    alert('Public holidays are protected and cannot be deleted. You may edit them instead.');
    return;
  }
  if (!confirm('Are you sure you want to delete this event?')) return;
  deleteEvent(id);
}

async function deleteEvent(id) {
  try {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(`/api/events/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!response.ok) throw new Error('Delete failed');
  } catch (err) {
    console.warn('[Calendar] Backend not reachable — removing locally only.');
  }
  events = events.filter(e => String(e.id) !== String(id));
  saveLocal();
  renderAll();
  showToast('Event deleted successfully');
}

/* ══════════════════════════════════════════
   TIME INPUT MASK (HH:MM, digits only)
   ══════════════════════════════════════════ */
function formatTimeInput(input) {
  let raw = input.value.replace(/[^0-9]/g, '');
  if (raw.length >= 3) raw = raw.slice(0, 2) + ':' + raw.slice(2, 4);
  if (raw.length >= 2) {
    const hh = parseInt(raw.slice(0, 2), 10);
    if (hh > 23) raw = '23' + raw.slice(2);
  }
  if (raw.length === 5) {
    const mm = parseInt(raw.slice(3, 5), 10);
    if (mm > 59) raw = raw.slice(0, 3) + '59';
  }
  input.value = raw;
}

/* ══════════════════════════════════════════
   TOAST
   ══════════════════════════════════════════ */
let toastTimer = null;
function showToast(message, type = 'success') {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.className = type === 'error' ? 'error show' : 'show';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastEl.className = ''; }, 3000);
}

/* ══════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════ */
function pad(n) { return String(n).padStart(2, '0'); }

function isoDate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function isSameDayStr(a, b) { return a === b; }

// Returns 'Today' / 'Tomorrow' / 'Yesterday' for a date one day either side
// of today, otherwise null (so the hover tooltip only shows on those three).
function relativeDayLabel(dateStr) {
  const diffDays = Math.round(
    (new Date(dateStr + 'T00:00:00') - new Date(isoDate(today) + 'T00:00:00')) / 86400000
  );
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  return null;
}

function eventsOn(dateStr) {
  return events.filter(e => e.date === dateStr);
}

function formatReadable(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

// Exposed for any inline handlers left over from the previous markup.
window.editEvent = (id) => {
  const ev = events.find(e => String(e.id) === String(id));
  if (ev) openEventModal(ev);
};
window.deleteEvent = deleteEvent;