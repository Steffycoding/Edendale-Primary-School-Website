/**
 * calendar.js — Events Calendar Logic
 * Edendale Primary School Website
 *
 * Responsibilities:
 *  - Render a monthly calendar grid
 *  - Load events from Java backend via AJAX
 *  - Highlight event days on the calendar
 *  - Render event list for the current month
 *  - Admin: Add / Edit / Delete events (when in admin mode)
 */

'use strict';

/* ══════════════════════════════════════════
   STATE
   ══════════════════════════════════════════ */
let currentYear  = new Date().getFullYear();
let currentMonth = new Date().getMonth(); // 0-indexed
let events = []; // Array of { id, title, date (YYYY-MM-DD), time, description }

/* ══════════════════════════════════════════
   ELEMENT REFERENCES
   ══════════════════════════════════════════ */
const calendarGrid      = document.getElementById('calendar-grid');
const calendarTitle     = document.getElementById('calendar-month-title');
const eventsList        = document.getElementById('events-list');
const prevMonthBtn      = document.getElementById('prev-month');
const nextMonthBtn      = document.getElementById('next-month');
const addEventBtn       = document.getElementById('add-event-btn');
const eventModal        = document.getElementById('event-modal');
const eventModalSave    = document.getElementById('event-modal-save');
const eventModalCancel  = document.getElementById('event-modal-cancel');
const eventModalTitle   = document.getElementById('event-modal-title');
const eventModalDate    = document.getElementById('event-modal-date');
const eventModalTime    = document.getElementById('event-modal-time');
const eventModalDesc    = document.getElementById('event-modal-desc');
const eventModalId      = document.getElementById('event-modal-id');

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

/* ══════════════════════════════════════════
   INIT
   ══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  fetchEvents().then(() => {
    renderCalendar(currentYear, currentMonth);
    renderEventList(currentYear, currentMonth);
  });

  if (prevMonthBtn) prevMonthBtn.addEventListener('click', goToPrevMonth);
  if (nextMonthBtn) nextMonthBtn.addEventListener('click', goToNextMonth);
  if (addEventBtn)  addEventBtn.addEventListener('click', () => openEventModal());
  if (eventModalSave)   eventModalSave.addEventListener('click', saveEvent);
  if (eventModalCancel) eventModalCancel.addEventListener('click', closeEventModal);
});

/* ══════════════════════════════════════════
   FETCH EVENTS FROM BACKEND
   ══════════════════════════════════════════ */
async function fetchEvents() {
  try {
    // TODO: Update to your Java Servlet endpoint
    const response = await fetch(`/api/events?year=${currentYear}&month=${currentMonth + 1}`);
    if (!response.ok) throw new Error('Failed to fetch');
    events = await response.json();
  } catch (err) {
    console.warn('[Calendar] Using placeholder events:', err.message);
    // ── PLACEHOLDER DATA — remove once backend is connected ──
    events = [
      { id: 1, title: 'Term 2 Begins',    date: `${currentYear}-${pad(currentMonth+1)}-07`, time: '07:30', description: 'Start of second school term.' },
      { id: 2, title: 'Parents Meeting',  date: `${currentYear}-${pad(currentMonth+1)}-15`, time: '14:00', description: 'Parent-teacher interviews.' },
      { id: 3, title: 'Sports Day',       date: `${currentYear}-${pad(currentMonth+1)}-22`, time: '09:00', description: 'Annual inter-grade sports day.' },
    ];
  }
}

/* ══════════════════════════════════════════
   RENDER CALENDAR GRID
   ══════════════════════════════════════════ */
function renderCalendar(year, month) {
  if (!calendarGrid || !calendarTitle) return;

  calendarTitle.textContent = `${MONTH_NAMES[month]} ${year}`;
  calendarGrid.innerHTML = '';

  const firstDay  = new Date(year, month, 1).getDay();  // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Event dates set for quick lookup
  const eventDates = new Set(
    events
      .filter(e => {
        const d = new Date(e.date);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .map(e => new Date(e.date).getDate())
  );

  const today = new Date();

  // Empty cells before the 1st
  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement('div');
    empty.className = 'calendar-cell calendar-cell--empty';
    calendarGrid.appendChild(empty);
  }

  // Day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const cell = document.createElement('div');
    cell.className = 'calendar-cell';

    const isToday = (
      today.getFullYear() === year &&
      today.getMonth()    === month &&
      today.getDate()     === day
    );
    if (isToday) cell.classList.add('calendar-cell--today');
    if (eventDates.has(day)) cell.classList.add('calendar-cell--has-event');

    cell.innerHTML = `<span class="calendar-day-num">${day}</span>`;

    // Click to filter event list to this day
    cell.addEventListener('click', () => renderEventList(year, month, day));

    calendarGrid.appendChild(cell);
  }
}

/* ══════════════════════════════════════════
   RENDER EVENT LIST
   ══════════════════════════════════════════ */
function renderEventList(year, month, filterDay = null) {
  if (!eventsList) return;

  const filtered = events.filter(ev => {
    const d = new Date(ev.date);
    return (
      d.getFullYear() === year &&
      d.getMonth()    === month &&
      (filterDay === null || d.getDate() === filterDay)
    );
  });

  if (filtered.length === 0) {
    eventsList.innerHTML = '<p class="events-empty-msg">No events for this period.</p>';
    return;
  }

  eventsList.innerHTML = filtered.map(ev => {
    const d = new Date(ev.date);
    const isAdmin = document.body.classList.contains('admin-mode');
    return `
      <div class="event-item" data-id="${ev.id}">
        <div class="event-date-badge">
          <span class="event-day">${d.getDate()}</span>
          <span class="event-month">${MONTH_NAMES[d.getMonth()].slice(0,3)}</span>
        </div>
        <div class="event-details">
          <h4 class="event-title">${ev.title}</h4>
          <p class="event-description">${ev.description || ''}</p>
          ${ev.time ? `<span class="event-time">🕐 ${ev.time}</span>` : ''}
        </div>
        ${isAdmin ? `
          <div class="event-actions">
            <button class="btn btn-outline" onclick="editEvent(${ev.id})" style="font-size:0.75rem; padding:4px 10px;">Edit</button>
            <button class="btn btn-outline" onclick="deleteEvent(${ev.id})" style="font-size:0.75rem; padding:4px 10px; color:red; border-color:red;">Delete</button>
          </div>` : ''}
      </div>
    `;
  }).join('');
}

/* ══════════════════════════════════════════
   NAVIGATION
   ══════════════════════════════════════════ */
function goToPrevMonth() {
  currentMonth--;
  if (currentMonth < 0) { currentMonth = 11; currentYear--; }
  fetchEvents().then(() => {
    renderCalendar(currentYear, currentMonth);
    renderEventList(currentYear, currentMonth);
  });
}

function goToNextMonth() {
  currentMonth++;
  if (currentMonth > 11) { currentMonth = 0; currentYear++; }
  fetchEvents().then(() => {
    renderCalendar(currentYear, currentMonth);
    renderEventList(currentYear, currentMonth);
  });
}

/* ══════════════════════════════════════════
   ADMIN: ADD / EDIT / DELETE EVENTS
   ══════════════════════════════════════════ */
function openEventModal(evId = null) {
  if (!eventModal) return;

  if (evId) {
    const ev = events.find(e => e.id === evId);
    if (!ev) return;
    eventModalId.value    = ev.id;
    eventModalTitle.value = ev.title;
    eventModalDate.value  = ev.date;
    eventModalTime.value  = ev.time || '';
    eventModalDesc.value  = ev.description || '';
  } else {
    eventModalId.value    = '';
    eventModalTitle.value = '';
    eventModalDate.value  = '';
    eventModalTime.value  = '';
    eventModalDesc.value  = '';
  }

  eventModal.style.display = 'flex';
}

function closeEventModal() {
  if (eventModal) eventModal.style.display = 'none';
}

async function saveEvent() {
  const id    = eventModalId.value;
  const title = eventModalTitle.value.trim();
  const date  = eventModalDate.value;
  const time  = eventModalTime.value.trim();
  const desc  = eventModalDesc.value.trim();

  if (!title || !date) {
    alert('Title and date are required.');
    return;
  }

  const payload = { title, date, time, description: desc };
  const method  = id ? 'PUT' : 'POST';
  const url     = id ? `/api/events/${id}` : '/api/events';

  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Save failed');
    closeEventModal();
    await fetchEvents();
    renderCalendar(currentYear, currentMonth);
    renderEventList(currentYear, currentMonth);
  } catch (err) {
    // DEV fallback
    console.warn('[Calendar] Backend not reachable — updating local state only.');
    if (id) {
      const idx = events.findIndex(e => e.id == id);
      if (idx !== -1) events[idx] = { id: Number(id), ...payload };
    } else {
      events.push({ id: Date.now(), ...payload });
    }
    closeEventModal();
    renderCalendar(currentYear, currentMonth);
    renderEventList(currentYear, currentMonth);
  }
}

function editEvent(id) {
  openEventModal(id);
}

async function deleteEvent(id) {
  if (!confirm('Delete this event?')) return;
  try {
    const response = await fetch(`/api/events/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Delete failed');
  } catch (err) {
    console.warn('[Calendar] Backend not reachable — removing from local state only.');
  }
  events = events.filter(e => e.id !== id);
  renderCalendar(currentYear, currentMonth);
  renderEventList(currentYear, currentMonth);
}

/* ══════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════ */
function pad(n) {
  return String(n).padStart(2, '0');
}
