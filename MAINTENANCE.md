# D&G Soft Wash — Maintenance Commands Reference

All commands are run from the project directory:
```
cd /Users/davidbemish/Desktop/dg-softwash
```

---

## SERVER MANAGEMENT

| What | Command |
|------|---------|
| **Restart server** (pick up code changes) | `node_modules/pm2/bin/pm2 reload dg-softwash` |
| **Check server status** | `node_modules/pm2/bin/pm2 list` |
| **View live server logs** (errors, crashes) | `node_modules/pm2/bin/pm2 logs dg-softwash` |
| **View last 50 log lines** | `node_modules/pm2/bin/pm2 logs dg-softwash --lines 50` |
| **Stop server** | `node_modules/pm2/bin/pm2 stop dg-softwash` |
| **Start server** (if stopped) | `node_modules/pm2/bin/pm2 start dg-softwash` |
| **See what's on port 3000** | `lsof -i:3000` |

---

## TESTING

| What | Command |
|------|---------|
| **Basic test** — non-intrusive, no data written | `bash test-basic.sh` |
| **Full test** — all features, writes+deletes data, sends emails to dgsoftwash@yahoo.com | `bash test-full.sh` |

**Basic test** checks: auth, all public pages, all public APIs, all admin APIs,
auth protection, dashboard fields, database connectivity. Safe to run anytime.

**Full test** checks: customer CRUD, bookings, work orders (job complete / invoiced /
paid / mileage), email sending (invoice, quote, review request), expenses, gallery
upload & image serving, settings, dashboard, payments, pricing. Cleans up everything
when done.

---

## DATABASE (PostgreSQL on Render)

| What | Command |
|------|---------|
| **Check row counts in all tables** | `node -e "const{Pool}=require('pg');require('dotenv').config();const p=new Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false}});async function r(){const t=['bookings','customers','work_orders','expenses','gallery_items','settings'];for(const x of t){const{rows}=await p.query('SELECT COUNT(*) FROM '+x);console.log(x+': '+rows[0].count)}p.end();}r()"` |
| **Wipe ALL data (nuclear reset — irreversible)** | `node -e "const{Pool}=require('pg');require('dotenv').config();const p=new Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false}});p.query('DELETE FROM work_orders').then(()=>p.query('DELETE FROM bookings')).then(()=>p.query('DELETE FROM customers')).then(()=>p.query('DELETE FROM expenses')).then(()=>p.query('DELETE FROM gallery_items')).then(()=>{console.log('WIPED');p.end()})"` |
| **Check if DB is reachable** | `curl -sf http://localhost:3000/api/gallery \| head -c 100` |

---

## CODE CHANGES

Whenever you edit a `.js` or `.html` file, restart the server to load the changes:
```
node_modules/pm2/bin/pm2 reload dg-softwash
```

---

## COMMON TROUBLESHOOTING

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Site down / 502 on Render | Server crashed | Check `pm2 logs`, then `pm2 reload` |
| "Cannot connect to database" errors | Render DB sleeping | Wait 30s and retry — free tier spins down |
| Emails not sending | Yahoo SMTP app password expired | Re-generate Yahoo app password, update `YAHOO_APP_PASSWORD` env var on Render |
| Admin login fails | Password changed or env var missing | Check `ADMIN_PASSWORD` on Render dashboard |
| Gallery images not loading | Image stored as bad base64 | Delete item in admin gallery tab, re-upload |
| Changes not appearing after deploy | Server not reloaded | `pm2 reload dg-softwash` |

---

## RENDER DEPLOYMENT

Changes are deployed by pushing to GitHub (if auto-deploy is configured), or
manually from the Render dashboard at render.com.

Environment variables (set in Render dashboard, not in .env):
- `DATABASE_URL` — PostgreSQL connection string
- `ADMIN_PASSWORD` — Admin login password
- `YAHOO_APP_PASSWORD` — Yahoo SMTP app password for emails
- `GOOGLE_REVIEW_URL` — Your Google review link (optional)
- `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM_NUMBER` — SMS (optional)

---

*Last updated: 2026-02-20*
