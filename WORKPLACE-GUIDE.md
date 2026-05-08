# D&G Workplace Dashboard — How-To Guide

**Access:** Opens automatically at login · App: `/Applications/DG Workplace Dashboard.app`
**Direct URL:** `http://localhost:3000/workplace` (also works in any browser on the Mac Mini)
**Password:** `bemish2026`

---

## Overview

The Workplace Dashboard is a full-screen native macOS app (built on WebKit) that combines all operator tools in one window. It replaces the need to juggle multiple floating windows, browser tabs, and terminal windows.

The dashboard has three zones:
1. **Top panel** — live server health, services, storage, system metrics, PM2 status, logs, testing
2. **Quick-launch bar** — one-click buttons for the most common tools (scrollable)
3. **Bottom panels (38%)** — Terminal 1 | Terminal 2 | Dispatch AI | Telegram/Chappie

---

## Starting & Restarting

| Situation | What to do |
|-----------|-----------|
| Normal startup | Opens automatically when you log in (LaunchAgent) |
| App crashed | Restarts itself within 5 seconds (KeepAlive) |
| Manually open | Double-click **DG Workplace Dashboard** on Desktop, or `open "/Applications/DG Workplace Dashboard.app"` |
| Force restart | `launchctl kickstart -k gui/$(id -u)/com.dgsoftwash.workplace` |
| Disable at login | `launchctl unload ~/Library/LaunchAgents/com.dgsoftwash.workplace.plist` |
| Re-enable at login | `launchctl load ~/Library/LaunchAgents/com.dgsoftwash.workplace.plist` |
| Check if running | `pgrep -l DGWorkplace` |
| View crash logs | `cat /tmp/workplace-dashboard-error.log` |

---

## Quick-Launch Bar

The bar scrolls horizontally if needed. Every button shows `⟳` while running and `✓` when done. Browser buttons open in **Google Chrome**.

| Button | Color | Action |
|--------|-------|--------|
| Admin Panel | Blue | Opens admin panel in Chrome |
| DG Website | Blue | Opens dgsoftwash.com in Chrome |
| Zoho Mail | Blue | Opens mail.zoho.com in Chrome |
| PM2 Reload | Red | Zero-downtime server reload |
| CF Reload | Purple | Restarts Cloudflare Tunnel |
| OpenClaw | Purple | Kills and restarts OpenClaw gateway |
| DB Backup | Green | Backs up PostgreSQL database now |
| Time Machine | Green | Starts a Time Machine backup now |
| iCloud Bak | Green | Runs iCloud → 2TB HDD backup |
| Backblaze | Green | Kicks Backblaze to scan and upload |
| RAM Clean | Yellow | Frees inactive memory (`sudo purge`) |
| Disk Clean | Yellow | Removes temp files + daily maintenance |
| Telegram ↺ | Gray | Clears and reloads Telegram messages |
| Health Widget | Gray | Opens server health widget in Chrome |
| ↻ Refresh | Blue | Refreshes the dashboard immediately |

---

## Terminal Panels (Terminal 1 & Terminal 2)

### What they are
Native macOS Terminal.app windows launched and positioned to sit in the dashboard's terminal panel area. They are full Terminal windows — not a web-based terminal — so everything works exactly as in regular Terminal.

### How to use
1. Click **Open Terminal 1** or **Open Terminal 2**
2. A Terminal window opens and positions itself in that panel area
3. The Terminal windows stay **in front** of the dashboard permanently — clicking the dashboard behind them does not minimize or hide them

### Capabilities
- Full shell access (zsh) — all commands work
- Interactive programs: `claude`, `vim`, `python`, `psql -U david dgsoftwash`, etc.
- Claude Code CLI: type `claude` to start a full Claude Code session
- The terminal starts in `/Volumes/1TB SSD/dg-softwash` (project directory)
- Color output, tab completion, command history — everything normal Terminal supports

### Limitations
- The dashboard cannot read or interact with Terminal window contents
- Repositioning: if you move the dashboard window, the Terminal windows don't follow — reclick Open to reposition
- One Terminal window per slot — clicking Open again opens a second window rather than focusing the existing one (close the old one first)

---

## Dispatch Panel (AI with Full Server Access)

### What it is
An AI assistant (Claude Sonnet) with **full access to your Mac Mini server** — reads files, runs shell commands, edits code, queries the database. Same capabilities as Claude Code running natively.

### How to use
- Type any question or instruction in the input box, press Enter or click **Send**
- Responses appear in the panel with a tool usage summary (e.g. `⚙ 3 tools used: bash, read_file, edit_file`)
- Click **Clear** to start a fresh conversation (also resets from inside the panel)

### What Dispatch can do
| Task | Example prompt |
|------|---------------|
| Check server status | "Check PM2 status and show me the last 20 error log lines" |
| Read any file | "Show me the last 50 lines of server.js" |
| Query the database | "How many customers do we have and what's total revenue this month?" |
| Edit code | "In server.js, change the max upload size to 50MB" |
| Reload the server | "Reload PM2 after making that change" |
| Debug errors | "The admin panel is throwing a 500 error, check the logs and find out why" |
| Run any command | "Run the basic test suite and show me the results" |
| Write new files | "Create a new SQL migration for adding a notes column to customers" |
| Check storage | "How much disk space is left on each drive?" |
| Git operations | "Show me what changed in the last 3 commits" |

### Limitations
- **No browser/internet access** — Dispatch cannot browse the web, visit URLs, or check external APIs (other than what the server code does)
- **No real-time streaming** — responses appear all at once when complete; complex tasks may take 30-60 seconds
- **Conversation context** — Dispatch remembers the current conversation but starts fresh on each dashboard reload (click Clear to reset manually)
- **15-iteration limit** — very complex multi-step tasks are capped at 15 tool calls per message
- **Cannot run interactive programs** — commands that require keyboard input (vim, python REPL, etc.) will hang; use the Terminal panels for those
- **60-second command timeout** — shell commands that take longer than 60s will be killed; for long operations use a Terminal panel

---

## Telegram / Chappie Panel

### What it is
A live view of your conversation with Chappie (the OpenClaw AI bot) on Telegram. You can read and reply without opening Telegram.

### How to use
- Messages load automatically every 15 seconds
- Type in the input box and press Enter or click **Send** to message Chappie
- After sending, "Chappie is thinking..." appears — responses typically arrive within 15-40 seconds
- The panel only appends new messages — it never clears what you've already read
- Click **Telegram ↺** in the quick-launch bar to force-reload messages immediately

### Limitations
- **Read current session only** — shows only the active OpenClaw/Chappie conversation
- **15-second poll delay** — new messages appear within 15 seconds, not instantly
- **No file/image/media support** — text only
- **Requires OpenClaw gateway running** — check Services row; use OpenClaw button in quick-bar to restart if red

---

## Top Panel — Health & Monitoring

### Services section
Shows live status of all server services. Colors:
- **Green** — running/healthy (dots pulse with a glow)
- **Yellow/Orange** — warning (e.g. UPS on battery)
- **Red** — down or error
- **Grey** — unknown/unreachable

Services monitored: Website, App/PM2, Database, CF Tunnel, UPS, OpenClaw

### Backup Services section
Shows status of all backup systems:
- **Time Machine** — last backup time
- **iCloud → 2TB HDD** — last iCloud backup
- **Yahoo → Zoho Mail** — email sync status
- **Backblaze** — license status + last push date (green = active, blue = transmitting, red = expired)

### Storage section
Live disk usage bars for: Internal 256GB, 1TB SSD (project), 2TB HDD, 4TB SSD (backups)

### System section
- CPU % (5-second average)
- Memory % used
- Load average

### Testing System
Five test levels available — click **Run** to execute, **Log** to view last results:
- Level 1 — Basic (non-intrusive, ~10 seconds)
- Level 2 — Full (writes test data, ~30 seconds)
- Level 3 — Admin (tests admin panel)
- Level 4 — Advanced (bookings, customers, quotes)
- Level 5 — Full System (intrusive, sends real emails)

> **Warning:** Levels 4-5 write real data to the database and send real emails. All test data is cleaned up automatically at the end.

### PM2 Process section
- Live uptime, memory, restart count
- **Reload** — one tap: button changes to `⟳ Working...` then `Reload ✓` (zero downtime)
- **Restart** — full restart (brief downtime)
- **Stop** — stops the server entirely

### PM2 / App Logs
Last 150 lines of actual PM2 output and error logs. Error/warn lines shown in red, success in green. Auto-refresh toggle. This shows real application errors — not just service health alerts.

---

## Visual Effects

The dashboard includes ambient lighting effects:
- **Top & bottom light bars** — thin colored lines sweeping blue → purple → green continuously
- **Shooting lines** — glowing streaks shoot across the screen at random heights, color-cycling
- **Pulsing status dots** — green/blue/red service dots pulse with a glow halo
- **Aurora header** — slow color wash across the header bar
- **Panel accent borders** — blue left edge, purple center, green right edge

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Dashboard won't load (white screen) | Server may be down — open Terminal and run `pm2 reload dg-softwash` |
| Stuck on login screen | Check password: `bemish2026` |
| Dispatch says "Error" | Check PM2 logs: `pm2 logs dg-softwash --lines 20` — likely an API key or network issue |
| Telegram panel empty | OpenClaw gateway may be stopped — click **OpenClaw** in quick-bar to restart |
| Telegram messages not sending | Verify OpenClaw is green in Services. Check: `openclaw gateway health` |
| Terminal windows go behind dashboard | Reload the dashboard app |
| "Open Terminal" opens in wrong position | Dashboard window may have moved — positions are calculated at click time |
| Health shows all grey | Server is running but health API is unreachable — try `pm2 reload dg-softwash` |
| Dashboard crashed, won't restart | Run: `launchctl kickstart -k gui/$(id -u)/com.dgsoftwash.workplace` |
| Browser buttons show ✓ but nothing opens | Chrome must be installed — check `/Applications/Google Chrome.app` exists |

---

## Technical Reference

| Item | Value |
|------|-------|
| App binary | `/Applications/DG Workplace Dashboard.app/Contents/MacOS/DGWorkplace` |
| Swift source | `/tmp/workplace-build/main.swift` |
| HTML source | `/Volumes/1TB SSD/server-widget/WorkplaceDashboard.html` |
| Server route | `GET /workplace` in `server.js` |
| LaunchAgent | `~/Library/LaunchAgents/com.dgsoftwash.workplace.plist` |
| Crash log | `/tmp/workplace-dashboard-error.log` |
| Dispatch endpoint | `POST /api/dispatch/chat` (requireAdmin) |
| App logs endpoint | `GET /api/admin/app-logs?lines=150` (requireAdmin) |
| Open URL endpoint | `POST /api/open-url` → osascript `tell application "Google Chrome"` |
| Telegram read | `GET /api/telegram/updates` (reads OpenClaw session files) |
| Telegram send | `POST /api/telegram/send` → `openclaw agent --message ... --session-id <latest>` |
| Terminal launch | `POST /api/open-terminal` → osascript positions Terminal.app window |
| Recompile Swift | `cd /tmp/workplace-build && swiftc -framework Cocoa -framework WebKit main.swift -o DGWorkplace && cp DGWorkplace "/Applications/DG Workplace Dashboard.app/Contents/MacOS/DGWorkplace"` |

---

*Last updated: 2026-05-07*
