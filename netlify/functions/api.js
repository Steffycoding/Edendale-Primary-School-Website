import bcrypt from 'bcryptjs';

// Token storage using Netlify Blobs
async function addToken(token) {
  const { getStore } = await import('@netlify/blobs');
  const store = getStore('edendale-auth');
  await store.set(`token_${token}`, Date.now().toString());
}

async function removeToken(token) {
  const { getStore } = await import('@netlify/blobs');
  const store = getStore('edendale-auth');
  await store.delete(`token_${token}`);
}

async function checkIsAdmin(auth) {
  if (auth && auth.startsWith('Bearer ')) {
    const token = auth.split(' ')[1];
    const { getStore } = await import('@netlify/blobs');
    const store = getStore('edendale-auth');
    const exists = await store.get(`token_${token}`);
    return !!exists;
  }
  return false;
}

// Database functions using Netlify Blobs
async function loadDb() {
  try {
    const { getStore } = await import('@netlify/blobs');
    const store = getStore('edendale-db');
    
    const existing = await store.get('db', { type: 'json' });
    if (existing) {
      console.log('DB loaded from blobs');
      return existing;
    }
    
    console.log('Seeding initial database');
    // Seed data
    const seedData = {
      admin_users: [
        { id: 1, username: 'admin', password_hash: '$2b$10$usR4aXGduQt.YYYivDD36O/qMtTXrVlvTIKrvl6RwPr4e7pwSZQ2S' }
      ],
      content: [
        { id: 1, page: 'admin-login', field_name: 'hero_title', value: 'Admin Login', type: 'text' }
      ],
      events: [],
      cards: []
    };
    
    await store.setJSON('db', seedData);
    console.log('Database seeded successfully');
    return seedData;
  } catch (error) {
    console.error('Error loading database:', error);
    throw error;
  }
}

async function saveDb(data) {
  const { getStore } = await import('@netlify/blobs');
  const store = getStore('edendale-db');
  await store.setJSON('db', data);
}

// API Routes
export async function handler(event, context) {
  const path = event.path;
  const method = event.httpMethod;
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
  };

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    console.log('Request:', method, path);
    console.log('Raw path:', event.rawPath);
    console.log('Query params:', event.queryStringParameters);
    
    // Extract the actual API path from the request
    const apiPath = path.startsWith('/.netlify/functions') ? event.rawUrl?.split('/api')[1] ? '/api' + event.rawUrl.split('/api')[1] : path : path;
    console.log('API Path:', apiPath);
    
    // Admin login
    if ((apiPath === '/api/admin/login' || path === '/api/admin/login') && method === 'POST') {
      console.log('Processing admin login');
      const body = JSON.parse(event.body);
      const { username, password } = body;
      
      const db = await loadDb();
      console.log('DB loaded, users:', db.admin_users.length);
      const user = db.admin_users.find(u => u.username === username);
      console.log('User found:', !!user);
      
      if (user && await bcrypt.compare(password, user.password_hash)) {
        const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
        await addToken(token);
        console.log('Login successful');
        return { statusCode: 200, headers, body: JSON.stringify({ success: true, token }) };
      } else {
        console.log('Invalid credentials');
        return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid credentials' }) };
      }
    }

    // Admin status
    if ((apiPath === '/api/admin/status' || path === '/api/admin/status') && method === 'GET') {
      console.log('Processing admin status');
      const isAdmin = await checkIsAdmin(event.headers.authorization);
      return { statusCode: 200, headers, body: JSON.stringify({ admin: isAdmin }) };
    }

    // Admin logout
    if ((apiPath === '/api/admin/logout' || path === '/api/admin/logout') && method === 'POST') {
      console.log('Processing admin logout');
      const auth = event.headers.authorization;
      if (auth && auth.startsWith('Bearer ')) {
        await removeToken(auth.split(' ')[1]);
      }
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    // Get content
    if ((apiPath === '/api/content' || path === '/api/content') && method === 'GET') {
      console.log('Processing content get, page:', event.queryStringParameters.page);
      const db = await loadDb();
      const page = event.queryStringParameters.page;
      if (!page) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Page required' }) };
      
      const pageContent = db.content.filter(c => c.page === page);
      const contentMap = {};
      pageContent.forEach(c => {
        if (c.field_name === 'card_structure') {
          contentMap[c.field_name] = JSON.parse(c.value);
        } else {
          contentMap[c.field_name] = c.value;
        }
      });
      console.log('Content loaded:', Object.keys(contentMap));
      return { statusCode: 200, headers, body: JSON.stringify(contentMap) };
    }

    // Update content
    if (path === '/api/content' && method === 'PATCH') {
      if (!(await checkIsAdmin(event.headers.authorization))) {
        return { statusCode: 403, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
      }
      
      const db = await loadDb();
      const { page, changes, cardData } = JSON.parse(event.body);
      if (!page) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid payload' }) };
      
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
      
      if (cardData && (page === 'about' || page === 'home')) {
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
      
      await saveDb(db);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    // Get events
    if (path === '/api/events' && method === 'GET') {
      const db = await loadDb();
      const { year, month } = event.queryStringParameters || {};
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
      
      return { statusCode: 200, headers, body: JSON.stringify(events) };
    }

    // Get cards
    if (path === '/api/cards' && method === 'GET') {
      const db = await loadDb();
      const { page, section } = event.queryStringParameters || {};
      if (!page) return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing 'page' query parameter." }) };

      let cards = db.cards.filter(c => c.page === String(page).trim().toLowerCase());
      if (section) {
        cards = cards.filter(c => c.section === String(section).trim().toLowerCase());
      }
      cards.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      return { statusCode: 200, headers, body: JSON.stringify(cards) };
    }

    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) };

  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
}
