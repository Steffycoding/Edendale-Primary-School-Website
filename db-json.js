import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'edendale.json');

let dbData = null;

async function loadDb() {
  if (dbData) return dbData;
  try {
    const data = await fs.readFile(DB_FILE, 'utf-8');
    dbData = JSON.parse(data);
  } catch (err) {
    // If file doesn't exist, initialize it
    dbData = {
      admin_users: [],
      content: [],
      events: []
    };
    await seedDb();
    await saveDb();
  }
  return dbData;
}

async function saveDb() {
  await fs.writeFile(DB_FILE, JSON.stringify(dbData, null, 2), 'utf-8');
}

async function seedDb() {
  const hash1 = await bcrypt.hash('edendale2024', 10);
  const hash2 = await bcrypt.hash('kennis2026', 10);
  dbData.admin_users.push({ id: 1, username: 'admin', password_hash: hash1 });
  dbData.admin_users.push({ id: 2, username: 'teacher', password_hash: hash2 });

  dbData.events = [
    { id: 1, title: 'Term 2 Begins', event_date: '2026-04-07', event_time: '07:30', description: 'Start of second school term.' },
    { id: 2, title: 'Parent-Teacher Meetings', event_date: '2026-04-15', event_time: '14:00', description: 'Individual parent-teacher interviews. Please book a slot.' },
    { id: 3, title: 'Sports Day', event_date: '2026-04-22', event_time: '09:00', description: 'Annual inter-grade sports day on the school grounds.' },
    { id: 4, title: 'Winter Concert', event_date: '2026-06-10', event_time: '18:00', description: 'Annual cultural evening featuring choir, drama and dance.' },
    { id: 5, title: 'Term 2 Ends', event_date: '2026-06-26', event_time: '12:00', description: 'Last day of second school term.' }
  ];

  dbData.content = [
    { id: 1, page: 'home', field_name: 'hero_title', value: 'Edendale Primary School', type: 'text' },
    { id: 2, page: 'home', field_name: 'hero_tagline', value: 'Kennis is lig', type: 'text' },
    { id: 3, page: 'home', field_name: 'hero_description', value: 'Edendale Primary School has been serving the Manenburg community with dedication, compassion, and a commitment to excellence in education.', type: 'text' },
    { id: 4, page: 'home', field_name: 'hero_cta', value: 'Admissions Enquiry', type: 'text' },
    { id: 44, page: 'home', field_name: 'hero_cta_link', value: 'pages/grades.html', type: 'link' },
    { id: 5, page: 'home', field_name: 'about_title', value: 'A Place of Learning, Growth & Community', type: 'text' },
    { id: 6, page: 'home', field_name: 'stat_learners', value: '400+', type: 'text' },
    { id: 7, page: 'home', field_name: 'stat_teachers', value: '70+', type: 'text' },
    { id: 8, page: 'home', field_name: 'stat_grades', value: 'Gr R–7', type: 'text' },
    { id: 9, page: 'contact', field_name: 'contact_school_name', value: 'Edendale Primary School', type: 'text' },
    { id: 10, page: 'contact', field_name: 'contact_address', value: '100 Philippi Ring Road & Manenburg Ave, Manenburg, Cape Town, 7764, South Africa', type: 'text' },
    { id: 11, page: 'contact', field_name: 'contact_phone', value: '021 800 0111', type: 'text' },
    { id: 12, page: 'contact', field_name: 'contact_mobile', value: '082 829 1000', type: 'text' },
    { id: 13, page: 'contact', field_name: 'contact_email', value: 'edendaleprimary@gmail.com', type: 'text' },
    { id: 14, page: 'contact', field_name: 'contact_emis', value: '1054821000', type: 'text' }
  ];
}

export { loadDb, saveDb };
