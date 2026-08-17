import { loadDb, saveDb } from './db-utils.js';

// Simple in-memory token storage (shared with admin-login)
const adminTokens = new Set();

function checkAuth(event) {
  const auth = event.headers.authorization;
  const cookie = event.headers.cookie || '';
  const tokenMatch = cookie.match(/admin_token=([^;]+)/);
  const token = tokenMatch ? tokenMatch[1] : null;
  
  return auth || adminTokens.has(token);
}

export async function handler(event, context) {
  const method = event.httpMethod;
  
  // GET - fetch events
  if (method === 'GET') {
    try {
      const db = await loadDb(context);
      const { year, month } = event.queryStringParameters;
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
      
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(events)
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message })
      };
    }
  }
  
  // POST - create event (admin only)
  if (method === 'POST') {
    if (!checkAuth(event)) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }
    
    try {
      const db = await loadDb(context);
      const { title, date, startTime, endTime, allDay, isHoliday, description } = JSON.parse(event.body);
      
      if (!title || !date) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'title and date are required' })
        };
      }
      
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
      await saveDb(context);
      
      return {
        statusCode: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newEvent.id,
          title: newEvent.title,
          date: newEvent.event_date,
          startTime: newEvent.start_time,
          endTime: newEvent.end_time,
          allDay: newEvent.all_day,
          isHoliday: newEvent.is_holiday,
          isCustom: newEvent.is_custom,
          description: newEvent.description
        })
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message })
      };
    }
  }
  
  // PUT - update event (admin only)
  if (method === 'PUT') {
    if (!(await checkAuth(event, context))) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }
    
    try {
      const db = await loadDb(context);
      const id = parseInt(event.path.split('/').pop(), 10);
      const { title, date, startTime, endTime, allDay, isHoliday, description } = JSON.parse(event.body);

      const eventItem = db.events.find(e => e.id === id);
      if (!eventItem) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Not found' })
        };
      }

      if (title !== undefined) eventItem.title = title;
      if (date !== undefined) eventItem.event_date = date;
      if (startTime !== undefined) eventItem.start_time = startTime;
      if (endTime !== undefined) eventItem.end_time = endTime;
      if (allDay !== undefined) eventItem.all_day = !!allDay;
      if (isHoliday !== undefined) eventItem.is_holiday = !!isHoliday;
      if (description !== undefined) eventItem.description = description;

      await saveDb(context);

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: eventItem.id,
          title: eventItem.title,
          date: eventItem.event_date,
          startTime: eventItem.start_time,
          endTime: eventItem.end_time,
          allDay: eventItem.all_day,
          isHoliday: eventItem.is_holiday,
          isCustom: eventItem.is_custom,
          description: eventItem.description
        })
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message })
      };
    }
  }
  
  // DELETE - delete event (admin only)
  if (method === 'DELETE') {
    if (!checkAuth(event)) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }
    
    try {
      const db = await loadDb(context);
      const id = parseInt(event.path.split('/').pop(), 10);
      db.events = db.events.filter(e => e.id !== id);
      await saveDb(context);

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true })
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message })
      };
    }
  }
  
  return {
    statusCode: 405,
    body: JSON.stringify({ error: 'Method not allowed' })
  };
}
