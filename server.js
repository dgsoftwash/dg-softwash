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
      address TEXT NOT NULL DEFAULT '',
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
  // Migration: add address column if it doesn't exist
  await pool.query(`
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS address TEXT NOT NULL DEFAULT ''
  `);
  // Migration: add price column if it doesn't exist
  await pool.query(`
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS price TEXT NOT NULL DEFAULT ''
  `);
  // Migration: add notes column if it doesn't exist
  await pool.query(`
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS notes TEXT NOT NULL DEFAULT ''
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

const SERVICE_LABELS = {
  'house-rancher': 'House Washing - Rancher',
  'house-single': 'House Washing - Single Family',
  'house-plus': 'House Washing - Plus+',
  'deck': 'Deck Cleaning',
  'fence': 'Fence Cleaning',
  'rv': 'RV Washing',
  'boat': 'Boat Cleaning',
  'heavy-equipment': 'Heavy Equipment (Estimate)',
  'commercial': 'Commercial (Estimate)'
};

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'dgsoftwash2025';

// --- Email setup ---
const transporter = nodemailer.createTransport({
  service: 'yahoo',
  auth: {
    user: 'dgsoftwash@yahoo.com',
    pass: 'ygyizljftmjzhqck'
  }
});

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

// Format a 24hr slot like '13:00' → '1:00 PM'
function formatSlot(slot) {
  const [h] = slot.split(':');
  const hour = parseInt(h);
  return (hour > 12 ? hour - 12 : hour) + ':00 ' + (hour >= 12 ? 'PM' : 'AM');
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
  const { name, email, phone, address, service, message, appointmentDate, appointmentTime, totalDuration, bookingPrice, bookingNotes } = req.body;

  console.log('Contact form submission:', { name, email, phone, address, service, message, appointmentDate, appointmentTime });

  // Hoisted so these are in scope for the final res.json and email blocks
  let isMultiDay = false;
  let day2Adjusted = false;
  let day2Date = null;
  let day2StartTime = null;
  let day2Duration = 0;

  // If appointment requested, validate and save booking
  if (appointmentDate && appointmentTime) {
    // Reject not-bookable services
    if (NOT_BOOKABLE.includes(service)) {
      return res.json({ success: false, message: 'This service requires a custom estimate. Please call or text to book.' });
    }

    if (!VALID_SLOTS.includes(appointmentTime)) {
      return res.json({ success: false, message: 'Invalid time slot selected.' });
    }

    const parsedDuration = totalDuration ? parseInt(totalDuration) : 0;
    const baseDuration = parsedDuration > 0 ? parsedDuration : (SERVICE_DURATIONS[service] || 1);
    isMultiDay = baseDuration > VALID_SLOTS.length;

    // For multi-day bookings, force start at 9am; otherwise use selected time
    const day1Time = isMultiDay ? VALID_SLOTS[0] : appointmentTime;
    const day1Duration = isMultiDay ? VALID_SLOTS.length : baseDuration;

    if (isMultiDay) {
      day2Duration = baseDuration - VALID_SLOTS.length;
      const d1 = new Date(appointmentDate + 'T12:00:00');
      const d2 = new Date(d1);
      d2.setDate(d2.getDate() + 1);
      if (d2.getDay() === 0) d2.setDate(d2.getDate() + 1); // Skip Sunday
      day2Date = d2.toISOString().split('T')[0];
    }

    if (!VALID_SLOTS.includes(day1Time)) {
      return res.json({ success: false, message: 'Invalid time slot selected.' });
    }

    const startIndex = VALID_SLOTS.indexOf(day1Time);

    if (!isMultiDay && startIndex + day1Duration > VALID_SLOTS.length) {
      return res.json({ success: false, message: 'Not enough time remaining in the day for this service.' });
    }

    const neededSlots = isMultiDay ? VALID_SLOTS : VALID_SLOTS.slice(startIndex, startIndex + day1Duration);

    // Check day 1 availability
    const { rows: blockedRows } = await pool.query(
      'SELECT time FROM blocked WHERE date = $1', [appointmentDate]
    );
    const dayBlocked = blockedRows.some(b => b.time === 'all');
    if (dayBlocked) {
      return res.json({ success: false, message: 'Sorry, that day is not available. Please select another.' });
    }

    const { rows: dayBookings } = await pool.query(
      'SELECT time, duration FROM bookings WHERE date = $1', [appointmentDate]
    );
    const occupiedSlots = new Set();
    dayBookings.forEach(b => { getOccupiedSlots(b).forEach(s => occupiedSlots.add(s)); });
    const blockedTimes = new Set(blockedRows.map(b => b.time));

    const blockedSlot = neededSlots.find(s => occupiedSlots.has(s) || blockedTimes.has(s));
    if (blockedSlot) {
      return res.json({ success: false, message: 'Sorry, that time slot is no longer available. Please select another.' });
    }

    // Find available slot on day 2 if multi-day
    day2StartTime = VALID_SLOTS[0];

    if (isMultiDay) {
      const { rows: blockedRows2 } = await pool.query('SELECT time FROM blocked WHERE date = $1', [day2Date]);
      if (blockedRows2.some(b => b.time === 'all')) {
        return res.json({ success: false, message: 'The second day required for this service is unavailable. Please choose a different start date.' });
      }
      const { rows: day2Bookings } = await pool.query('SELECT time, duration FROM bookings WHERE date = $1', [day2Date]);
      const occupiedDay2 = new Set();
      day2Bookings.forEach(b => { getOccupiedSlots(b).forEach(s => occupiedDay2.add(s)); });
      const blockedDay2Times = new Set(blockedRows2.map(b => b.time));

      // Find first slot on day 2 where day2Duration consecutive slots are all free
      day2StartTime = null;
      for (let i = 0; i <= VALID_SLOTS.length - day2Duration; i++) {
        const needed = VALID_SLOTS.slice(i, i + day2Duration);
        if (!needed.some(s => occupiedDay2.has(s) || blockedDay2Times.has(s))) {
          day2StartTime = VALID_SLOTS[i];
          day2Adjusted = day2StartTime !== VALID_SLOTS[0];
          break;
        }
      }

      if (!day2StartTime) {
        return res.json({ success: false, message: 'No available time window on the second day for this service. Please choose a different start date.' });
      }
    }

    // Save Day 1 booking
    await pool.query(
      'INSERT INTO bookings (date, time, duration, name, email, phone, address, service, price, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
      [appointmentDate, day1Time, day1Duration, name || '', email || '', phone || '', address || '', service || '', bookingPrice || '', bookingNotes || '']
    );

    // Save Day 2 booking if multi-day
    if (isMultiDay) {
      await pool.query(
        'INSERT INTO bookings (date, time, duration, name, email, phone, address, service, price, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
        [day2Date, day2StartTime, day2Duration, name || '', email || '', phone || '', address || '', service || '', '', '(Day 2 continued from ' + appointmentDate + ') ' + (bookingNotes || '')]
      );
    }
  }

  // Send email notifications
  const serviceLabel = SERVICE_LABELS[service] || service;
  try {
    if (appointmentDate && appointmentTime) {
      const day2TimeLabel = isMultiDay ? formatSlot(day2StartTime) : '';
      const scheduleText = isMultiDay
        ? `Day 1: ${appointmentDate} (Full Day 9:00 AM - 3:00 PM)\nDay 2: ${day2Date} (Starting at ${day2TimeLabel}, ${day2Duration} hour${day2Duration !== 1 ? 's' : ''})${day2Adjusted ? '\nNote: 9:00 AM was unavailable on Day 2 — your Day 2 start time was automatically moved to ' + day2TimeLabel + '.' : ''}`
        : `Date: ${appointmentDate}\nTime: ${appointmentTime}`;

      // Notify D&G
      await transporter.sendMail({
        from: 'dgsoftwash@yahoo.com',
        to: 'dgsoftwash@yahoo.com',
        subject: `New ${isMultiDay ? '2-Day ' : ''}Appointment Booked - ${name}`,
        text: `A new appointment has been booked!\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nAddress: ${address}\nService: ${serviceLabel}\n${scheduleText}\n\nMessage:\n${message || 'None'}`
      });
      // Confirm to customer
      if (email) {
        await transporter.sendMail({
          from: 'dgsoftwash@yahoo.com',
          to: email,
          subject: `Your D&G Soft Wash Appointment is Confirmed!`,
          text: `Hi ${name},\n\nThank you for booking with D&G Soft Wash! Here are your appointment details:\n\nService: ${serviceLabel}\n${scheduleText}\nAddress: ${address}\n${isMultiDay ? '\nYour service package requires two consecutive days. We will arrive at 9:00 AM on Day 1 and ' + formatSlot(day2StartTime) + ' on Day 2.\n' : ''}\nIf you need to make any changes or have questions, please call or text us at (757) 525-9508.\n\nWe look forward to serving you!\n\nD&G Soft Wash\nVeteran Owned & Operated`
        });
      }
    } else {
      // Plain contact message — notify D&G only
      await transporter.sendMail({
        from: 'dgsoftwash@yahoo.com',
        to: 'dgsoftwash@yahoo.com',
        subject: `New Contact Message - ${name}`,
        text: `New contact form submission:\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nAddress: ${address || 'N/A'}\nService: ${serviceLabel || 'N/A'}\n\nMessage:\n${message || 'None'}`
      });
    }
  } catch (emailErr) {
    console.error('Email send failed:', emailErr.message);
  }

  res.json({
    success: true,
    message: 'Booking confirmed! Please check your email for a confirmation. Thank you and have a great day!',
    day2Notice: (isMultiDay && day2Adjusted)
      ? `Note: 9:00 AM was unavailable on Day 2 (${day2Date}). Your Day 2 appointment has been automatically scheduled at ${formatSlot(day2StartTime)}.`
      : null
  });
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
  const { rows: bookings } = await pool.query('SELECT date, time, duration, name, email, phone, address, service, price, notes, created_at FROM bookings ORDER BY date, time');
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
