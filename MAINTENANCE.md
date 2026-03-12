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

Current version: **v17** (bumped 2026-03-09 — admin JS email/print fixes)

**Cache-busting:** `admin.js` loaded with `?v=XX` query param in `admin.html` (currently v22). Bump this number when changing admin.js to force iPad/mobile cache refresh.

**Admin page:** Served with `Cache-Control: no-store` header to prevent caching.

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

### Backup Strategy (updated 2026-03-08)
- **Time Machine** → 4TB SSD: automatic, backs up Mac mini internal + 1TB SSD
- 1TB SSD was previously excluded from Time Machine — fixed 2026-03-08
- Replaced Backblaze health check with Time Machine check in server widget
- Widget now shows Time Machine status: green (< 25h), yellow (25-48h stale), red (> 48h stale)
- Last backup time shown in widget
- `checkTimeMachine()` in server.js runs `tmutil latestbackup` to get status
- No more scheduled backup.sh cron — Time Machine handles everything

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

**Backup script:** `/Users/david/backup.sh [items]` (home dir copy — LaunchDaemon uses this; 1TB SSD original at `/Volumes/1TB SSD/backup.sh` — keep in sync if editing)
- Items: `photos,documents,desktop,dg-softwash,database,icloud` (default: icloud)
- Destination: `/Volumes/2TB HDD/Backups/`
- DB dumps: `/Volumes/2TB HDD/Backups/database/` (keeps last 7)
- Log: `/Volumes/2TB HDD/backup_log.txt` (script internal log) + `/tmp/icloud-backup.log` (launchd stdout/stderr)

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

---

## FLOATING WIDGET SYSTEM (added 2026-03-08)

All desktop widgets are floating, borderless, always-on-top macOS apps built with Swift + WKWebView. Each has a drag handle (dark bar with dots at the top).

### Architecture
- **Inline HTML pattern** (docks): Full HTML embedded in Swift binary via string concatenation + HTML entities. Drag + button clicks work via `window.webkit.messageHandlers`.
- **Iframe wrapper pattern** (server/backup/chappie widgets): Inline HTML wrapper with drag grip bar + `<iframe>` loading content from localhost:3000. Drag works on the wrapper; interaction (typing passwords, clicking) works in the iframe.
- **WKUserScript injection** (email sync): Grip bar injected via `WKUserScript` at document end.
- **Key requirement**: `loadHTMLString` (inline) works for messageHandlers. Loading from URL does NOT reliably support `window.webkit.messageHandlers` — use iframe wrapper instead.

### Window Configuration (required for all widgets)
```swift
// KeyWindow subclass — required for keyboard input in borderless windows
class KeyWindow: NSWindow {
    override var canBecomeKey: Bool { true }
    override var canBecomeMain: Bool { true }
}
// FirstMouseWebView — required for click-to-focus without activation
class FirstMouseWebView: WKWebView {
    override func acceptsFirstMouse(for event: NSEvent?) -> Bool { true }
    override func mouseDown(with event: NSEvent) {
        window?.makeKey(); NSApp.activate(ignoringOtherApps: true)
        super.mouseDown(with: event)
    }
}
```
All apps use `LSUIElement = true` (hidden from Dock), `.borderless` style, `.floating` level, `.nonPersistent()` data store.

### Widget Apps (6 total)

| App | LaunchAgent | Type | Content Source |
|-----|-------------|------|----------------|
| Chappie Dock | `com.chappie.dock` | Inline HTML | 9 launch buttons (Chat, Server, Backup, Email, Admin, Website, Gabe, Activity, Terminal) |
| File Dock | `com.chappie.filedock` | Inline HTML | 8 file/app buttons (D&G Soft, Gabe, Brochure, Site Data, Commands, Telegram, Backblaze, Tools) |
| DG Softwash Monitor | `com.dgsoftwash.widget` | Iframe wrapper | `http://localhost:3000/widget` |
| Backup Widget | `com.dgsoftwash.backup-widget` | Iframe wrapper | `http://localhost:3000/backup-widget` |
| Chappie Widget | `com.chappie.widget` | Iframe wrapper | `http://localhost:3000/chappie-widget` (status dot) |
| Email Sync Widget | `com.chappie.emailsyncwidget` | WKUserScript | `http://127.0.0.1:18789/__openclaw__/canvas/email-sync-widget.html` |

### Server Routes (added for widgets)
- `GET /chappie-dock` — ChappieDock.html
- `GET /file-dock` — FileDock.html
- `GET /chappie-widget` — ChappieWidget.html (status indicator)
- `GET /api/chappie-status` — TCP probe to port 18789, returns `{status:"online"|"offline"}`
- `GET /api/dock-config` — reads `/Volumes/1TB SSD/server-widget/docks-config.json`
- `POST /api/dock-config` — writes dock config

### Files
- Widget HTML: `/Volumes/1TB SSD/server-widget/ChappieDock.html`, `FileDock.html`, `ChappieWidget.html`
- Dock config: `/Volumes/1TB SSD/server-widget/docks-config.json`
- Swift sources (permanent): `/Volumes/1TB SSD/openclaw/workspace/widget-sources/*.swift`
- Compiled binaries: `/Applications/*.app/Contents/MacOS/`

### Recompiling a Widget
```bash
cd "/Volumes/1TB SSD/openclaw/workspace/widget-sources"
swiftc -o OutputBin WidgetName.swift -framework Cocoa -framework WebKit
pkill -f "BinaryName"
cp OutputBin "/Applications/AppName.app/Contents/MacOS/BinaryName"
# LaunchAgent auto-restarts it
```

### Desktop Organization
- All files moved to `~/Desktop/Davids Desktop/` (single folder)
- Utility apps in `~/Desktop/Davids Desktop/Chappie Tools/`
- Desktop is clean — everything accessed via floating docks

### Additional Floating Widgets (added 2026-03-09)

| Widget | App | LaunchAgent | Route | HTML |
|--------|-----|-------------|-------|------|
| Time Machine | `/Applications/Time Machine Widget.app` | `com.chappie.tmwidget` | `GET /tm-widget`, `GET /api/timemachine-status` | `/Volumes/1TB SSD/server-widget/TMWidget.html` |
| Backblaze | `/Applications/Backblaze Widget.app` | `com.chappie.bbwidget` | `GET /bb-widget`, `GET /api/backblaze-status` | `/Volumes/1TB SSD/server-widget/BBWidget.html` |

- **Time Machine status API** (`/api/timemachine-status`): uses `tmutil latestbackup` + `tmutil status`, returns green/yellow/red based on age (25h/48h thresholds), blue when actively backing up
- **Backblaze status API** (`/api/backblaze-status`): reads `/Library/Backblaze.bzpkg/bzdata/bzreports/bzdc_synchostinfo.xml` for license status, `overviewstatus.xml` for transmit state, `bzdefcon.xml` for last push age
- Backup Widget (`com.dgsoftwash.backup-widget`) disabled — redundant with server widget; LaunchAgent still exists but unloaded
- Swift sources saved to `/Volumes/1TB SSD/openclaw/workspace/widget-sources/TMWidget.swift` and `BBWidget.swift`

### Credit Card Expense Exclusion (added 2026-03-09)
- **Credit card payment categories** (`AMEX Prime`, `AMEX Blue`, `Chase Ink`, `Capital One Spark`) are **excluded from all expense totals**
- These categories are for tracking PO payments — the actual expense is recorded when the PO is created
- Affected endpoints: dashboard health (`monthly_expenses`, `ytd_expenses`), `/api/admin/year-end-report` (totals + monthly breakdown), `/api/admin/revenue-report` (monthly breakdown)
- CC payments still appear in the expenses list but are visually marked (faded blue rows, "(CC)" tag, blue dollar amounts)
- Summary badges show separate "Expenses" (red) and "CC Payments" (blue, with "not in totals" label)
- Filter total shows "Total (excl CC)"

### Discount Adjustments (added 2026-03-09)
- All discount percentages in Quote and Work Order modals are now **editable** (number inputs instead of hardcoded 10%)
- Added **3+ Services** discount option (default 15%) to both modals
- Discounts: Cash (default 10%), Return (default 10%), Email List (default 10%), 3+ Services (default 15%)
- Quote breakdown and work order notes now show individual discount names and percentages

### Email Sync Fix (2026-03-09)
- Email sync (Yahoo→Zoho) was stuck since March 6 due to **stale lockfile** (`/tmp/yahoo-zoho-sync.lock`)
- Updated cron script to auto-clear lockfiles older than 30 minutes
- Script: `/Volumes/1TB SSD/openclaw/workspace/scripts/yahoo-to-zoho-cron.sh`

### Backblaze Recovery (2026-03-09)
- Backblaze license was accidentally deleted when MacBook Air was removed from account
- Required full uninstall + fresh install to re-register with new auth token
- Account: `dbemish82@yahoo.com`, plan: unlimited yearly, backing up `/`, `/Volumes/1TB SSD/`, `/Volumes/2TB HDD/`
- Schedule: continuous with auto-throttle

### BackupWidget.html Path Fix (2026-03-09)
- `/backup-widget` route was pointing to old path (`~/Desktop/D&G Soft Wash/Misc Script Files /BackupWidget.html`)
- Updated to `~/Desktop/Davids Desktop/D&G Soft Wash/Misc Script Files /BackupWidget.html`

---

### Work Order Email Flow (added 2026-03-09)
Automatic emails are sent to the customer when toggling status buttons in the Work Order modal:

| Status Toggle | Email Type | Details |
|---|---|---|
| **Job Complete** | Payment reminder | "Service Complete — Payment Due Within 10 Days". Shows service, total, due date (red). Call-to-pay button: (757) 330-4260. Payment methods: Cash, Check, Card, PayPal (@dgsoftwash), Venmo (@dgsoftwash). |
| **Invoiced** | Invoice | "Invoice #XX — 30 day terms". Full invoice with amount due, due date, services. For commercial contracts. |
| **Invoice Paid** | Payment receipt | Existing receipt confirmation email. |
| **Paid** | Payment received + review request | "Payment Received — Thank You!" Confirms amount paid, includes ⭐ Leave a Review button (links to dgsoftwash.com/reviews). |

- All emails sent from `service@dgsoftwash.com` via Zoho SMTP
- Recipient: booking email → customer email (fallback chain)
- Green pop-up notification shown in admin UI when email is sent
- Emails only fire on false→true transitions (not on re-toggle)
- **No online payments** — customers call to pay

### Manual Email Buttons (added 2026-03-09)
- **Work Order email button** (📧 Email): Prompts for email address (auto-fills from booking/customer email), sends formatted WO details
- **Purchase Order email button** (📧 Email): Prompts for email (auto-fills from `vendor_email` field on the PO), sends formatted PO with line items
- **PO Print button**: Added `printPO()` function — POs now have Print capability
- Server endpoints: `POST /api/admin/work-orders/:id/email`, `POST /api/admin/purchase-orders/:id/email`

### Purchase Order Vendor Email (added 2026-03-09)
- New `vendor_email` column on `purchase_orders` table (`TEXT NOT NULL DEFAULT ''`)
- Vendor Email field in PO form (between Vendor and Status)
- Auto-fills the email prompt when clicking PO email button
- Included in PO create, update, and list queries

### Print Preview Improvements (added 2026-03-09)
- **Phone/Address fallbacks**: Print now checks booking → customer → WO fields (was only checking booking)
- **Start/End times**: Shows actual start time, end time, and auto-calculated time spent (e.g. "2 hr 30 min")
- **Back button**: All print previews have a ← Back button (iPad can't go back from `window.open` pages)

### Work Order Delete Fix (2026-03-09)
- WO delete now closes modal immediately and refreshes the active tab
- Shows green notification "Work Order #X deleted"
- Better error messages on delete failure (shows HTTP status + error text)

### Server Widget Auto-Reauth (added 2026-03-10)
- Server widget now stores admin password in localStorage after first login
- On 401 (token expired after PM2 restart), automatically re-authenticates without showing login screen
- Widget stays green through PM2 reloads

---

### iCloud Backup Fix (2026-03-11)

- **Problem:** Scheduled 2AM iCloud backup was silently failing. Root causes:
  1. LaunchAgent's `StandardOutPath` pointed to `/Volumes/2TB HDD/backup_log.txt` — launchd couldn't open it (FDA restriction), causing exit code 78 (EX_CONFIG) before the script ran
  2. rsync destination `/Volumes/2TB HDD/Backups/iCloud Drive/` had `dr-x------` permissions — source iCloud directories are read-only and rsync `-a` copied those permissions to the destination, making the next run fail
- **Fixes applied:**
  1. Converted from user LaunchAgent to **root LaunchDaemon** (`/Library/LaunchDaemons/com.dgsoftwash.icloud-backup.plist`) — root bypasses FDA entirely, reliable across reboots
  2. LaunchDaemon stdout/stderr now goes to `/tmp/icloud-backup.log`
  3. Added `--chmod=Du+w` to the rsync command for the `icloud` item in `backup.sh` — ensures destination directories stay writable even though source iCloud dirs are read-only
  4. Ran `chmod -R u+w "/Volumes/2TB HDD/Backups/iCloud Drive"` to fix existing locked directories
- **Old LaunchAgent removed:** `~/Library/LaunchAgents/com.dgsoftwash.icloud-backup.plist` deleted
- **Check scheduled run:** `sudo launchctl list | grep icloud-backup` (should show exit 0)
- **Check log:** `cat /tmp/icloud-backup.log | tail -20`
- **Manual trigger:** `sudo launchctl start com.dgsoftwash.icloud-backup`

---

### Widget System Fixes (2026-03-11)

**Cursor Jumping Fix:**
- **Root cause identified:** Backup Widget was stealing system focus every 10 seconds
- **Solution:** Permanently deleted `/Applications/Backup Widget.app` and associated LaunchAgent
- Backup Widget was redundant — server widget already shows backup status
- **Result:** Cursor no longer jumps while typing in Terminal or other apps

**Universal Close Buttons:**
- Added red × close buttons to ALL widget grip bars (previously only docks had them)
- **Widgets updated:** DG Softwash Monitor, Time Machine Widget, Backblaze Widget, Chappie Widget, EmailSyncWidget
- **Changes:** Added `CloseHandler` class, `window.webkit.messageHandlers.close` integration, grip bar layout from `justify-content: center` to `space-between` with close button on right
- Close button calls `NSApplication.shared.terminate(nil)` — widgets auto-restart via LaunchAgents (temporary hide, not permanent disable)
- **Swift sources updated:** `/Volumes/1TB SSD/openclaw/workspace/widget-sources/` (all widget .swift files)

**Server Widget Cleanup:**
- Removed BACKUP HISTORY section from server widget (was cluttering the display)
- iCloud backup status dot still shows in SERVICES section
- **Files changed:** `/Volumes/1TB SSD/server-widget/ServerWidget.html`

**Widget System Status:**
- **7 active widgets:** Chappie Dock, File Dock, DG Softwash Monitor, Time Machine Widget, Backblaze Widget, Chappie Widget, EmailSyncWidget
- All have working drag handles + close buttons
- No cursor stealing, stable focus behavior
- **Backup Widget permanently removed** (not just disabled)

---

### Homepage UI Improvements (2026-03-11)

**Pricing Highlight Message:**
- Added prominent yellow banner on homepage between "Integrity You Can See" and main paragraph
- Message: **"No need for an estimate — fixed pricing! See our pricing page or book now."**
- Links to `/pricing` and `/contact` pages
- Golden background with dark box, blue links on hover

**Hero Text Visibility Enhancement:**
- Improved text readability against the flag background animation
- **Main heading**: Pure white (#ffffff) with stronger shadows
- **Tagline**: Light blue-white (#f0f9ff) with enhanced shadows  
- **Regular text**: Light gray-blue (#e2e8f0) with stronger shadows
- Kept flag background animation but made all text clearly readable

**Files changed:** `views/index.html`, `public/css/styles.css`  
**Service worker:** Updated to v18

### Bleach Neutralizer Banner (2026-03-11)

**Added prominent green banner to 3 key pages:**
- **Pricing page** (`/pricing`) — Top banner under header
- **Services page** (`/services`) — Top banner under header  
- **Contact page** (`/contact`) — Top banner under header

**Banner styling:**
- Green gradient background (`#059669` to `#047857`) with bright green border (`#10b981`)
- Bold white text with shield emoji: **"🛡️ BLEACH NEUTRALIZER RINSE with every wash to protect your surfaces and landscaping - FREE OF CHARGE!"**
- Animated glow effect to draw attention
- Mobile responsive (adjusts padding/font size)
- CSS class: `.neutralizer-banner` with `@keyframes glow` animation

**Files changed:** `views/pricing.html`, `views/services.html`, `views/contact.html`, `public/css/styles.css`  
**Service worker:** Updated to v19

### Online Booking Emphasis (2026-03-11)

**Added messaging across all key pages to emphasize customers can book entirely online without calling:**

**Pricing Page:**
- Added centered bold **"OR"** separator between "Call or Text" and book button
- Changed "Book Now" → **"Book Here NOW"**
- Added message: **"No need to call — take care of your booking online!"**

**Homepage:**
- Changed hero button: "Book Now" → **"Book Online Now"**

**Services Page:**
- Updated call-to-action text: **"Book online in minutes — no phone calls needed!"**
- Changed button: "Book Now" → **"Book Online NOW"**
- Added explanation: **"Complete your entire booking online — choose services, pick your date, and you're done!"**

**Contact Page:**
- Added blue highlight banner: **"📱 Complete booking online — no phone calls required! Fill out the form below and you're all set."**

**Styling added:**
- `.booking-separator` class: centered bold OR with decorative lines
- `.online-booking-message` class: green italic text for emphasis
- `.online-booking-highlight` class: blue gradient boxes for contact page
- Mobile responsive sizing adjustments

**Files changed:** `views/index.html`, `views/pricing.html`, `views/services.html`, `views/contact.html`, `public/css/styles.css`  
**Service worker:** Updated to v20

### OR Separator Styling Fix (2026-03-11)

**Problem:** OR separator between call button and book button on pricing page was not displaying properly on mobile - appeared small and not bold despite CSS changes.

**Root cause:** Mobile CSS breakpoint was overriding the main styling with smaller font size and different margins.

**Solution:**
- Added `!important` declarations to force styling on mobile devices
- Updated mobile breakpoint CSS to maintain large, bold OR text
- Increased font size to 1.6rem and font-weight to 900 (maximum boldness)
- Ensured proper centering with `text-align: center !important`

**Mobile cache issues:** Users may need to delete and recreate bookmarks or hard refresh to see changes due to aggressive mobile browser caching.

**Files changed:** `public/css/styles.css`  
**Service worker:** Updated to v22

---

*Last updated: 2026-03-11 (OR separator mobile styling fix with !important declarations)*
