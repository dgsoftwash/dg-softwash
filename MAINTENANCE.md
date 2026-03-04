# D&G Soft Wash — Maintenance Commands Reference

All commands are run from the project directory on the **Mac Mini**:
```
cd /Volumes/1TB\ SSD/dg-softwash
```

---

## SERVER MANAGEMENT

| What | Command |
|------|---------|
| **Restart server** (pick up code changes) | `pm2 reload dg-softwash` |
| **Check server status** | `pm2 list` |
| **View live server logs** (errors, crashes) | `pm2 logs dg-softwash` |
| **View last 50 log lines** | `pm2 logs dg-softwash --lines 50` |
| **Stop server** | `pm2 stop dg-softwash` |
| **Start server** (if stopped) | `pm2 start ecosystem.config.js` |
| **See what's on port 3000** | `lsof -i:3000` |

---

## TESTING

| What | Command |
|------|---------|
| **Basic test** — non-intrusive, no data written | `bash test-basic.sh` |
| **Full test** — all features, writes+deletes data, sends emails to service@dgsoftwash.com | `bash test-full.sh` |

**Basic test** checks: auth, all public pages, all public APIs, all admin APIs,
auth protection, dashboard fields, database connectivity. Safe to run anytime.

**Full test** checks: customer CRUD, email list signup (create + upsert + email_list flag),
bookings, work orders (job complete / invoiced / paid / mileage), email sending (invoice,
quote, review request), expenses, gallery upload & image serving, settings, dashboard,
payments, pricing. Cleans up everything when done.

---

## DATABASE (PostgreSQL — local on Mac Mini)

| What | Command |
|------|---------|
| **Check row counts in all tables** | `node -e "const{Pool}=require('pg');require('dotenv').config();const p=new Pool({connectionString:process.env.DATABASE_URL});async function r(){const t=['bookings','customers','work_orders','expenses','gallery_items','settings','reviews'];for(const x of t){const{rows}=await p.query('SELECT COUNT(*) FROM '+x);console.log(x+': '+rows[0].count)}p.end();}r()"` |
| **Wipe ALL data (nuclear reset — irreversible)** | `node -e "const{Pool}=require('pg');require('dotenv').config();const p=new Pool({connectionString:process.env.DATABASE_URL});p.query('DELETE FROM work_orders').then(()=>p.query('DELETE FROM bookings')).then(()=>p.query('DELETE FROM customers')).then(()=>p.query('DELETE FROM expenses')).then(()=>p.query('DELETE FROM gallery_items')).then(()=>{console.log('WIPED');p.end()})"` |
| **Check if DB is reachable** | `curl -sf http://localhost:3000/api/gallery \| head -c 100` |
| **Open psql shell** | `psql dgsoftwash` |
| **Backup database** | `pg_dump dgsoftwash --no-acl --no-owner -Fc -f ~/Desktop/backup_$(date +%Y%m%d).dump` |
| **Restore from backup** | `pg_restore -d dgsoftwash --no-acl --no-owner ~/Desktop/backup_YYYYMMDD.dump` |
| **Check PostgreSQL service** | `brew services list \| grep postgresql` |
| **Restart PostgreSQL** | `brew services restart postgresql@15` |

---

## CODE CHANGES

Whenever you edit a `.js` or `.html` file, restart the server to load the changes:
```
pm2 reload dg-softwash
```

---

## SERVICE WORKER CACHE

The service worker (`public/service-worker.js`) caches public pages (`/`, `/services`,
`/pricing`, `/gallery`, `/reviews`, `/contact`) for offline/fast loading. Whenever you update HTML
files, **bump the cache version** so browsers drop stale content:

```js
// public/service-worker.js — line 1
const CACHE = 'dg-softwash-v3';  // increment each time HTML changes
```

Current version: **v10** (bumped 2026-02-28 after adding Share button to all public pages)

Also add `/reviews` to `STATIC_ASSETS` array when adding new public pages.

---

## COMMON TROUBLESHOOTING

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Site down | Server crashed | Check `pm2 logs`, then `pm2 reload` |
| "Cannot connect to database" errors | PostgreSQL not running | `brew services start postgresql@15` |
| Cloudflare Tunnel down | cloudflared not running | `sudo launchctl start com.cloudflare.cloudflared` |
| Emails not sending | Yahoo SMTP app password expired | Re-generate Yahoo app password, update `YAHOO_APP_PASSWORD` in `.env`, then `pm2 reload` |
| Admin login fails | Password missing from .env | Check `ADMIN_PASSWORD` in `.env` |
| Gallery images not loading | Image stored as bad base64 | Delete item in admin gallery tab, re-upload |
| Changes not appearing after deploy | Server not reloaded | `pm2 reload dg-softwash` |
| Old pages showing after HTML update | Service worker serving stale cache | Bump cache version in `public/service-worker.js`, then `pm2 reload` |
| Email popup appears every page visit | localStorage `dgEmailPopupDone` not set | Check browser isn't in incognito; open DevTools → Application → Local Storage to verify |
| Need to re-test popup (reset flag) | `dgEmailPopupDone` set in localStorage | DevTools → Application → Local Storage → delete `dgEmailPopupDone` |
| Site doesn't come back after reboot | PM2 or cloudflared autostart not set | Re-run `pm2 startup && pm2 save` and `sudo cloudflared service install` |
| PM2 shows "errored" after reboot (EPERM on 1TB SSD) | PM2 daemon lacks disk access | Run `pm2 kill` then `cd /Volumes/1TB\ SSD/dg-softwash && pm2 start ecosystem.config.js && pm2 save` |
| Cloudflare Tunnel not running after reboot | launchd timing issue | Run `sudo launchctl start com.cloudflare.cloudflared` |

---

## FEATURE REFERENCE

### Email List Signup Popup (added 2026-02-26)
- Popup appears after 5 seconds on all public pages; shown only once per browser (localStorage flag `dgEmailPopupDone`)
- Submits to `POST /api/email-signup` — creates or updates customer with `email_list = true`
- Opted-in customers show a green **📧 Email List** badge in the admin Customers tab
- **10% Email List discount** checkbox available in the Generate WO and Quote modals
- Dismiss via ×, "No thanks", or clicking outside the popup — all set the localStorage flag
- Mobile-optimized: 16px input font (prevents iOS Safari zoom), larger tap targets, tighter padding on small screens

**To test popup on your phone** (same WiFi as Mac Mini):
- Open `http://<mac-mini-local-ip>:3000` on your phone
- Use a private/incognito tab to get fresh localStorage
- Wait 5 seconds — popup should appear

**Full flow test — PASSED 2026-02-27** ✅
1. Popup appears after 5s ✓
2. Signup creates customer with 📧 Email List badge in admin ✓
3. Email List – 1st Service (10%) checkbox present in Generate WO modal ✓
4. Price recalculates with 10% off when checked ✓

---

## HOSTING (Self-Hosted — Mac Mini)

**Live URL: https://dgsoftwash.com** (via Cloudflare Tunnel)

The app runs on the Mac Mini 24/7 via:
- **PM2** — keeps Node/Express running, auto-restarts on crash, starts on Mac login
- **Cloudflare Tunnel** (`cloudflared`) — exposes localhost:3000 to the internet as https://dgsoftwash.com without port forwarding or a static IP
- **PostgreSQL 15** (Homebrew) — local database, starts on Mac login via `brew services`

Environment variables are in `.env` in the project root (not a hosting dashboard):
- `DATABASE_URL` — `postgresql://localhost/dgsoftwash`
- `ADMIN_PASSWORD` — Admin login password
- `YAHOO_APP_PASSWORD` — Yahoo SMTP app password for emails
- `GOOGLE_REVIEW_URL` — Your Google review link (optional)
- `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM_NUMBER` — SMS (optional)

### Cloudflare Tunnel management
```bash
# Check tunnel status
sudo launchctl list | grep cloudflare

# Start/stop tunnel service
sudo launchctl start com.cloudflare.cloudflared
sudo launchctl stop com.cloudflare.cloudflared

# Run tunnel manually (for debugging)
cloudflared tunnel run dg-softwash

# View tunnel config
cat ~/.cloudflared/config.yml
```

---

### Reviews / Testimonials (added 2026-02-28)
- Public `/reviews` page with two modes: **Submit a Review** (shows top 5 + form) and **Read All Reviews** (shows 10 + Load More + form)
- Homepage "What Our Customers Say" section shows up to 6 approved/live reviews; two buttons link to each mode
- Customer submits → review goes **live immediately** on the public site (no approval message shown)
- Admin → Reviews tab shows all reviews; **"Pending Review"** badge = needs your action
  - **Approve** → makes it permanent (survives forever)
  - **Delete** → removes immediately
  - **Reply** → opens focused modal to write a public response (shown below review on site)
  - **Edit** → edit all fields
- **Auto-delete**: reviews not approved within 8 hours are automatically deleted (background job runs every 15 min)
- Admin-added reviews (via + Add Review) are always auto-approved
- DB table: `reviews` — columns: id, customer_name, star_rating, review_text, service_type, status, source, admin_response, created_at

**Reviews nav link** is in the navbar and footer of all public pages.

---

## EMAIL LINK BEHAVIOR (updated 2026-02-27)

Email links on all public pages use standard `mailto:service@dgsoftwash.com`.
- On mobile: opens mail app automatically ✓
- On desktop: opens whatever email client is set as default in the browser
- David's Mac (Chrome): Yahoo Mail set as mailto handler in chrome://settings/handlers
- If mailto stops working in Chrome: go to chrome://settings/handlers → re-add yahoo.com or outlook.office365.com as the email handler

---

### Share Button (added 2026-02-28)
- "📤 Share Our Site" button in the footer-bottom of all 6 public pages
- On mobile (iOS/Android): opens native share sheet via Web Share API
- On desktop: copies site URL to clipboard, button text changes to "✓ Link Copied!" for 2 seconds
- JS logic in `public/js/main.js`, styles in `public/css/styles.css` (.share-btn)

---

*Last updated: 2026-03-03 (migrated to Mac Mini self-hosted + Cloudflare Tunnel)*
