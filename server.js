import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import session from 'express-session';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import { loadDb, saveDb } from './db-json.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());
app.set('trust proxy', 1);
app.use(session({
  secret: 'edendale-secret-key-xyz',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    sameSite: 'none',
    partitioned: true
  }
}));


const adminTokens = new Set();

function checkIsAdmin(req) {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    const token = auth.split(' ')[1];
    if (adminTokens.has(token)) return true;
  }
  if (req.session && req.session.admin) return true;
  return false;
}

// API Routes
app.post('/api/admin/login', async (req, res) => {
  try {
    const db = await loadDb();
    const { username, password } = req.body;
    const user = db.admin_users.find(u => u.username === username);
    if (user && await bcrypt.compare(password, user.password_hash)) {
      req.session.admin = true;
      const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
      adminTokens.add(token);
      req.session.save((err) => {
        res.json({ success: true, token });
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/status', (req, res) => {
  res.json({ admin: checkIsAdmin(req) });
});


app.post('/api/admin/change-password', async (req, res) => {
  if (!checkIsAdmin(req)) return res.status(403).json({ error: 'Unauthorized' });
  try {
    const { newPassword } = req.body;
    if (!newPassword) return res.status(400).json({ error: 'Password required' });
    if (newPassword.length < 12) return res.status(400).json({ error: 'Password must be at least 12 characters' });
    if (!/[A-Z]/.test(newPassword)) return res.status(400).json({ error: 'Password must contain at least one capital letter' });
    if (!/[0-9]/.test(newPassword)) return res.status(400).json({ error: 'Password must contain at least one digit' });
    if (!/[^A-Za-z0-9]/.test(newPassword)) return res.status(400).json({ error: 'Password must contain at least one special character' });
    
    const db = await loadDb();
    // In our case we just update all admin_users or the first one. Let's update all for simplicity since there's only 1.
    if (db.admin_users.length > 0) {
      const isSame = await bcrypt.compare(newPassword, db.admin_users[0].password_hash);
      if (isSame) return res.status(400).json({ error: 'New password must be different from the existing password' });

      const hash = await bcrypt.hash(newPassword, 10);
      db.admin_users.forEach(u => u.password_hash = hash);
      await saveDb();
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/logout', (req, res) => {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    adminTokens.delete(auth.split(' ')[1]);
  }
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/content', async (req, res) => {
  try {
    const db = await loadDb();
    const page = req.query.page;
    if (!page) return res.status(400).json({ error: 'Page required' });
    
    const pageContent = db.content.filter(c => c.page === page);
    const contentMap = {};
    pageContent.forEach(c => {
      if (c.field_name === 'card_structure') {
        contentMap[c.field_name] = JSON.parse(c.value);
      } else {
        contentMap[c.field_name] = c.value;
      }
    });
    res.json(contentMap);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/content', async (req, res) => {
  if (!checkIsAdmin(req)) return res.status(403).json({ error: 'Unauthorized' });
  try {
    const db = await loadDb();
    const { page, changes, cardData } = req.body;
    if (!page) return res.status(400).json({ error: 'Invalid payload' });
    
    // Handle individual field changes
    if (changes) {
      for (const [field_name, value] of Object.entries(changes)) {
        const existing = db.content.find(c => c.page === page && c.field_name === field_name);
        if (existing) {
          existing.value = value;
        } else {
          db.content.push({
            id: db.content.length > 0 ? Math.max(...db.content.map(c => c.id)) + 1 : 1,
            page,
            field_name,
            value,
            type: 'text'
          });
        }
      }
    }
    
    // Handle card data for about page and home page
    if (cardData && (page === 'about' || page === 'home')) {
      // Store card data as a special field
      const cardField = db.content.find(c => c.page === page && c.field_name === 'card_structure');
      if (cardField) {
        cardField.value = JSON.stringify(cardData);
      } else {
        db.content.push({
          id: db.content.length > 0 ? Math.max(...db.content.map(c => c.id)) + 1 : 1,
          page,
          field_name: 'card_structure',
          value: JSON.stringify(cardData),
          type: 'json'
        });
      }
    }
    
    await saveDb();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/events', async (req, res) => {
  try {
    const db = await loadDb();
    const { year, month } = req.query;
    let events = db.events;
    if (year && month) {
      const prefix = `${year}-${String(month).padStart(2, '0')}`;
      events = events.filter(e => e.event_date.startsWith(prefix));
    }
    events = events.map(e => ({
      id: e.id,
      title: e.title,
      date: e.event_date,
      startTime: e.start_time || e.event_time || '',
      endTime: e.end_time || '',
      allDay: !!e.all_day,
      isHoliday: !!e.is_holiday,
      isCustom: e.is_custom !== false,
      description: e.description || ''
    }));
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/events', async (req, res) => {
  if (!checkIsAdmin(req)) return res.status(403).json({ error: 'Unauthorized' });
  try {
    const db = await loadDb();
    const { title, date, startTime, endTime, allDay, isHoliday, description } = req.body;
    if (!title || !date) return res.status(400).json({ error: 'title and date are required' });
    const newEvent = {
      id: db.events.length > 0 ? Math.max(...db.events.map(e => e.id)) + 1 : 1,
      title,
      event_date: date,
      start_time: startTime || '',
      end_time: endTime || '',
      all_day: !!allDay,
      is_holiday: !!isHoliday,
      is_custom: true,
      description: description || ''
    };
    db.events.push(newEvent);
    await saveDb();
    res.status(201).json({
      id: newEvent.id, title: newEvent.title, date: newEvent.event_date,
      startTime: newEvent.start_time, endTime: newEvent.end_time,
      allDay: newEvent.all_day, isHoliday: newEvent.is_holiday,
      isCustom: newEvent.is_custom, description: newEvent.description
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/events/:id', async (req, res) => {
  if (!checkIsAdmin(req)) return res.status(403).json({ error: 'Unauthorized' });
  try {
    const db = await loadDb();
    const id = parseInt(req.params.id, 10);
    const { title, date, startTime, endTime, allDay, isHoliday, description } = req.body;

    const event = db.events.find(e => e.id === id);
    if (!event) return res.status(404).json({ error: 'Not found' });

    if (title !== undefined) event.title = title;
    if (date !== undefined) event.event_date = date;
    if (startTime !== undefined) event.start_time = startTime;
    if (endTime !== undefined) event.end_time = endTime;
    if (allDay !== undefined) event.all_day = !!allDay;
    if (isHoliday !== undefined) event.is_holiday = !!isHoliday;
    if (description !== undefined) event.description = description;

    await saveDb();
    res.json({
      id: event.id, title: event.title, date: event.event_date,
      startTime: event.start_time, endTime: event.end_time,
      allDay: event.all_day, isHoliday: event.is_holiday,
      isCustom: event.is_custom, description: event.description
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/events/:id', async (req, res) => {
  if (!checkIsAdmin(req)) return res.status(403).json({ error: 'Unauthorized' });
  try {
    const db = await loadDb();
    const id = parseInt(req.params.id, 10);
    db.events = db.events.filter(e => e.id !== id);
    await saveDb();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sections the frontend knows how to render. Anything else is rejected.
const VALID_SECTIONS = new Set(['extracurricular', 'cocurricular', 'activities', 'gallery']);

const MAX_TITLE_LENGTH = 200;
const MAX_ICON_LENGTH = 16;
const MAX_IMAGE_URL_LENGTH = 255;

// Field-length and per-section shape checks.
// Returns an error message, or null when the card is valid.
function validateCard(card) {
  if (card.title.length > MAX_TITLE_LENGTH) {
    return `Title must be ${MAX_TITLE_LENGTH} characters or fewer.`;
  }
  if (card.icon && card.icon.length > MAX_ICON_LENGTH) {
    return `Icon must be ${MAX_ICON_LENGTH} characters or fewer.`;
  }
  if (card.imageUrl && card.imageUrl.length > MAX_IMAGE_URL_LENGTH) {
    return `Image URL must be ${MAX_IMAGE_URL_LENGTH} characters or fewer.`;
  }
  // A gallery item with no picture would render as an empty tile.
  if (card.section === 'gallery' && !card.imageUrl) {
    return 'Gallery items need an image.';
  }
  return null;
}

// Reads a trimmed string field, or '' when absent or null.
function cardString(body, key) {
  const value = body[key];
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function emptyToNull(value) {
  return value === '' ? null : value;
}

// Stands in for the schema's uq_page_section_title unique key.
function duplicateTitleExists(db, card, ignoreId) {
  return db.cards.some(c =>
    c.id !== ignoreId &&
    c.page === card.page &&
    c.section === card.section &&
    c.title.toLowerCase() === card.title.toLowerCase()
  );
}

app.get('/api/cards', async (req, res) => {
  try {
    const db = await loadDb();
    const { page, section } = req.query;
    if (!page) return res.status(400).json({ error: "Missing 'page' query parameter." });

    let cards = db.cards.filter(c => c.page === String(page).trim().toLowerCase());
    if (section) {
      cards = cards.filter(c => c.section === String(section).trim().toLowerCase());
    }
    cards.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    res.json(cards);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/cards', async (req, res) => {
  if (!checkIsAdmin(req)) return res.status(401).json({ error: 'Unauthorised.' });
  try {
    const db = await loadDb();
    const page = cardString(req.body, 'page').toLowerCase();
    const section = cardString(req.body, 'section').toLowerCase();
    const title = cardString(req.body, 'title');

    if (!page || !section || !title) {
      return res.status(400).json({ error: 'page, section and title are required.' });
    }
    if (!VALID_SECTIONS.has(section)) {
      return res.status(400).json({ error: `Unknown section '${section}'.` });
    }

    const card = {
      id: db.cards.length > 0 ? Math.max(...db.cards.map(c => c.id)) + 1 : 1,
      page,
      section,
      icon: emptyToNull(cardString(req.body, 'icon')),
      title,
      body: emptyToNull(cardString(req.body, 'body')),
      imageUrl: emptyToNull(cardString(req.body, 'imageUrl')),
      // Append to the end of its section.
      sortOrder: db.cards.filter(c => c.page === page && c.section === section).length + 1
    };

    const invalid = validateCard(card);
    if (invalid) return res.status(400).json({ error: invalid });

    if (duplicateTitleExists(db, card, null)) {
      return res.status(409).json({
        error: `A card titled "${card.title}" already exists in this section.`
      });
    }

    db.cards.push(card);
    await saveDb();
    res.status(201).json(card);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/cards/:id', async (req, res) => {
  if (!checkIsAdmin(req)) return res.status(401).json({ error: 'Unauthorised.' });
  try {
    const db = await loadDb();
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Missing card ID in path.' });

    // page and section are fixed at creation, so an update only touches the
    // display fields.
    const existing = db.cards.find(c => c.id === id);
    if (!existing) return res.status(404).json({ error: 'Card not found.' });

    const updated = { ...existing };
    if ('title' in req.body) updated.title = cardString(req.body, 'title');
    if ('icon' in req.body) updated.icon = emptyToNull(cardString(req.body, 'icon'));
    if ('body' in req.body) updated.body = emptyToNull(cardString(req.body, 'body'));
    if ('imageUrl' in req.body) updated.imageUrl = emptyToNull(cardString(req.body, 'imageUrl'));
    if ('sortOrder' in req.body) {
      const order = Number(req.body.sortOrder);
      if (!Number.isFinite(order)) {
        return res.status(400).json({ error: 'sortOrder must be a number.' });
      }
      updated.sortOrder = order;
    }

    if (!updated.title) return res.status(400).json({ error: 'title cannot be empty.' });

    const invalid = validateCard(updated);
    if (invalid) return res.status(400).json({ error: invalid });

    if (duplicateTitleExists(db, updated, id)) {
      return res.status(409).json({
        error: 'Another card in this section already uses that title.'
      });
    }

    Object.assign(existing, updated);
    await saveDb();
    res.json(existing);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/cards/:id', async (req, res) => {
  if (!checkIsAdmin(req)) return res.status(401).json({ error: 'Unauthorised.' });
  try {
    const db = await loadDb();
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Missing card ID in path.' });

    const index = db.cards.findIndex(c => c.id === id);
    if (index === -1) return res.status(404).json({ error: 'Card not found.' });

    db.cards.splice(index, 1);
    await saveDb();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Image uploads ───────────────────────────────────────────────────────────
// Files land in public/assets/images/uploads and are served by the static
// middleware below, so an uploaded image needs no special route to display.
const UPLOAD_DIR = path.join(__dirname, 'public', 'assets', 'images', 'uploads');
const PUBLIC_UPLOAD_PREFIX = '/assets/images/uploads';
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const EXTENSION_BY_MIME = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg'
};

class UnsupportedImageError extends Error {}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      fs.mkdir(UPLOAD_DIR, { recursive: true }, err => cb(err, UPLOAD_DIR));
    },
    // Never reuse the client's filename — it can contain path traversal
    // ("../../") or collide with an existing upload.
    filename: (req, file, cb) => {
      const ext = EXTENSION_BY_MIME[file.mimetype.toLowerCase()];
      cb(null, crypto.randomUUID().replace(/-/g, '') + '.' + ext);
    }
  }),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
  // An allowlist, not a blocklist.
  fileFilter: (req, file, cb) => {
    if (EXTENSION_BY_MIME[file.mimetype.toLowerCase()]) return cb(null, true);
    cb(new UnsupportedImageError());
  }
});

app.post('/api/upload', (req, res) => {
  if (!checkIsAdmin(req)) return res.status(401).json({ error: 'Unauthorised.' });

  upload.single('file')(req, res, err => {
    if (err instanceof UnsupportedImageError) {
      return res.status(415).json({ error: 'Unsupported image type. Use JPG, PNG, WEBP, GIF or SVG.' });
    }
    if (err && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'That image is too large. The limit is 5MB.' });
    }
    if (err) return res.status(400).json({ error: 'Expected a multipart/form-data upload.' });
    if (!req.file) return res.status(400).json({ error: 'No file was uploaded.' });

    res.status(201).json({
      url: `${PUBLIC_UPLOAD_PREFIX}/${req.file.filename}`,
      filename: req.file.filename,
      size: req.file.size
    });
  });
});

const staticPath = path.join(__dirname, 'public');
app.use(express.static(staticPath, {
  etag: false,
  lastModified: false,
  setHeaders: (res, path) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

// For SPA routing if there is any, fallback to pages folder or index
// but since this is static HTML pages, it should be fine.
app.get('*', (req, res) => {
  const filePath = path.join(staticPath, req.path);
  // Simple fallback just in case
  res.sendFile(path.join(staticPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
