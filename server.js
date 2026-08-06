import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import bcrypt from 'bcryptjs';
import { loadDb, saveDb } from './Edendale-Primary-School-main/edendale/src/main/webapp/js/db-json.js';
import log from './Edendale-Primary-School-main/edendale/src/main/webapp/js/log.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(session({
  secret: process.env.SECRETE_KEY || 'default_secret',
  resave: false,
  saveUninitialized: false,
}));

// API Routes
app.post('/api/admin/login', async (req, res) => {
  try {
    const db = await loadDb();
    const { username, password } = req.body;
    const user = db.admin_users.find(u => u.username === username);
    if (user && await bcrypt.compare(password, user.password_hash)) {
      req.session.admin = true;
      res.json({ success: true });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/content', async (req, res) => {
  try {
    const db = await loadDb();
    const page = req.query.page;
    if (!page) return res.status(400).json({ error: 'Page is required' });
    
    const rows = db.content.filter(c => c.page === page);
    const contentMap = {};
    rows.forEach(row => {
      contentMap[row.field_name] = row.value;
    });
    res.json(contentMap);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/content', async (req, res) => {
  if (!req.session.admin) return res.status(403).json({ error: 'Unauthorized' });
  try {
    const db = await loadDb();
    const { page, changes } = req.body;
    if (!page || !changes) return res.status(400).json({ error: 'Invalid payload' });
    
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
    // Transform keys
    events = events.map(e => ({
      id: e.id,
      title: e.title,
      date: e.event_date,
      time: e.event_time,
      description: e.description
    }));
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/events', async (req, res) => {
  if (!req.session.admin) return res.status(403).json({ error: 'Unauthorized' });
  try {
    const db = await loadDb();
    const { title, date, time, description } = req.body;
    const newEvent = {
      id: db.events.length > 0 ? Math.max(...db.events.map(e => e.id)) + 1 : 1,
      title,
      event_date: date,
      event_time: time,
      description
    };
    db.events.push(newEvent);
    await saveDb();
    res.json({ id: newEvent.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/events/:id', async (req, res) => {
  if (!req.session.admin) return res.status(403).json({ error: 'Unauthorized' });
  try {
    const db = await loadDb();
    const id = parseInt(req.params.id, 10);
    const { title, date, time, description } = req.body;
    
    const event = db.events.find(e => e.id === id);
    if (!event) return res.status(404).json({ error: 'Not found' });

    event.title = title;
    event.event_date = date;
    event.event_time = time;
    event.description = description;

    await saveDb();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/events/:id', async (req, res) => {
  if (!req.session.admin) return res.status(403).json({ error: 'Unauthorized' });
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

const staticPath = path.join(__dirname, 'Edendale-Primary-School-main', 'edendale', 'src', 'main', 'webapp');
app.use(express.static(staticPath));

// For SPA routing if there is any, fallback to pages folder or index
// but since this is static HTML pages, it should be fine.
app.get('*', (req, res) => {
  const filePath = path.join(staticPath, req.path);
  // Simple fallback just in case
  res.sendFile(path.join(staticPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {

    log.info(`Server running on port ${PORT}`);
    console.log(`Server running on port ${PORT}`);
});
