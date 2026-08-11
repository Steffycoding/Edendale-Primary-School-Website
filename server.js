import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
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
  if (!checkIsAdmin(req)) return res.status(403).json({ error: 'Unauthorized' });
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
  if (!checkIsAdmin(req)) return res.status(403).json({ error: 'Unauthorized' });
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
  if (!checkIsAdmin(req)) return res.status(403).json({ error: 'Unauthorized' });
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

const staticPath = path.join(__dirname, 'public');
app.use(express.static(staticPath));

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
