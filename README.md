# D&G Soft Wash

**Integrity You Can See** | Veteran Owned & Operated

Professional exterior soft washing services — houses, decks, fences, RVs, boats, heavy equipment, and commercial properties.

---

## Features

- **Service Pages** — Detailed breakdowns of all services with pricing and add-ons
- **Online Booking Calendar** — Customers pick a date and time slot to schedule service
- **Duration-Aware Scheduling** — Multi-hour services automatically block consecutive time slots
- **Instant Price Calculator** — Interactive estimator with add-on options
- **Admin Dashboard** — Manage bookings, block dates/slots, view upcoming appointments
- **Mobile Responsive** — Fully responsive design for all screen sizes

## Tech Stack

- **Node.js** + **Express** — Server and API
- **Vanilla HTML/CSS/JS** — No frontend framework, fast and lightweight
- **JSON file storage** — Simple flat-file persistence for bookings

## Getting Started

```bash
# Install dependencies
npm install

# Start the server
npm start

# Or run with auto-reload during development
npm run dev
```

The site runs at **http://localhost:3000**

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home page |
| `/services` | Service details and pricing |
| `/pricing` | Price calculator with add-ons |
| `/gallery` | Before & after photos |
| `/contact` | Contact form with booking calendar |
| `/admin` | Admin dashboard (password protected) |

## Booking System

Services have different durations that are handled automatically:

| Service | Duration |
|---------|----------|
| House Washing - Rancher | 2 hours |
| House Washing - Single Family | 3 hours |
| House Washing - Plus+ | 4 hours |
| Deck Cleaning | 2 hours |
| Fence Cleaning | 2 hours |
| RV Washing | 1 hour |
| Boat Cleaning | 1 hour |
| Heavy Equipment | Estimate only |
| Commercial | Estimate only |

When a customer books a multi-hour service, all required consecutive time slots are reserved. Heavy Equipment and Commercial services require a direct call/text for custom estimates.

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/availability/:year/:month` | Monthly slot availability overview |
| `GET` | `/api/availability/:date/slots` | Individual day time slots |
| `POST` | `/api/contact` | Submit contact form / book appointment |
| `POST` | `/api/admin/login` | Admin authentication |
| `GET` | `/api/admin/bookings` | Get all bookings and blocked dates |
| `POST` | `/api/admin/block` | Block/unblock slots, cancel bookings |

## Project Structure

```
dg-softwash/
├── server.js            # Express server and API routes
├── data/
│   └── bookings.json    # Bookings and blocked dates
├── public/
│   ├── css/             # Stylesheets
│   ├── images/          # Logo and assets
│   └── js/              # Client-side JavaScript
│       ├── main.js      # Navigation and shared UI
│       ├── calendar.js  # Booking calendar widget
│       ├── calculator.js # Price calculator
│       └── admin.js     # Admin dashboard
└── views/               # HTML pages
    ├── index.html
    ├── services.html
    ├── pricing.html
    ├── gallery.html
    ├── contact.html
    └── admin.html
```

---

*D&G Soft Wash — Serving our community with pride.*
