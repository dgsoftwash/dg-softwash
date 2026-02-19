const express = require('express');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// --- Bookings data helpers ---
const DATA_FILE = path.join(__dirname, 'data', 'bookings.json');
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

function readData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return { bookings: [], blocked: [], adminPassword: 'dgsoftwash2025' };
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
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

// GET /api/availability/:date/slots - individual day slots (must be before /:year/:month)
app.get('/api/availability/:date/slots', (req, res) => {
  const dateStr = req.params.date;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return res.status(400).json({ error: 'Invalid date format' });
  }

  const data = readData();
  const dayBlocked = data.blocked.some(b => b.date === dateStr && b.time === 'all');

  const dayBookings = data.bookings.filter(b => b.date === dateStr);
  const occupiedSlots = new Set();
  dayBookings.forEach(b => {
    getOccupiedSlots(b).forEach(s => occupiedSlots.add(s));
  });

  const slots = VALID_SLOTS.map(slot => {
    if (dayBlocked) return { time: slot, available: false };
    const isBooked = occupiedSlots.has(slot);
    const isBlocked = data.blocked.some(b => b.date === dateStr && b.time === slot);
    return { time: slot, available: !isBooked && !isBlocked };
  });

  res.json({ slots });
});

// GET /api/availability/:year/:month - month availability overview
app.get('/api/availability/:year/:month', (req, res) => {
  const year = parseInt(req.params.year);
  const month = parseInt(req.params.month); // 1-indexed
  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return res.status(400).json({ error: 'Invalid year or month' });
  }

  const data = readData();
  const daysInMonth = new Date(year, month, 0).getDate();
  const days = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = year + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0');

    // Check if entire day is blocked
    const dayBlocked = data.blocked.some(b => b.date === dateStr && b.time === 'all');
    if (dayBlocked) {
      days.push({ date: dateStr, availableSlots: 0 });
      continue;
    }

    // Count available slots (accounting for multi-slot bookings)
    const dayBookings = data.bookings.filter(b => b.date === dateStr);
    const occupiedSlots = new Set();
    dayBookings.forEach(b => {
      getOccupiedSlots(b).forEach(s => occupiedSlots.add(s));
    });

    let available = 0;
    VALID_SLOTS.forEach(slot => {
      const isBooked = occupiedSlots.has(slot);
      const isBlocked = data.blocked.some(b => b.date === dateStr && b.time === slot);
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
    const data = readData();

    // Build set of occupied slots for the day
    const dayBlocked = data.blocked.some(b => b.date === appointmentDate && b.time === 'all');
    if (dayBlocked) {
      return res.json({ success: false, message: 'Sorry, that day is not available. Please select another.' });
    }

    const dayBookings = data.bookings.filter(b => b.date === appointmentDate);
    const occupiedSlots = new Set();
    dayBookings.forEach(b => {
      getOccupiedSlots(b).forEach(s => occupiedSlots.add(s));
    });

    // Check ALL needed slots are free
    const blockedSlot = neededSlots.find(s =>
      occupiedSlots.has(s) || data.blocked.some(b => b.date === appointmentDate && b.time === s)
    );
    if (blockedSlot) {
      return res.json({ success: false, message: 'Sorry, that time slot is no longer available. Please select another.' });
    }

    // Save booking with duration
    data.bookings.push({
      date: appointmentDate,
      time: appointmentTime,
      duration: duration,
      name: name || '',
      email: email || '',
      phone: phone || '',
      service: service || '',
      createdAt: new Date().toISOString()
    });
    writeData(data);
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
  const data = readData();

  if (password === data.adminPassword) {
    const token = crypto.randomBytes(32).toString('hex');
    adminTokens.add(token);
    res.json({ success: true, token });
  } else {
    res.json({ success: false, message: 'Invalid password' });
  }
});

// GET /api/admin/bookings
app.get('/api/admin/bookings', requireAdmin, (req, res) => {
  const data = readData();
  res.json({ bookings: data.bookings, blocked: data.blocked });
});

// POST /api/admin/block
app.post('/api/admin/block', requireAdmin, (req, res) => {
  const { action, date, time } = req.body;
  const data = readData();

  if (action === 'block') {
    // Don't duplicate
    const exists = data.blocked.some(b => b.date === date && b.time === time);
    if (!exists) {
      data.blocked.push({ date, time, reason: 'Admin blocked' });
    }
  } else if (action === 'unblock') {
    data.blocked = data.blocked.filter(b => !(b.date === date && b.time === time));
  } else if (action === 'cancel') {
    data.bookings = data.bookings.filter(b => !(b.date === date && b.time === time));
  }

  writeData(data);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`D&G Soft Wash website running at http://localhost:${PORT}`);
});
