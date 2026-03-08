# D&G Soft Wash — Maintenance Commands Reference

All commands are run from the project directory on the **Mac Mini**:
```
cd /Volumes/1TB\ SSD/dg-softwash
```

---

## GIT / GITHUB

| What | Command |
|------|---------|
| **Push changes** | `cd "/Volumes/1TB SSD/dg-softwash" && git add -A && git commit -m "message" && git push origin main` |
| **Check status** | `git status` |

SSH key: `~/.ssh/id_ed25519_dgsoftwash` (linked to dgsoftwash GitHub account)
Remote: `git@github-dgsoftwash:dgsoftwash/dg-softwash.git`

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

> **Note:** PostgreSQL data directory is on the **internal 256GB SSD** (`/opt/homebrew/var/postgresql@15`) — this is intentional for reliability. Project code is on the 1TB SSD.

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

Current version: **v14** (bumped 2026-03-06 — hamburger menu fix + share button fix + deck pricing dimensions)

Widget refresh interval: **10s** (reduced from 30s for faster UPS status updates)

Also add `/reviews` to `STATIC_ASSETS` array when adding new public pages.

---

## COMMON TROUBLESHOOTING

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Site down | Server crashed | Check `pm2 logs`, then `pm2 reload` |
| "Cannot connect to database" errors | PostgreSQL not running | `brew services start postgresql@15` |
| Cloudflare Tunnel down (Error 1033) | cloudflared stopped or broken | Stop service, reinstall, restart: see Cloudflare Tunnel section below |
| Site shows "Not Secure" in Safari | HTTP not redirecting to HTTPS | Enable "Always Use HTTPS" in Cloudflare: dash.cloudflare.com → SSL/TLS → Edge Certificates. Server also redirects via X-Forwarded-Proto header. |
| Emails not sending | Zoho SMTP auth failed or password changed | Check `ZOHO_APP_PASSWORD` in `.env` — host is `smtp.zoho.com`, port 465, user `service@dgsoftwash.com` |
| Admin login fails | Password missing from .env | Check `ADMIN_PASSWORD` in `.env` |
| Gallery images not loading | Image stored as bad base64 | Delete item in admin gallery tab, re-upload |
| Changes not appearing after deploy | Server not reloaded | `pm2 reload dg-softwash` |
| Old pages showing after HTML update | Service worker serving stale cache | Bump cache version in `public/service-worker.js`, then `pm2 reload` |
| Hamburger menu stuck on mobile | Old JS cached or Safari iOS quirk | Close Safari fully (swipe away), reopen site; if persists check `public/js/main.js` menu code |
| Email popup appears every page visit | localStorage `dgEmailPopupDone` not set | Check browser isn't in incognito; open DevTools → Application → Local Storage to verify |
| Need to re-test popup (reset flag) | `dgEmailPopupDone` set in localStorage | DevTools → Application → Local Storage → delete `dgEmailPopupDone` |
| Site doesn't come back after reboot | Auto-boot script failed | Check `cat /tmp/boot-recovery.log` for errors; run `bash /Users/david/boot-recovery.sh` manually |
| PM2 shows "errored" after reboot (EPERM on 1TB SSD) | PM2 daemon launched by LaunchAgent has restricted SSD access | Kill and restart daemon from terminal: `pm2 kill && cd "/Volumes/1TB SSD/dg-softwash" && pm2 start server.js --name dg-softwash && pm2 save` |
| PostgreSQL won't start after reboot (stale PID) | Hard reboot left postmaster.pid behind | `rm /opt/homebrew/var/postgresql@15/postmaster.pid` then `pg_ctl -D /opt/homebrew/var/postgresql@15 start` |
| Cloudflare Tunnel not running after reboot | launchd timing issue | Run `sudo cloudflared service uninstall && sudo cloudflared service install` then reboot |

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
- **PostgreSQL 15** (Homebrew) — local database, started by boot-recovery.sh on login

### Auto-Boot Script (added 2026-03-04)
`/Users/david/boot-recovery.sh` runs at login via `~/Library/LaunchAgents/pm2.david.plist`.

Handles boot-order issues automatically:
1. Waits up to 60s for the 1TB SSD to mount
2. Fixes permissions (`chmod -R 755`)
3. Removes stale Postgres `postmaster.pid` if left by a hard reboot
4. Starts PostgreSQL and waits until ready
5. Resurrects PM2 processes
6. Opens ICloud Backup Manager and Activity Monitor via `open -a`

**Check boot log:** `cat /tmp/boot-recovery.log`
**Run manually:** `bash /Users/david/boot-recovery.sh`

Environment variables are in `.env` in the project root (not a hosting dashboard):
- `DATABASE_URL` — `postgresql://localhost/dgsoftwash`
- `ADMIN_PASSWORD` — Admin login password
- `ZOHO_APP_PASSWORD` — Zoho SMTP password for service@dgsoftwash.com (switched from Yahoo 2026-03-06, tested OK)
- `GOOGLE_REVIEW_URL` — Your Google review link (optional)
- `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM_NUMBER` — SMS (optional)

### Cloudflare Tunnel management
```bash
# Check tunnel status
sudo launchctl list | grep cloudflare

# If site shows Error 1033 — full reset (most reliable fix):
sudo launchctl stop com.cloudflare.cloudflared
sudo cloudflared service uninstall
sudo cloudflared service install
sudo launchctl start com.cloudflare.cloudflared

# If still down after the above — run manually to restore immediately:
cloudflared tunnel run dg-softwash
# (keep this terminal open — Ctrl+C will drop the tunnel)

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
- If mailto stops working in Chrome: go to chrome://settings/handlers → re-add your email handler

---

### Share Button (added 2026-02-28, fixed 2026-03-06)
- "📤 Share Our Site" button in the footer-bottom of all 6 public pages
- On mobile (iOS/Android): opens native share sheet via Web Share API
- On desktop: copies site URL to clipboard, button text changes to "✓ Link Copied!" for 2 seconds
- JS logic in `public/js/main.js`, styles in `public/css/styles.css` (.share-btn)
- **Fix (2026-03-06):** URL updated from old Render URL to `https://dgsoftwash.com`; added `.catch()` to `navigator.share()` Promise — unhandled rejection was freezing the page when user cancelled/dismissed the share dialog; also added clipboard fallback with `window.prompt()`

### Gabe's Scholarship Guide (added 2026-03-08)
- Integrated scholarship guide at `/gabe` (public) and `/gabe/admin` (admin panel)
- Originally a standalone app at `~/Desktop/Gabe College /scholarship-guide/`
- Data stored in `data/scholarships.json` (JSON file, not PostgreSQL)
- Admin password: `bemish2026`
- AI-powered scholarship discovery uses Anthropic API (key in `.env` as `ANTHROPIC_API_KEY`)
- Uses `@anthropic-ai/sdk` npm package with `claude-haiku-4-5-20251001` model
- All routes prefixed with `/gabe/`: `/gabe/api/scholarships`, `/gabe/api/admin/*`
- Service worker bumped to v16

### Flag Background Image (fixed 2026-03-07)
- Flag was loaded from Wikimedia Commons (external URL) — they started returning HTTP 429 (rate limited)
- Downloaded flag as SVG and now hosted locally at `/images/flag.svg`
- Both `.hero::before` and `.page-header::before` in `styles.css` updated to use local path
- SVG scales perfectly at any resolution, only 765 bytes
- Service worker bumped to v15

### Error Log Thresholds (updated 2026-03-07)
- Widget error log shows **red** (critical) and **yellow** (warning) level errors only
- CPU alert thresholds: >80% = yellow, >90% = red (was 70/85)
- Memory alert thresholds: >80% = yellow, >90% = red (was 70/85)
- This reduces noise from normal system memory fluctuations

### BackupWidget Path (fixed 2026-03-07)
- Backup widget route `/backup-widget` was pointing to old path `~/Desktop/Misc Script Files /BackupWidget.html`
- Fixed to new path: `~/Desktop/D&G Soft Wash/Misc Script Files /BackupWidget.html`

### Mobile Hamburger Menu (fixed 2026-03-06)
- Hamburger (☰) was getting stuck after first use on Safari iOS — second tap did nothing
- Root cause: Safari iOS has quirks with `classList.toggle` — replaced with explicit open/close state tracking via JS variable
- Added dedicated `touchend` handler for iOS alongside `click`
- Added tap-outside-to-close and `pageshow` reset for back-forward cache
- Code in `public/js/main.js` — uses IIFE with `menuOpen` boolean, `openMenu()`/`closeMenu()` functions, inline `style.display` instead of CSS class toggling

---

---

## SERVER HEALTH WIDGET (added 2026-03-04, updated 2026-03-04)

A one-stop GUI for monitoring and controlling the full server stack.

**Access:** Open `http://localhost:3000/widget` in any browser (served by Node app — no file:// issues).
Enter admin password once → stored in `localStorage` → auto-refreshes every 30s.

**Native Desktop App:** `/Applications/DG Softwash Monitor.app`
- Floating always-on-top native macOS window (built with Swift + WKWebView)
- Remembers size and position across reboots automatically
- Opens automatically at login via LaunchAgent `com.dgsoftwash.widget.plist` with **KeepAlive** (auto-restarts if it crashes)
- Drag to Dock for quick access
- Built from: `/tmp/dgmonitor-build/main.swift` (recompile with `swiftc -framework Cocoa -framework WebKit main.swift -o DGMonitor`)

**Widget files:**
- Source: `/Volumes/1TB SSD/server-widget/ServerWidget.html`
- After editing widget HTML: `cp "/Volumes/1TB SSD/server-widget/ServerWidget.html" ~/Desktop/ServerWidget.html` (desktop copy kept in sync)

**What it shows:**
- Services: Website (HTTPS + latency), Node App (PM2 status/restarts/uptime), PostgreSQL (query latency), Cloudflare Tunnel
- Storage: Internal 256GB, 1TB SSD, 2TB HDD (usage bars), 4TB SSD placeholder
- System: CPU load %, memory %, 1-min load average
- Top Processes: top 10 by CPU with name, CPU%, MEM%, PID (Activity Monitor style)
- Controls: PM2 and PostgreSQL start/stop/restart, Cloudflare copy-to-clipboard commands, Tools (fix perms, fix PG PID, basic test, boot recovery)
- Error log: rolling last 200 entries (FIFO), always visible, scrollable, with Clear button — persisted in localStorage
- Boot log: expandable, scrollable (220px)

**Remote access (phone/cellular):** `https://dgsoftwash.com/widget` — works from anywhere, password protected. BASE URL is now dynamic (`window.location.origin`) so the same widget works locally and remotely. Widget is also mobile-responsive.

**API endpoints added to server.js:**
- `GET /api/admin/health` — full health snapshot (requires admin token)
- `POST /api/admin/server/action` — run server management commands (requires admin token)
- `GET /widget` — serves the widget HTML (avoids Safari file:// restrictions)

---

## UPS (added 2026-03-06)

CyberPower CP1000PFCLCD — monitored via `pmset -g batt` (macOS detects it natively).

**Auto-shutdown at 10% battery:**
- Monitor script: `/Users/david/ups-monitor.sh` — runs continuously, checks every 30s
- **Note:** CyberPower reports `UPS Power` (not `Battery Power`) when on battery — both handled in code
- LaunchAgent: `com.dgsoftwash.ups-monitor` (KeepAlive) — starts at login
- Shutdown script: `/Users/david/ups-shutdown.sh` — runs final DB backup, stops PM2, stops PostgreSQL, shuts down Mac
- Monitor log: `cat /tmp/ups-monitor.log`
- Shutdown log: `cat /tmp/ups-shutdown.log`

**Widget:** UPS row in SERVICES section — shows AC Power / ON BATTERY, battery %, time remaining. Turns yellow on battery, red at ≤10%.

---

## OPENCLAW AI AGENT (added 2026-03-06)

Workflow automation AI agent — all data on 1TB SSD.

**Install:** `npm install -g openclaw` (v2026.3.2 installed at `/opt/homebrew/bin/openclaw`)

**Data location:** `~/.openclaw` → symlinked to `/Volumes/1TB SSD/openclaw/state`
- Workspace: `/Volumes/1TB SSD/openclaw/workspace`
- Config: `~/.openclaw/openclaw.json`
- Gateway log: `/Volumes/1TB SSD/openclaw/state/logs/gateway.log`

**Gateway (WebSocket server — required for agents to run):**
- Starts automatically at login via `boot-recovery.sh` (step 7)
- Manual start: `nohup /opt/homebrew/opt/node/bin/node /opt/homebrew/lib/node_modules/openclaw/dist/index.js gateway run --port 18789 >> "/Volumes/1TB SSD/openclaw/state/logs/gateway.log" 2>&1 &` — or use **Start Gateway** button in widget Controls
- Health check: `openclaw gateway health`
- Token: in `~/.openclaw/openclaw.json` → `gateway.auth.token`
- Note: LaunchAgent removed (macOS launchd throttles it with EX_CONFIG permanently). Gateway runs via `nohup` from boot-recovery.sh — fully detached from shell so it stays up
- If config gets corrupted (invalid keys): `openclaw doctor --fix` then restart gateway
- Telegram channel removed from config — was causing invalid key crashes

**Key commands:**
| What | Command |
|------|---------|
| Check health | `openclaw gateway health` |
| Run diagnostics | `openclaw doctor` |
| Check model/API key | `openclaw models status` |
| Open dashboard | `openclaw dashboard` |
| List agents | `openclaw agents` |

**Model:** `anthropic/claude-opus-4-6` (API key stored in `~/.openclaw/agents/main/agent/auth-profiles.json`)

---

## BACKBLAZE CLOUD BACKUP (added 2026-03-06)

Offsite cloud backup via Backblaze Personal Backup — $99/year, unlimited storage.

**Drives backed up:**
- Internal 256GB SSD (/) ✓
- 1TB SSD ✓
- 2TB HDD ✓
- 4TB SSD ✗ — intentionally excluded (it's the Time Machine destination; Backblaze blocks TM drives by design — data is already covered via source drives above)

**Auto-start:** Runs as root LaunchDaemon (`com.backblaze.bzserv`, KeepAlive) — starts at boot, no login needed
**Schedule:** Once per day (continuous when active)
**Status file:** `/Library/Backblaze.bzpkg/bzdata/overviewstatus.xml`
**Config file:** `/Library/Backblaze.bzpkg/bzdata/bzinfo.xml`
**Widget:** Backblaze row in SERVICES section — green=running, red=not running

**If Backblaze stops backing up:**
1. Check menu bar icon or System Settings → Backblaze
2. Verify drives are still listed under Settings → Drives
3. Check account status at backblaze.com (login: dbemish82@yahoo.com)
4. Restart service: `sudo launchctl kickstart -k system/com.backblaze.bzserv`

---

## SLEEP / ALWAYS-ON (updated 2026-03-04)

Mac Mini is configured to never sleep so the server stays up 24/7.

Sleep is enforced by a LaunchDaemon that reapplies settings at every boot:
`/Library/LaunchDaemons/com.dgsoftwash.nosleep.plist`

Current settings: `sleep 0, disksleep 0, hibernatemode 0, standby 0, powernap 0`
(Display sleep at 10 min is fine — does not affect the server.)

**If sleep settings ever reset manually:**
```bash
sudo pmset -a sleep 0 disksleep 0 hibernatemode 0 standby 0 powernap 0
```

**Activity Monitor** and **ICloud Backup Manager** open automatically at every login via `boot-recovery.sh` (step 7 — `open -a` calls at end of script). These are launched this way because macOS blocks Fluid apps from being spawned directly by launchd.

---

---

## BACKUP SYSTEM (added 2026-03-04)

Real backups to 2TB HDD via the Backup Widget on the Desktop.

**Backup script:** `/Users/david/backup.sh [items]` (home dir copy — LaunchAgent uses this; 1TB SSD original at `/Volumes/1TB SSD/backup.sh` — keep in sync if editing)
- Items: `photos,documents,desktop,dg-softwash,database` (default: all)
- Destination: `/Volumes/2TB HDD/Backups/`
- DB dumps: `/Volumes/2TB HDD/Backups/database/` (keeps last 7)
- Log: `/Volumes/2TB HDD/backup_log.txt`

**API endpoints (require admin token):**
- `GET /api/admin/backup/status` — current status (running/pct/log/lastBackup)
- `POST /api/admin/backup/run` — start backup `{ items: [...] }`

**Backup Widget App:** `/Applications/Backup Widget.app`
- Opens automatically at login via LaunchAgent `com.dgsoftwash.backup-widget.plist` with **KeepAlive** (auto-restarts if it crashes)
- Login with admin password → token stored in localStorage
- If widget shows "Loading..." after server restart, it will now auto-show login form (token cleared on 401)
- Toggle items on/off, click Run Now — polls status every 2s while running
- Shows real progress, step-by-step log, last backup time

**4TB SSD:** Now live in server widget (`/Volumes/4TB SSD` — connected 2026-03-04)

---

*Last updated: 2026-03-06 (mobile hamburger menu fix — Safari iOS classList.toggle quirk, rewrote with explicit state tracking; deck pricing: added sq ft dimensions for all tiers + "Over 500 sq ft: Call for Estimate"; share button fix: updated URL to dgsoftwash.com + added .catch() for navigator.share Promise that was freezing the page; service worker bumped to v14; Zoho SMTP; new logo; security headers; UPS monitoring + auto-shutdown at 10%; health widget: process monitor + UPS row + OpenClaw row + 10s refresh + remote/mobile access + OpenClaw Start/Stop controls; backup widget 401 fix; backup script moved to ~/backup.sh; SSH keys configured for git push — dgsoftwash key at ~/.ssh/id_ed25519_dgsoftwash, remote: git@github-dgsoftwash:dgsoftwash/dg-softwash.git; OpenClaw AI agent v2026.3.2 installed — data on 1TB SSD, gateway runs via nohup from boot-recovery.sh, LaunchAgent removed, Telegram channel config removed; expense date fixed — expenses were saving correctly but PostgreSQL date column returned as full ISO timestamp causing "Invalid Date" display; fixed by casting date to YYYY-MM-DD in SQL query and adding .split('T')[0] safety in display code; HTTP→HTTPS redirect enabled — Cloudflare Always Use HTTPS on + server-side X-Forwarded-Proto 301 redirect, http://dgsoftwash.com now redirects to https://)*
