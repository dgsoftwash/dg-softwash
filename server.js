const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// --- PostgreSQL setup ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id SERIAL PRIMARY KEY,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      duration INTEGER NOT NULL DEFAULT 1,
      name TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      service TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS blocked (
      id SERIAL PRIMARY KEY,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      reason TEXT NOT NULL DEFAULT ''
    )
  `);
}

// --- Booking helpers ---
const VALID_SLOTS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'];

const SERVICE_DURATIONS = {
  'house-rancher': 2,
  'house-single': 3,
  'house-plus': 4,
  'deck': 2,
  'fence': 2,
  'rv': 1,
  'boat': 1
};

const NOT_BOOKABLE = ['heavy-equipment', 'commercial'];

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'dgsoftwash2025';

// Returns all slot times a booking occupies based on its duration
function getOccupiedSlots(booking) {
  const duration = booking.duration || 1;
  const startIndex = VALID_SLOTS.indexOf(booking.time);
  if (startIndex === -1) return [booking.time];
  const slots = [];
  for (let i = 0; i < duration && (startIndex + i) < VALID_SLOTS.length; i++) {
    slots.push(VALID_SLOTS[startIndex + i]);
  }
  return slots;
}

// Simple token store (in-memory, resets on server restart)
const adminTokens = new Set();

function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (!token || !adminTokens.has(token)) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  next();
}

// --- Page routes ---
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/services', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'services.html'));
});

app.get('/pricing', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'pricing.html'));
});

app.get('/gallery', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'gallery.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'contact.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

// --- Availability API ---

// GET /api/availability/:date/slots - individual day slots
app.get('/api/availability/:date/slots', async (req, res) => {
  const dateStr = req.params.date;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return res.status(400).json({ error: 'Invalid date format' });
  }

  const { rows: bookings } = await pool.query(
    'SELECT time, duration FROM bookings WHERE date = $1', [dateStr]
  );
  const { rows: blockedRows } = await pool.query(
    'SELECT time FROM blocked WHERE date = $1', [dateStr]
  );

  const dayBlocked = blockedRows.some(b => b.time === 'all');

  const occupiedSlots = new Set();
  bookings.forEach(b => {
    getOccupiedSlots(b).forEach(s => occupiedSlots.add(s));
  });

  const blockedTimes = new Set(blockedRows.map(b => b.time));

  const slots = VALID_SLOTS.map(slot => {
    if (dayBlocked) return { time: slot, available: false };
    return { time: slot, available: !occupiedSlots.has(slot) && !blockedTimes.has(slot) };
  });

  res.json({ slots });
});

// GET /api/availability/:year/:month - month availability overview
app.get('/api/availability/:year/:month', async (req, res) => {
  const year = parseInt(req.params.year);
  const month = parseInt(req.params.month); // 1-indexed
  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return res.status(400).json({ error: 'Invalid year or month' });
  }

  const prefix = year + '-' + String(month).padStart(2, '0');
  const { rows: bookings } = await pool.query(
    'SELECT date, time, duration FROM bookings WHERE date LIKE $1', [prefix + '%']
  );
  const { rows: blockedRows } = await pool.query(
    'SELECT date, time FROM blocked WHERE date LIKE $1', [prefix + '%']
  );

  const daysInMonth = new Date(year, month, 0).getDate();
  const days = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = prefix + '-' + String(day).padStart(2, '0');

    const dayBlocked = blockedRows.some(b => b.date === dateStr && b.time === 'all');
    if (dayBlocked) {
      days.push({ date: dateStr, availableSlots: 0 });
      continue;
    }

    const dayBookings = bookings.filter(b => b.date === dateStr);
    const occupiedSlots = new Set();
    dayBookings.forEach(b => {
      getOccupiedSlots(b).forEach(s => occupiedSlots.add(s));
    });

    let available = 0;
    VALID_SLOTS.forEach(slot => {
      const isBooked = occupiedSlots.has(slot);
      const isBlocked = blockedRows.some(b => b.date === dateStr && b.time === slot);
      if (!isBooked && !isBlocked) available++;
    });

    days.push({ date: dateStr, availableSlots: available });
  }

  res.json({ days });
});

// --- Contact form submission (modified to support booking) ---
app.post('/api/contact', async (req, res) => {
  const { name, email, phone, service, message, appointmentDate, appointmentTime } = req.body;

  console.log('Contact form submission:', { name, email, phone, service, message, appointmentDate, appointmentTime });

  // If appointment requested, validate and save booking
  if (appointmentDate && appointmentTime) {
    // Reject not-bookable services
    if (NOT_BOOKABLE.includes(service)) {
      return res.json({ success: false, message: 'This service requires a custom estimate. Please call or text to book.' });
    }

    if (!VALID_SLOTS.includes(appointmentTime)) {
      return res.json({ success: false, message: 'Invalid time slot selected.' });
    }

    const duration = SERVICE_DURATIONS[service] || 1;
    const startIndex = VALID_SLOTS.indexOf(appointmentTime);

    // Verify all consecutive slots fit within operating hours
    if (startIndex + duration > VALID_SLOTS.length) {
      return res.json({ success: false, message: 'Not enough time remaining in the day for this service.' });
    }

    const neededSlots = VALID_SLOTS.slice(startIndex, startIndex + duration);

    // Check blocked
    const { rows: blockedRows } = await pool.query(
      'SELECT time FROM blocked WHERE date = $1', [appointmentDate]
    );
    const dayBlocked = blockedRows.some(b => b.time === 'all');
    if (dayBlocked) {
      return res.json({ success: false, message: 'Sorry, that day is not available. Please select another.' });
    }

    // Build set of occupied slots for the day
    const { rows: dayBookings } = await pool.query(
      'SELECT time, duration FROM bookings WHERE date = $1', [appointmentDate]
    );
    const occupiedSlots = new Set();
    dayBookings.forEach(b => {
      getOccupiedSlots(b).forEach(s => occupiedSlots.add(s));
    });

    const blockedTimes = new Set(blockedRows.map(b => b.time));

    // Check ALL needed slots are free
    const blockedSlot = neededSlots.find(s => occupiedSlots.has(s) || blockedTimes.has(s));
    if (blockedSlot) {
      return res.json({ success: false, message: 'Sorry, that time slot is no longer available. Please select another.' });
    }

    // Save booking
    await pool.query(
      'INSERT INTO bookings (date, time, duration, name, email, phone, service) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [appointmentDate, appointmentTime, duration, name || '', email || '', phone || '', service || '']
    );
  }

  /*
  // Uncomment and configure to enable email notifications
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'your-email@gmail.com',
      pass: 'your-app-password'
    }
  });

  await transporter.sendMail({
    from: email,
    to: 'your-email@gmail.com',
    subject: `New Contact from ${name} - D&G Soft Wash`,
    text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\n\nMessage:\n${message}`
  });
  */

  res.json({ success: true, message: 'Thank you for your message! We will get back to you soon.' });
});

// --- Admin API ---

// POST /api/admin/login
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;

  if (password === ADMIN_PASSWORD) {
    const token = crypto.randomBytes(32).toString('hex');
    adminTokens.add(token);
    res.json({ success: true, token });
  } else {
    res.json({ success: false, message: 'Invalid password' });
  }
});

// GET /api/admin/bookings
app.get('/api/admin/bookings', requireAdmin, async (req, res) => {
  const { rows: bookings } = await pool.query('SELECT date, time, duration, name, email, phone, service, created_at FROM bookings ORDER BY date, time');
  const { rows: blocked } = await pool.query('SELECT date, time, reason FROM blocked ORDER BY date, time');
  res.json({ bookings, blocked });
});

// POST /api/admin/block
app.post('/api/admin/block', requireAdmin, async (req, res) => {
  const { action, date, time } = req.body;

  if (action === 'block') {
    // Don't duplicate
    const { rows } = await pool.query(
      'SELECT 1 FROM blocked WHERE date = $1 AND time = $2', [date, time]
    );
    if (rows.length === 0) {
      await pool.query(
        'INSERT INTO blocked (date, time, reason) VALUES ($1, $2, $3)',
        [date, time, 'Admin blocked']
      );
    }
  } else if (action === 'unblock') {
    await pool.query('DELETE FROM blocked WHERE date = $1 AND time = $2', [date, time]);
  } else if (action === 'cancel') {
    await pool.query('DELETE FROM bookings WHERE date = $1 AND time = $2', [date, time]);
  }

  res.json({ success: true });
});

// --- Start server ---
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`D&G Soft Wash website running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
