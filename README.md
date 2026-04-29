# RouteWise: Commercial Interstate HOS Trip Planner & ELD Daily Log Generator

[![CI/CD Pipeline](https://github.com/your-username/routewise/actions/workflows/ci.yml/badge.svg)](https://github.com/your-username/routewise/actions/workflows/ci.yml)
[![Python 3.13](https://img.shields.io/badge/python-3.13-blue.svg)](https://www.python.org/)
[![Django 5.x](https://img.shields.io/badge/django-5.x-092e20.svg)](https://www.djangoproject.com/)
[![React 18](https://img.shields.io/badge/react-18-61dafb.svg)](https://react.dev/)
[![TypeScript 5.x](https://img.shields.io/badge/typescript-5.x-3178c6.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**RouteWise** is a full-stack web application designed for property-carrying interstate commercial motor vehicle (CMV) drivers and logistics dispatchers. It calculates real-world highway driving routes and dynamically schedules compliant Hours of Service (HOS) rest stops, resets, and refueling breaks under **FMCSA April 2022 property-carrier regulations**, automatically generating printable 24-hour daily log sheets with visually plotted duty-status graph lines.

---

## 🌟 Key Features

1. **Intelligent Trip Planning:**
   - Input **Current Location**, **Pickup Location** (1 hr On-Duty load), **Dropoff Location** (1 hr On-Duty unload), and **Current Cycle Used** (0–70 hrs).
   - Fast, debounced autocomplete with in-memory caching and keyboard navigation using OpenStreetMap Nominatim.
   - Pre-configured realistic one-click sample trips for fast evaluator demonstration (e.g. *Dallas → Chicago*, *LA → Dallas cross-country*, *Atlanta → Miami*).

2. **Authoritative Backend HOS Rule Engine:**
   - **11-Hour Driving Limit:** Restricts CMV driving to a maximum of 11 hours following 10 consecutive hours off-duty.
   - **14-Hour Driving Window:** Enforces the 14-consecutive-hour window from on-duty start. Breaks or off-duty periods < 10 hours do not pause or extend the 14-hour clock.
   - **30-Minute Rest Break:** Requires at least 30 consecutive minutes of non-driving (off-duty, sleeper, or on-duty not driving) after 8 cumulative hours of driving. Satisfied automatically by 1-hour loading/unloading or 30-minute refueling!
   - **10-Hour Daily Reset:** Schedules mandatory 10 consecutive hours off-duty before continuing driving when the 11h/14h limits bind.
   - **70-Hour / 8-Day Cycle Limit:** Tracks cumulative on-duty time (driving and non-driving).
   - **34-Hour Restart:** Dynamically schedules a 34-hour off-duty restart when remaining cycle hours are insufficient to complete required on-duty activities, resetting cycle hours to zero.
   - **Mandatory Refueling:** Automatically inserts 30-minute fuel stops before exceeding 1,000 miles since the previous refueling.

3. **Interactive Route Map:**
   - Built with **Leaflet** and OpenStreetMap tiles.
   - Highlights route geometry with distinct custom SVG markers for Start, Pickup, Dropoff, Fuel, 30-min Breaks, 10-hour Resets, and 34-hour Restarts.
   - Interactive popups with stop details, duration, route milepost, and regulatory justification.
   - Auto-fit bounding box and mobile responsive viewport.

4. **Authentic FMCSA 24-Hour Drivers Daily Log Generator:**
   - Faithfully recreates the official paper **Drivers Daily Log (24 hours)** in sharp vector SVG.
   - Visual **graph-drawing engine** renders horizontal status lines and vertical transition connectors with exact minute-level precision across all 4 duty statuses:
     1. Off Duty
     2. Sleeper Berth
     3. Driving
     4. On Duty (Not Driving)
   - Right-side category totals guaranteed by automated tests to sum to **exactly 24.00 hours** for every calendar day.
   - Automatically partitions multi-day trips at midnight in the driver's home terminal timezone.
   - Remarks section populated with duty-status changes, timestamps, and locations.
   - 70-Hour / 8-Day Recap section (lines 3 & 4 today, 7-day cumulative, available tomorrow, 34-hour restart indicator).
   - Driver signature line with optional typed digital signature.
   - Print controls for single day or all days in **Letter-size landscape format** with application chrome hidden. Vector PDF export supported via system print dialog.

5. **18-Point Independent Compliance Audit:**
   - After scheduling, an independent validator audits the timeline to verify zero overlaps, timeline continuity, 11h/14h bounds, 8h break rules, 70h cycle limit, fuel frequency, and exact 24h daily log sums.

---

## 🏗 System Architecture & Tech Stack

```
RouteWise/
├── backend/                  # Python 3.13 / Django 5.x / Django REST Framework
│   ├── config/               # Settings, WhiteNoise, URLs, WSGI/ASGI
│   ├── api/                  # REST views, serializers, endpoints
│   ├── services/             # Core domain logic
│   │   ├── constants.py      # Regulatory rules vs assessment assumptions
│   │   ├── models.py         # Strongly-typed domain dataclasses
│   │   ├── hos_engine.py     # Pure HOS rule state tracking engine
│   │   ├── trip_scheduler.py # Multi-leg planner with inserted stops & geometry
│   │   ├── route_geometry.py # Polyline decoding, interpolation at mileposts
│   │   ├── geocoding.py      # Nominatim provider with throttling & caching
│   │   ├── routing.py        # OSRM provider with turn-by-turn step parsing
│   │   ├── daily_log.py      # Multi-day midnight partitioner & 24h log generator
│   │   └── compliance_validator.py # 18-point independent compliance auditor
│   ├── tests/                # Automated pytest suite (23 unit & integration tests)
│   └── manage.py
├── frontend/                 # React 18 / TypeScript 5 / Vite / Tailwind CSS
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/       # Navbar, Footer, badges
│   │   │   ├── trip/         # LocationInput, CycleHoursInput, TripPlannerForm
│   │   │   ├── map/          # RouteMap (Leaflet + custom SVG markers)
│   │   │   ├── hos/          # HOSDashboard, TripTimeline, RouteInstructions, CompliancePanel
│   │   │   └── logs/         # DailyLogSVG (vector graph), DailyLogViewer (tabs, print)
│   │   ├── services/api.ts   # Typed API client with query caching
│   │   ├── types/trip.ts     # TypeScript interfaces
│   │   ├── App.tsx           # Main application coordinator
│   │   └── main.tsx
├── .github/workflows/ci.yml  # GitHub Actions CI workflow
├── Dockerfile                # Multi-stage production container
├── docker-compose.yml        # One-command Docker orchestration
├── .env.example              # Environment variables template
├── DEMO_SCRIPT.md            # 3-5 minute video presentation script
└── README.md
```

---

## ⚖️ Regulatory Rules vs. Assessment Assumptions

RouteWise strictly differentiates between statutory FMCSA rules and assessment-specific planning assumptions:

| Parameter | Type | Value | Regulatory Reference |
|---|---|---|---|
| **Property Carrier** | Standard | CMV Property Carrying | 49 CFR § 395.3 |
| **Max Driving Limit** | FMCSA Rule | 11.0 hours | 49 CFR § 395.3(a)(3)(i) |
| **Duty Window** | FMCSA Rule | 14.0 consecutive hours | 49 CFR § 395.3(a)(2) |
| **Rest Break Rule** | FMCSA Rule | 30 minutes after 8h driving | 49 CFR § 395.3(a)(3)(ii) |
| **Daily Reset** | FMCSA Rule | ≥10 consecutive hours off duty | 49 CFR § 395.3(a)(1) |
| **Active Cycle Limit** | FMCSA Rule | 70 hours in 8 days | 49 CFR § 395.3(b)(2) |
| **Cycle Restart** | FMCSA Rule | ≥34 consecutive hours off duty | 49 CFR § 395.3(d) |
| **Fueling Interval** | Assessment Assumption | Fuel stop every 1,000 miles | Assessment Specification |
| **Fuel Duration** | Assessment Assumption | 30 mins On-Duty Not Driving | Planning assumption |
| **Pickup Duration** | Assessment Assumption | 1.0 hour On-Duty Not Driving | Assessment Specification |
| **Dropoff Duration** | Assessment Assumption | 1.0 hour On-Duty Not Driving | Assessment Specification |
| **Default Start Time** | Planning Default | 06:00 local time | Guide Example Alignment |

> **Note on Aggregate Current Cycle Used:**  
> The assessment provides a single aggregate value for "Current Cycle Used" rather than 8 separate daily historical totals. RouteWise evaluates this conservatively as accumulated active on-duty time and resets it upon scheduling a 34-hour restart.

---

## 🚀 Quick Start & Local Setup

### Prerequisites
- **Python:** 3.11+ (Python 3.13 tested)
- **Node.js:** 18+ (Node 20/22 tested)
- **Git**

### 1. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment (optional)
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations & check
python manage.py migrate
python manage.py check

# Start Django development server
python manage.py runserver 127.0.0.1:8000
```

### 2. Frontend Setup
```bash
# In a new terminal, navigate to frontend directory
cd frontend

# Install npm dependencies
npm install

# Start Vite development server
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 🧪 Automated Testing

### Backend Tests (23 Unit & Integration Tests)
```bash
cd backend
python -m pytest
```
Tests cover:
- 11-hour driving limit in 14-hour window
- 14-hour window expiration from on-duty start
- 30-minute rest break after 8 cumulative driving hours
- 10-hour daily resets & 34-hour cycle restarts
- Fuel stop insertion every 1,000 miles
- Midnight interval partitioning
- Daily log sheets summing to exactly 24.00 hours
- FMCSA April 2022 Guide completed log fixture
- API endpoint validation and mock routing tests

### Frontend Build & Typecheck
```bash
cd frontend
npm run build
```

---

## 🐳 Docker Deployment

The application includes a multi-stage production Dockerfile that compiles the React frontend and serves it via Django and Gunicorn with WhiteNoise static compression.

```bash
# Build and run with Docker Compose
docker compose up --build

# Access the application at:
http://localhost:8000
```

---

## ☁️ Split Vercel / Cloud Deployment (Optional)

If deploying the frontend separately to **Vercel**:
1. Configure `VITE_API_BASE_URL` in your Vercel environment settings to point to your deployed Django backend (e.g. `https://api.yourdomain.com`).
2. Run `npm run build` with output directory `dist`.
3. In the Django backend, set `CORS_ALLOWED_ORIGINS` to include your Vercel domain.

---

## 🔒 Security Best Practices

- **Zero Committed Secrets:** `SECRET_KEY` is loaded from environment variables with `.env.example` provided.
- **Production Headers:** When `DJANGO_DEBUG=false`, HSTS, secure cookies, `X-Content-Type-Options: nosniff`, and `X-Frame-Options: DENY` are enabled.
- **Defensive API Proxies:** Nominatim geocoding and OSRM routing are proxied through Django, preventing client-side API exposure and enforcing rate limits.
- **Stateless Architecture:** Does not store user location searches or driver signatures permanently.

---

## 📄 Legal & Regulatory Disclaimer

> **FMCSA Property Carrier Compliance Notice:**  
> This application is an informational assessment and planning tool built against the FMCSA Interstate Truck Driver's Guide to Hours of Service for Property Carriers (April 2022) and assessment parameters. It is **not legal advice** and does not substitute for certified Electronic Logging Devices (ELDs) or statutory compliance regulations (49 CFR Part 395).

---

## 🗺 Map Attribution

- **Map Tiles & Geocoding:** © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), OpenStreetMap Nominatim.
- **Routing Engine:** Powered by [OSRM (Open Source Routing Machine)](https://project-osrm.org/).
