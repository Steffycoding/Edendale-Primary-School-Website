import bcrypt from 'bcryptjs';

// Netlify KV storage key
const KV_KEY = 'edendale_db';

let dbData = null;

async function loadDb() {
  if (dbData) return dbData;
  
  try {
    // Try to load from Netlify KV using environment variable
    const kvNamespace = process.env.KV_NAMESPACE;
    if (kvNamespace) {
      // In production, use Netlify KV REST API
      const response = await fetch(`https://kv.netlify.com/v1/${kvNamespace}/items/${KV_KEY}`, {
        headers: {
          'Authorization': `Bearer ${process.env.NETLIFY_KV_TOKEN}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.value) {
          dbData = JSON.parse(data.value);
        } else {
          // Initialize with seed data
          dbData = {
            admin_users: [],
            content: [],
            events: [],
            cards: []
          };
          await seedDb();
          await saveDb();
        }
      } else {
        throw new Error('Failed to load from KV');
      }
    } else {
      // Fallback for local development - use in-memory storage
      console.warn('Netlify KV not available, using in-memory storage (changes won\'t persist in production)');
      dbData = {
        admin_users: [],
        content: [],
        events: [],
        cards: []
      };
      await seedDb();
    }

    // Ensure cards collection exists
    if (!Array.isArray(dbData.cards)) {
      dbData.cards = seedCards();
      await saveDb();
    }

    return dbData;
  } catch (err) {
    console.error('Error loading database:', err);
    // Initialize with seed data on error
    dbData = {
      admin_users: [],
      content: [],
      events: [],
      cards: []
    };
    await seedDb();
    await saveDb();
    return dbData;
  }
}

async function saveDb() {
  try {
    const kvNamespace = process.env.KV_NAMESPACE;
    if (kvNamespace) {
      // In production, use Netlify KV REST API
      await fetch(`https://kv.netlify.com/v1/${kvNamespace}/items/${KV_KEY}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${process.env.NETLIFY_KV_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ value: JSON.stringify(dbData) })
      });
    } else {
      console.warn('Netlify KV not available, data not persisted');
    }
  } catch (err) {
    console.error('Error saving database:', err);
  }
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
    { id: 3, page: 'home', field_name: 'hero_description', value: 'Edendale Primary School has been serving the Manenberg community with dedication, compassion, and a commitment to excellence in education.', type: 'text' },
    { id: 4, page: 'home', field_name: 'hero_cta', value: 'Admissions Enquiry', type: 'text' },
    { id: 44, page: 'home', field_name: 'hero_cta_link', value: 'pages/grades.html', type: 'link' },
    { id: 5, page: 'home', field_name: 'about_title', value: 'A Place of Learning, Growth & Community', type: 'text' },
    { id: 6, page: 'home', field_name: 'stat_learners', value: '400+', type: 'text' },
    { id: 7, page: 'home', field_name: 'stat_teachers', value: '70+', type: 'text' },
    { id: 8, page: 'home', field_name: 'stat_grades', value: 'Gr R–7', type: 'text' },
    { id: 9, page: 'contact', field_name: 'contact_school_name', value: 'Edendale Primary School', type: 'text' },
    { id: 10, page: 'contact', field_name: 'contact_address', value: '100 Philippi Ring Road & Manenberg Ave, Manenberg, Cape Town, 7764, South Africa', type: 'text' },
    { id: 11, page: 'contact', field_name: 'contact_phone', value: '021 800 0111', type: 'text' },
    { id: 12, page: 'contact', field_name: 'contact_mobile', value: '082 829 1000', type: 'text' },
    { id: 13, page: 'contact', field_name: 'contact_email', value: 'edendaleprimary@gmail.com', type: 'text' },
    { id: 14, page: 'contact', field_name: 'contact_emis', value: '1054821000', type: 'text' }
  ];

  dbData.cards = seedCards();
}

function seedCards() {
  const rows = [
    ['extras', 'extracurricular', '🥁', 'Marching Band & Drumline',
     'Learners join our band to play drums and percussion, rehearsing together and performing at school assemblies, sports days and community events. It teaches rhythm, focus and self-discipline, and gives children the pride and confidence that comes from performing as part of a team.', null, 1],
    ['extras', 'extracurricular', '⚽', 'Soccer',
     'Boys and girls train regularly and play friendly matches against other schools. Through soccer, children build fitness, coordination and stamina, learn to work together as a team, and develop the sportsmanship and resilience that come from both winning and losing gracefully.', null, 2],
    ['extras', 'extracurricular', '🏐', 'Netball',
     'One of our most popular activities, netball has learners practising passing, shooting and quick footwork on the court. It develops agility, balance and teamwork, while building the confidence and friendships that grow from working together toward a shared goal.', null, 3],

    ['extras', 'cocurricular', '🔬', 'Science & Discovery Club',
     'In Science Club, children carry out safe, hands-on experiments and simple projects that bring their classroom lessons to life. By exploring how and why things work, they build curiosity, observation skills and confidence, and discover just how exciting learning can be.', null, 1],
    ['extras', 'cocurricular', '📚', 'Reading & Storytelling Club',
     'Members gather to share stories, read together and talk about their favourite books. The club nurtures a genuine love of reading, strengthens vocabulary and comprehension, and sparks the imagination, giving children a foundation that supports every other subject they learn.', null, 2],

    ['grade_r', 'activities', '📖', 'Story Time & Early Reading',
     'Every day the class gathers for a read-aloud story, where children look at the pictures, guess what happens next and talk about the characters. This grows their vocabulary, strengthens listening and concentration, and builds an early love of books that prepares them for reading on their own.', null, 1],
    ['grade_r', 'activities', '🧩', 'Building, Puzzles & Problem-Solving',
     'Children work with blocks, puzzles and shape-sorting games, often side by side with friends. As they build towers and fit pieces together, they develop patience, logical thinking and the small hand muscles they will later need to hold a pencil and write.', null, 2],
    ['grade_r', 'activities', '🎨', 'Arts, Crafts & Creative Expression',
     'With paint, crayons, scissors and glue, children create their own artwork and proudly display it. These hands-on activities sharpen fine motor control and hand-eye coordination, while giving every child a safe, joyful way to express their ideas and feelings.', null, 3],
    ['grade_r', 'activities', '🎵', 'Music, Song & Movement',
     'Through singing, clapping games, dancing and simple instruments, children learn rhythm and new words while moving their whole bodies. It builds coordination, memory and the confidence to perform in front of others; and it is one of the happiest, most energetic parts of their day.', null, 4],
    ['grade_r', 'activities', '⚽', 'Outdoor & Active Play',
     'In a safe, supervised playground, children run, climb, jump and play group games. This strengthens their growing muscles, balance and coordination, teaches them to take turns and play fairly, and lays the foundation for a healthy, active lifestyle.', null, 5],
    ['grade_r', 'activities', '🔤', 'First Numbers, Letters & Sounds',
     'Playful games with letters, numbers, shapes and colours help children recognise and remember them without any pressure. These gentle first steps in reading and maths make learning feel like fun; and get little ones confidently ready for Grade 1.', null, 6],

    ['grade_r', 'gallery', null, 'Story Time',       null, '/assets/images/grade-r/story-time.svg',     1],
    ['grade_r', 'gallery', null, 'Creative Play',    null, '/assets/images/grade-r/creative-play.svg',  2],
    ['grade_r', 'gallery', null, 'Arts & Crafts',    null, '/assets/images/grade-r/arts-crafts.svg',    3],
    ['grade_r', 'gallery', null, 'Music & Movement', null, '/assets/images/grade-r/music-movement.svg', 4],
    ['grade_r', 'gallery', null, 'Outdoor Play',     null, '/assets/images/grade-r/outdoor-play.svg',   5],
    ['grade_r', 'gallery', null, 'Learning Games',   null, '/assets/images/grade-r/learning-games.svg', 6]
  ];

  return rows.map(([page, section, icon, title, body, imageUrl, sortOrder], i) => ({
    id: i + 1, page, section, icon, title, body, imageUrl, sortOrder
  }));
}

export { loadDb, saveDb };
