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

  // Customers table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // Work orders table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS work_orders (
      id SERIAL PRIMARY KEY,
      booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
      customer_id INTEGER REFERENCES customers(id),
      status_job_complete BOOLEAN NOT NULL DEFAULT false,
      status_invoiced BOOLEAN NOT NULL DEFAULT false,
      status_invoice_paid BOOLEAN NOT NULL DEFAULT false,
      status_paid BOOLEAN NOT NULL DEFAULT false,
      admin_notes TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // Migration: add customer_id to bookings
  await pool.query(`
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_id INTEGER
  `);

  // Services table for dynamic pricing
  await pool.query(`
    CREATE TABLE IF NOT EXISTS services (
      id SERIAL PRIMARY KEY,
      key TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL,
      category TEXT NOT NULL,
      parent_key TEXT,
      price INTEGER NOT NULL,
      duration REAL NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      bookable_group TEXT,
      active BOOLEAN NOT NULL DEFAULT true
    )
  `);

  // Discounts table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS discounts (
      id SERIAL PRIMARY KEY,
      key TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL,
      percent INTEGER NOT NULL,
      auto_apply BOOLEAN NOT NULL DEFAULT false,
      min_services INTEGER NOT NULL DEFAULT 0,
      active BOOLEAN NOT NULL DEFAULT true
    )
  `);

  // Scheduled pricing changes
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pricing_schedule (
      id SERIAL PRIMARY KEY,
      service_id INTEGER REFERENCES services(id),
      discount_id INTEGER REFERENCES discounts(id),
      field TEXT NOT NULL,
      new_value TEXT NOT NULL,
      effective_date DATE NOT NULL,
      applied BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // Seed services (ON CONFLICT DO NOTHING = safe to re-run, won't overwrite admin edits)
  const seedServices = [
    // House Washing
    { key: 'house-rancher', label: 'Rancher/Single Story', category: 'house', parent_key: null, price: 350, duration: 2, sort_order: 1, bookable_group: 'house' },
    { key: 'house-single', label: 'Single Family (Two Story)', category: 'house', parent_key: null, price: 575, duration: 3, sort_order: 2, bookable_group: 'house' },
    { key: 'house-plus', label: 'Plus+ (Large/Multi-Story)', category: 'house', parent_key: null, price: 805, duration: 4, sort_order: 3, bookable_group: 'house' },
    // House Add-ons (Rancher)
    { key: 'house-addon-roof-rancher', label: 'Roof Wash', category: 'house-addon', parent_key: 'house-rancher', price: 125, duration: 1, sort_order: 1, bookable_group: null },
    { key: 'house-addon-driveway-hot-rancher', label: 'Driveway Hot Wash', category: 'house-addon', parent_key: 'house-rancher', price: 75, duration: 1.5, sort_order: 2, bookable_group: null },
    { key: 'house-addon-driveway-stain-rancher', label: 'Driveway Heavy Stain (Peroxide/Degreaser)', category: 'house-addon', parent_key: 'house-rancher', price: 125, duration: 2, sort_order: 3, bookable_group: null },
    { key: 'house-addon-uv-rancher', label: 'UV Protectant', category: 'house-addon', parent_key: 'house-rancher', price: 25, duration: 1, sort_order: 4, bookable_group: null },
    { key: 'house-addon-windows-rancher', label: 'Streak-Free Window Cleaning', category: 'house-addon', parent_key: 'house-rancher', price: 25, duration: 0.75, sort_order: 5, bookable_group: null },
    // House Add-ons (Single Family)
    { key: 'house-addon-roof-single', label: 'Roof Wash', category: 'house-addon', parent_key: 'house-single', price: 225, duration: 1, sort_order: 1, bookable_group: null },
    { key: 'house-addon-driveway-hot-single', label: 'Driveway Hot Wash', category: 'house-addon', parent_key: 'house-single', price: 75, duration: 1.5, sort_order: 2, bookable_group: null },
    { key: 'house-addon-driveway-stain-single', label: 'Driveway Heavy Stain (Peroxide/Degreaser)', category: 'house-addon', parent_key: 'house-single', price: 125, duration: 2, sort_order: 3, bookable_group: null },
    { key: 'house-addon-uv-single', label: 'UV Protectant', category: 'house-addon', parent_key: 'house-single', price: 65, duration: 1, sort_order: 4, bookable_group: null },
    { key: 'house-addon-windows-single', label: 'Streak-Free Window Cleaning', category: 'house-addon', parent_key: 'house-single', price: 60, duration: 0.75, sort_order: 5, bookable_group: null },
    // House Add-ons (Plus+)
    { key: 'house-addon-roof-plus', label: 'Roof Wash', category: 'house-addon', parent_key: 'house-plus', price: 400, duration: 1, sort_order: 1, bookable_group: null },
    { key: 'house-addon-driveway-hot-plus', label: 'Driveway Hot Wash', category: 'house-addon', parent_key: 'house-plus', price: 125, duration: 1.5, sort_order: 2, bookable_group: null },
    { key: 'house-addon-driveway-stain-plus', label: 'Driveway Heavy Stain (Peroxide/Degreaser)', category: 'house-addon', parent_key: 'house-plus', price: 175, duration: 2, sort_order: 3, bookable_group: null },
    { key: 'house-addon-uv-plus', label: 'UV Protectant', category: 'house-addon', parent_key: 'house-plus', price: 100, duration: 1, sort_order: 4, bookable_group: null },
    { key: 'house-addon-windows-plus', label: 'Streak-Free Window Cleaning', category: 'house-addon', parent_key: 'house-plus', price: 85, duration: 0.75, sort_order: 5, bookable_group: null },
    // Deck Cleaning
    { key: 'deck-little', label: 'Little Deck', category: 'deck', parent_key: null, price: 75, duration: 2, sort_order: 1, bookable_group: null },
    { key: 'deck-medium', label: 'Medium Deck', category: 'deck', parent_key: null, price: 115, duration: 2, sort_order: 2, bookable_group: null },
    { key: 'deck-large', label: 'Large/Big Deck', category: 'deck', parent_key: null, price: 150, duration: 2, sort_order: 3, bookable_group: null },
    // Fence Cleaning
    { key: 'fence-standard', label: 'Standard (1/4 Acre Lot)', category: 'fence', parent_key: null, price: 100, duration: 2, sort_order: 1, bookable_group: null },
    { key: 'fence-large', label: 'Large (Up to 1/2 Acre)', category: 'fence', parent_key: null, price: 175, duration: 2, sort_order: 2, bookable_group: null },
    // RV Washing
    { key: 'rv-short', label: 'Short Bus RV', category: 'rv', parent_key: null, price: 75, duration: 1, sort_order: 1, bookable_group: 'rv' },
    { key: 'rv-medium', label: 'Medium Bumper Pull', category: 'rv', parent_key: null, price: 125, duration: 1, sort_order: 2, bookable_group: 'rv' },
    { key: 'rv-large', label: 'Big Boy 5th Wheel', category: 'rv', parent_key: null, price: 200, duration: 1, sort_order: 3, bookable_group: 'rv' },
    // RV Add-ons (Short)
    { key: 'rv-addon-uv-short', label: 'UV Protectant', category: 'rv-addon', parent_key: 'rv-short', price: 20, duration: 0.5, sort_order: 1, bookable_group: null },
    { key: 'rv-addon-windows-short', label: 'Streak-Free Window Cleaning', category: 'rv-addon', parent_key: 'rv-short', price: 20, duration: 0.25, sort_order: 2, bookable_group: null },
    // RV Add-ons (Medium)
    { key: 'rv-addon-uv-medium', label: 'UV Protectant', category: 'rv-addon', parent_key: 'rv-medium', price: 35, duration: 0.5, sort_order: 1, bookable_group: null },
    { key: 'rv-addon-windows-medium', label: 'Streak-Free Window Cleaning', category: 'rv-addon', parent_key: 'rv-medium', price: 35, duration: 0.25, sort_order: 2, bookable_group: null },
    // RV Add-ons (Large)
    { key: 'rv-addon-uv-large', label: 'UV Protectant', category: 'rv-addon', parent_key: 'rv-large', price: 50, duration: 0.5, sort_order: 1, bookable_group: null },
    { key: 'rv-addon-windows-large', label: 'Streak-Free Window Cleaning', category: 'rv-addon', parent_key: 'rv-large', price: 50, duration: 0.25, sort_order: 2, bookable_group: null },
    // Boat Cleaning
    { key: 'boat-small', label: '20ft or Less', category: 'boat', parent_key: null, price: 75, duration: 1, sort_order: 1, bookable_group: 'boat' },
    { key: 'boat-medium', label: '21ft to 26ft', category: 'boat', parent_key: null, price: 115, duration: 1, sort_order: 2, bookable_group: 'boat' }
  ];
  for (const svc of seedServices) {
    await pool.query(
      'INSERT INTO services (key, label, category, parent_key, price, duration, sort_order, bookable_group) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (key) DO NOTHING',
      [svc.key, svc.label, svc.category, svc.parent_key, svc.price, svc.duration, svc.sort_order, svc.bookable_group]
    );
  }

  // Seed discounts
  const seedDiscounts = [
    { key: 'cash', label: 'Cash Payment', percent: 10, auto_apply: false, min_services: 0 },
    { key: 'return-customer', label: 'Return Customer', percent: 10, auto_apply: false, min_services: 0 },
    { key: 'multi-2', label: '2+ Services Discount', percent: 10, auto_apply: true, min_services: 2 },
    { key: 'multi-3', label: '3+ Services Discount', percent: 15, auto_apply: true, min_services: 3 }
  ];
  for (const disc of seedDiscounts) {
    await pool.query(
      'INSERT INTO discounts (key, label, percent, auto_apply, min_services) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (key) DO NOTHING',
      [disc.key, disc.label, disc.percent, disc.auto_apply, disc.min_services]
    );
  }
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

// --- Pricing cache ---
let pricingCache = null;
let pricingCacheTime = 0;
const PRICING_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function invalidatePricingCache() {
  pricingCache = null;
  pricingCacheTime = 0;
}

async function getPricingData() {
  if (pricingCache && (Date.now() - pricingCacheTime) < PRICING_CACHE_TTL) {
    return pricingCache;
  }
  const { rows: services } = await pool.query(
    'SELECT * FROM services WHERE active = true ORDER BY category, sort_order, id'
  );
  const { rows: discounts } = await pool.query(
    'SELECT * FROM discounts WHERE active = true ORDER BY min_services, id'
  );
  pricingCache = { services, discounts };
  pricingCacheTime = Date.now();
  return pricingCache;
}

// KEY_MAP: contact form service keys → services table keys (for duration lookup fallback)
const KEY_MAP = {
  'house-rancher': 'house-rancher',
  'house-single': 'house-single',
  'house-plus': 'house-plus',
  'deck': 'deck-little',
  'fence': 'fence-standard',
  'rv': 'rv-short',
  'boat': 'boat-small'
};

async function getServiceDuration(serviceKey) {
  const mappedKey = KEY_MAP[serviceKey] || serviceKey;
  try {
    const { rows } = await pool.query(
      'SELECT duration FROM services WHERE key = $1 AND active = true', [mappedKey]
    );
    if (rows.length > 0) return Math.ceil(parseFloat(rows[0].duration));
  } catch (e) {}
  return SERVICE_DURATIONS[serviceKey] || 1;
}

async function upsertCustomer(name, email, phone, address) {
  let customer = null;
  if (email) {
    const { rows } = await pool.query('SELECT * FROM customers WHERE email = $1', [email]);
    if (rows.length > 0) customer = rows[0];
  }
  if (!customer && phone) {
    const { rows } = await pool.query('SELECT * FROM customers WHERE phone = $1', [phone]);
    if (rows.length > 0) customer = rows[0];
  }
  if (!customer) {
    const { rows } = await pool.query(
      'INSERT INTO customers (name, email, phone, address) VALUES ($1,$2,$3,$4) RETURNING *',
      [name || '', email || '', phone || '', address || '']
    );
    customer = rows[0];
  }
  return customer;
}

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

function generateInvoiceEmail(wo, woId, dateLabel, deadlineLabel) {
  var notesBlock = wo.booking_notes
    ? '<div style="margin-bottom:20px;"><div style="font-weight:600; margin-bottom:6px; color:#1a1a2e;">Services &amp; Add-ons</div>' +
      '<div style="background:#f8f9fa; border-radius:6px; padding:14px; white-space:pre-line; font-family:monospace; font-size:0.88em; line-height:1.6;">' +
      wo.booking_notes.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</div></div>'
    : '';
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"></head>' +
    '<body style="font-family:Arial,sans-serif;margin:0;padding:0;background:#f4f4f4;">' +
    '<div style="max-width:600px;margin:30px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">' +
    '<div style="background:#1a1a2e;color:#fff;padding:24px 30px;">' +
    '<h1 style="margin:0;font-size:1.4em;">D&amp;G Soft Wash</h1>' +
    '<p style="margin:6px 0 0;color:#aab4d4;font-size:0.95em;">Integrity You Can See &mdash; Veteran Owned &amp; Operated</p></div>' +
    '<div style="padding:30px;">' +
    '<h2 style="margin-top:0;color:#1a1a2e;">INVOICE #' + woId + '</h2>' +
    '<table style="width:100%;border-collapse:collapse;margin-bottom:20px;">' +
    '<tr><td style="padding:7px 0;color:#555;width:160px;">Date of Service</td><td style="padding:7px 0;font-weight:600;">' + dateLabel + '</td></tr>' +
    '<tr><td style="padding:7px 0;color:#555;">Service</td><td style="padding:7px 0;">' + (wo.service || '&mdash;').replace(/&/g,'&amp;') + '</td></tr>' +
    '<tr><td style="padding:7px 0;color:#555;">Amount Due</td><td style="padding:7px 0;font-weight:700;color:#dc2626;font-size:1.1em;">' + (wo.price || '&mdash;').replace(/&/g,'&amp;') + '</td></tr>' +
    '<tr><td style="padding:7px 0;color:#555;">Payment Due</td><td style="padding:7px 0;">' + deadlineLabel + '</td></tr>' +
    '</table>' + notesBlock +
    '<div style="background:#fee2e2;border:1px solid #fca5a5;border-radius:8px;padding:12px 18px;margin-bottom:20px;text-align:center;">' +
    '<span style="color:#dc2626;font-weight:700;font-size:1em;">PAYMENT STATUS: NOT PAID</span></div>' +
    '<p style="color:#555;">Payment is due within 5 business days. We accept cash, check, and major credit cards.</p>' +
    '<p style="color:#555;">If you have any questions, please call or text us at <strong>(757) 525-9508</strong> or email <strong>dgsoftwash@yahoo.com</strong>.</p>' +
    '</div>' +
    '<div style="background:#f8f9fa;padding:16px 30px;text-align:center;color:#888;font-size:0.85em;border-top:1px solid #e5e7eb;">' +
    'D&amp;G Soft Wash &mdash; (757) 525-9508 &mdash; dgsoftwash@yahoo.com</div>' +
    '</div></body></html>';
}

function generatePaidEmail(wo, woId, dateLabel) {
  var notesBlock = wo.booking_notes
    ? '<div style="margin-bottom:20px;"><div style="font-weight:600; margin-bottom:6px; color:#1a1a2e;">Services &amp; Add-ons</div>' +
      '<div style="background:#f8f9fa; border-radius:6px; padding:14px; white-space:pre-line; font-family:monospace; font-size:0.88em; line-height:1.6;">' +
      wo.booking_notes.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</div></div>'
    : '';
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"></head>' +
    '<body style="font-family:Arial,sans-serif;margin:0;padding:0;background:#f4f4f4;">' +
    '<div style="max-width:600px;margin:30px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">' +
    '<div style="background:#1a1a2e;color:#fff;padding:24px 30px;">' +
    '<h1 style="margin:0;font-size:1.4em;">D&amp;G Soft Wash</h1>' +
    '<p style="margin:6px 0 0;color:#aab4d4;font-size:0.95em;">Integrity You Can See &mdash; Veteran Owned &amp; Operated</p></div>' +
    '<div style="padding:30px;">' +
    '<h2 style="margin-top:0;color:#1a1a2e;">PAYMENT RECEIPT #' + woId + '</h2>' +
    '<table style="width:100%;border-collapse:collapse;margin-bottom:20px;">' +
    '<tr><td style="padding:7px 0;color:#555;width:160px;">Date of Service</td><td style="padding:7px 0;font-weight:600;">' + dateLabel + '</td></tr>' +
    '<tr><td style="padding:7px 0;color:#555;">Service</td><td style="padding:7px 0;">' + (wo.service || '&mdash;').replace(/&/g,'&amp;') + '</td></tr>' +
    '<tr><td style="padding:7px 0;color:#555;">Amount</td><td style="padding:7px 0;font-weight:700;color:#2d6a4f;font-size:1.1em;">' + (wo.price || '&mdash;').replace(/&/g,'&amp;') + '</td></tr>' +
    '</table>' + notesBlock +
    '<div style="background:#d1fae5;border:1px solid #6ee7b7;border-radius:8px;padding:12px 18px;margin-bottom:20px;text-align:center;">' +
    '<span style="color:#065f46;font-weight:700;font-size:1em;">&#10003; PAID IN FULL</span></div>' +
    '<p style="color:#555;">Thank you for your business! We appreciate your trust in D&amp;G Soft Wash. We hope to serve you again soon.</p>' +
    '<p style="color:#555;">If you have any questions, please call or text us at <strong>(757) 525-9508</strong>.</p>' +
    '</div>' +
    '<div style="background:#f8f9fa;padding:16px 30px;text-align:center;color:#888;font-size:0.85em;border-top:1px solid #e5e7eb;">' +
    'D&amp;G Soft Wash &mdash; (757) 525-9508 &mdash; dgsoftwash@yahoo.com</div>' +
    '</div></body></html>';
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

// --- Scheduled pricing changes ---
async function applyDuePricingSchedules() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { rows: due } = await pool.query(
      "SELECT * FROM pricing_schedule WHERE effective_date <= $1 AND applied = false", [today]
    );
    if (due.length === 0) return;
    for (const row of due) {
      if (row.service_id) {
        const col = row.field === 'price' ? 'price' : 'duration';
        const val = row.field === 'price' ? parseInt(row.new_value) : parseFloat(row.new_value);
        await pool.query(`UPDATE services SET ${col} = $1 WHERE id = $2`, [val, row.service_id]);
      } else if (row.discount_id) {
        await pool.query('UPDATE discounts SET percent = $1 WHERE id = $2', [parseInt(row.new_value), row.discount_id]);
      }
      await pool.query('UPDATE pricing_schedule SET applied = true WHERE id = $1', [row.id]);
    }
    invalidatePricingCache();
    console.log(`Applied ${due.length} scheduled pricing change(s).`);
  } catch (e) {
    console.error('Error applying pricing schedules:', e.message);
  }
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

// GET /api/pricing - Public endpoint for calculator
app.get('/api/pricing', async (req, res) => {
  try {
    const data = await getPricingData();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to load pricing' });
  }
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
    const baseDuration = parsedDuration > 0 ? parsedDuration : await getServiceDuration(service);
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

    // Upsert customer record
    const customer = await upsertCustomer(name, email, phone, address);

    // Save Day 1 booking
    const { rows: [day1Booking] } = await pool.query(
      'INSERT INTO bookings (date, time, duration, name, email, phone, address, service, price, notes, customer_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id',
      [appointmentDate, day1Time, day1Duration, name || '', email || '', phone || '', address || '', service || '', bookingPrice || '', bookingNotes || '', customer.id]
    );
    await pool.query(
      'INSERT INTO work_orders (booking_id, customer_id) VALUES ($1,$2)',
      [day1Booking.id, customer.id]
    );

    // Save Day 2 booking if multi-day
    if (isMultiDay) {
      const { rows: [day2Booking] } = await pool.query(
        'INSERT INTO bookings (date, time, duration, name, email, phone, address, service, price, notes, customer_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id',
        [day2Date, day2StartTime, day2Duration, name || '', email || '', phone || '', address || '', service || '', '', '(Day 2 continued from ' + appointmentDate + ') ' + (bookingNotes || ''), customer.id]
      );
      await pool.query(
        'INSERT INTO work_orders (booking_id, customer_id) VALUES ($1,$2)',
        [day2Booking.id, customer.id]
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
  const { rows: bookings } = await pool.query(`
    SELECT b.id, b.date, b.time, b.duration, b.name, b.email, b.phone, b.address,
           b.service, b.price, b.notes, b.customer_id, b.created_at,
           wo.id as work_order_id
    FROM bookings b
    LEFT JOIN work_orders wo ON wo.booking_id = b.id
    ORDER BY b.date, b.time
  `);
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

// --- Admin Pricing API ---

// GET /api/admin/pricing
app.get('/api/admin/pricing', requireAdmin, async (req, res) => {
  try {
    const { rows: services } = await pool.query('SELECT * FROM services ORDER BY category, sort_order, id');
    const { rows: discounts } = await pool.query('SELECT * FROM discounts ORDER BY min_services, id');
    const { rows: schedule } = await pool.query(
      `SELECT ps.*, s.label as service_label, d.label as discount_label
       FROM pricing_schedule ps
       LEFT JOIN services s ON ps.service_id = s.id
       LEFT JOIN discounts d ON ps.discount_id = d.id
       WHERE ps.applied = false ORDER BY ps.effective_date`
    );
    res.json({ services, discounts, schedule });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load pricing data' });
  }
});

// POST /api/admin/pricing/service/:id — immediate update
app.post('/api/admin/pricing/service/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { field, value } = req.body;
  if (!['price', 'duration'].includes(field)) {
    return res.status(400).json({ error: 'Invalid field' });
  }
  const numVal = field === 'price' ? parseInt(value) : parseFloat(value);
  if (isNaN(numVal) || numVal <= 0) {
    return res.status(400).json({ error: 'Invalid value' });
  }
  await pool.query(`UPDATE services SET ${field} = $1 WHERE id = $2`, [numVal, parseInt(id)]);
  invalidatePricingCache();
  res.json({ success: true });
});

// POST /api/admin/pricing/discount/:id — immediate update
app.post('/api/admin/pricing/discount/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { percent } = req.body;
  const numVal = parseInt(percent);
  if (isNaN(numVal) || numVal < 0 || numVal > 100) {
    return res.status(400).json({ error: 'Invalid percent' });
  }
  await pool.query('UPDATE discounts SET percent = $1 WHERE id = $2', [numVal, parseInt(id)]);
  invalidatePricingCache();
  res.json({ success: true });
});

// POST /api/admin/pricing/schedule — schedule a future change
app.post('/api/admin/pricing/schedule', requireAdmin, async (req, res) => {
  const { service_id, discount_id, field, new_value, effective_date } = req.body;
  if (!effective_date || new_value === undefined || new_value === '' || !field) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (!service_id && !discount_id) {
    return res.status(400).json({ error: 'Must specify service_id or discount_id' });
  }
  await pool.query(
    'INSERT INTO pricing_schedule (service_id, discount_id, field, new_value, effective_date) VALUES ($1, $2, $3, $4, $5)',
    [service_id || null, discount_id || null, field, String(new_value), effective_date]
  );
  res.json({ success: true });
});

// DELETE /api/admin/pricing/schedule/:id
app.delete('/api/admin/pricing/schedule/:id', requireAdmin, async (req, res) => {
  await pool.query('DELETE FROM pricing_schedule WHERE id = $1 AND applied = false', [req.params.id]);
  res.json({ success: true });
});

// DELETE /api/admin/bookings/:id — cancel booking by id
app.delete('/api/admin/bookings/:id', requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  await pool.query('DELETE FROM bookings WHERE id = $1', [id]);
  res.json({ success: true });
});

// POST /api/admin/bookings — admin manual booking (no availability check)
app.post('/api/admin/bookings', requireAdmin, async (req, res) => {
  const { name, email, phone, address, service, date, time, duration, price, notes } = req.body;
  try {
    const customer = await upsertCustomer(name, email, phone, address);
    const { rows: [booking] } = await pool.query(
      'INSERT INTO bookings (date, time, duration, name, email, phone, address, service, price, notes, customer_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id',
      [date, time, parseInt(duration) || 1, name || '', email || '', phone || '', address || '', service || '', price || '', notes || '', customer.id]
    );
    await pool.query(
      'INSERT INTO work_orders (booking_id, customer_id) VALUES ($1,$2)',
      [booking.id, customer.id]
    );
    res.json({ success: true, booking_id: booking.id });
  } catch (e) {
    console.error('Manual booking error:', e.message);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// GET /api/admin/customers — list all customers with booking count + last service date
app.get('/api/admin/customers', requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.*, COUNT(b.id)::integer as booking_count, MAX(b.date) as last_service_date
      FROM customers c
      LEFT JOIN bookings b ON b.customer_id = c.id
      GROUP BY c.id
      ORDER BY c.name
    `);
    res.json({ customers: rows });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load customers' });
  }
});

// GET /api/admin/customers/:id — customer detail with bookings
app.get('/api/admin/customers/:id', requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { rows: customers } = await pool.query('SELECT * FROM customers WHERE id = $1', [id]);
    if (!customers.length) return res.status(404).json({ error: 'Not found' });
    const customer = customers[0];
    const { rows: bookings } = await pool.query(
      'SELECT b.*, wo.id as work_order_id FROM bookings b LEFT JOIN work_orders wo ON wo.booking_id = b.id WHERE b.customer_id = $1 ORDER BY b.date DESC',
      [id]
    );
    res.json({ customer, bookings });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load customer' });
  }
});

// PATCH /api/admin/customers/:id — update customer notes
app.patch('/api/admin/customers/:id', requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { notes } = req.body;
    await pool.query('UPDATE customers SET notes = $1 WHERE id = $2', [notes || '', id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// GET /api/admin/work-orders/:id — get work order with booking + customer info
app.get('/api/admin/work-orders/:id', requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { rows } = await pool.query(`
      SELECT wo.*,
        b.date, b.time, b.duration,
        b.name as booking_name, b.email as booking_email, b.phone as booking_phone,
        b.address as booking_address, b.service, b.price, b.notes as booking_notes,
        c.name as customer_name, c.notes as customer_notes
      FROM work_orders wo
      LEFT JOIN bookings b ON wo.booking_id = b.id
      LEFT JOIN customers c ON wo.customer_id = c.id
      WHERE wo.id = $1
    `, [id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Failed to load work order' });
  }
});

// PATCH /api/admin/work-orders/:id — update status flags and/or admin_notes
app.patch('/api/admin/work-orders/:id', requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status_job_complete, status_invoiced, status_invoice_paid, status_paid, admin_notes } = req.body;

    // Fetch current state before update
    const { rows: current } = await pool.query('SELECT * FROM work_orders WHERE id = $1', [id]);
    if (!current.length) return res.status(404).json({ error: 'Not found' });
    const before = current[0];

    const updates = [];
    const values = [];
    let idx = 1;
    if (status_job_complete !== undefined) { updates.push(`status_job_complete = $${idx++}`); values.push(status_job_complete); }
    if (status_invoiced !== undefined) { updates.push(`status_invoiced = $${idx++}`); values.push(status_invoiced); }
    if (status_invoice_paid !== undefined) { updates.push(`status_invoice_paid = $${idx++}`); values.push(status_invoice_paid); }
    if (status_paid !== undefined) { updates.push(`status_paid = $${idx++}`); values.push(status_paid); }
    if (admin_notes !== undefined) { updates.push(`admin_notes = $${idx++}`); values.push(admin_notes); }
    if (updates.length === 0) return res.json({ success: true, email_sent: null });
    values.push(id);
    await pool.query(`UPDATE work_orders SET ${updates.join(', ')} WHERE id = $${idx}`, values);

    // Detect if invoiced or invoice_paid flipped false→true and send email
    let email_sent = null;
    const invoicedChanged = status_invoiced === true && !before.status_invoiced;
    const paidChanged = status_invoice_paid === true && !before.status_invoice_paid;

    if (invoicedChanged || paidChanged) {
      const { rows: woRows } = await pool.query(`
        SELECT wo.*, b.date, b.time, b.duration,
          b.name as booking_name, b.email as booking_email, b.phone as booking_phone,
          b.address as booking_address, b.service, b.price, b.notes as booking_notes,
          c.name as customer_name
        FROM work_orders wo
        LEFT JOIN bookings b ON wo.booking_id = b.id
        LEFT JOIN customers c ON wo.customer_id = c.id
        WHERE wo.id = $1
      `, [id]);

      if (woRows.length) {
        const wo = woRows[0];
        const recipientEmail = wo.booking_email;
        const dateLabel = wo.date
          ? new Date(wo.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
          : '—';

        if (invoicedChanged && recipientEmail) {
          const deadline = new Date();
          deadline.setDate(deadline.getDate() + 5);
          const deadlineLabel = deadline.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
          try {
            await transporter.sendMail({
              from: 'dgsoftwash@yahoo.com',
              to: recipientEmail,
              subject: `D&G Soft Wash - Invoice #${id}`,
              html: generateInvoiceEmail(wo, id, dateLabel, deadlineLabel)
            });
            email_sent = 'invoice';
          } catch (emailErr) {
            console.error('Invoice email failed:', emailErr.message);
          }
        } else if (paidChanged && recipientEmail) {
          try {
            await transporter.sendMail({
              from: 'dgsoftwash@yahoo.com',
              to: recipientEmail,
              subject: `D&G Soft Wash - Payment Receipt #${id}`,
              html: generatePaidEmail(wo, id, dateLabel)
            });
            email_sent = 'paid';
          } catch (emailErr) {
            console.error('Paid receipt email failed:', emailErr.message);
          }
        }
      }
    }

    res.json({ success: true, email_sent });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update work order' });
  }
});

// POST /api/admin/email — send email to one or more customers
app.post('/api/admin/email', requireAdmin, async (req, res) => {
  const { to, subject, message } = req.body;
  if (!to || !to.length || !subject || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    for (const recipient of to) {
      if (!recipient.email) continue;
      await transporter.sendMail({
        from: 'dgsoftwash@yahoo.com',
        to: recipient.email,
        subject: subject,
        text: message
      });
    }
    res.json({ success: true });
  } catch (e) {
    console.error('Admin email failed:', e.message);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// GET /api/admin/work-orders — list all work orders
app.get('/api/admin/work-orders', requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT wo.*, b.date, b.time, b.duration,
        b.name as booking_name, b.email as booking_email, b.phone as booking_phone,
        b.address as booking_address, b.service, b.price, b.notes as booking_notes,
        c.name as customer_name
      FROM work_orders wo
      LEFT JOIN bookings b ON wo.booking_id = b.id
      LEFT JOIN customers c ON wo.customer_id = c.id
      ORDER BY wo.created_at DESC
    `);
    res.json({ work_orders: rows });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load work orders' });
  }
});

// --- Start server ---
initDb().then(() => {
  applyDuePricingSchedules();
  // Re-check scheduled pricing changes every hour
  setInterval(applyDuePricingSchedules, 60 * 60 * 1000);
  app.listen(PORT, () => {
    console.log(`D&G Soft Wash website running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
