# RouteWise ELD & HOS Trip Planner — 3 to 5 Minute Loom Walkthrough Script

This script provides an exact, professional walkthrough for recording the assessment video presentation.

---

## ⏱ 0:00 – 0:30: Problem & Application Purpose
* **Visual:** Browser opened to the RouteWise home screen (`http://localhost:5173` or deployed URL).
* **Talking Points:**
  > "Hello everyone. Today I'm presenting **RouteWise**, a production-ready web application designed for property-carrying interstate truck drivers and logistics dispatchers.
  > Under FMCSA regulations, planning an interstate route requires adhering to strict Hours of Service (HOS) rules: the 11-hour driving limit, the 14-hour duty window, mandatory 30-minute rest breaks after 8 hours of cumulative driving, 10-hour daily resets, and the 70-hour / 8-day rolling cycle.
  > On top of that, commercial vehicles must refuel at least once every 1,000 miles, and drivers must maintain compliant daily log sheets with visual duty-status graphs.
  > RouteWise automates this entire planning and ELD log generation workflow end-to-end."

---

## ⏱ 0:30 – 1:15: Input Experience & HOS Clocks
* **Visual:** Point to the 4 main input fields. Type in or click the preset button **"Dallas → Chicago"** or **"LA → Dallas"**. Show the autocomplete suggestion dropdown.
* **Talking Points:**
  > "Let's take a look at the input experience. RouteWise requires just four primary inputs:
  > 1. Current Location (departure point)
  > 2. Pickup Location (with 1 hour On-Duty loading)
  > 3. Dropoff Location (with 1 hour On-Duty unloading)
  > 4. Current Cycle Used in hours (from 0 to 70).
  > Notice the smart location inputs: they debounce searches to respect OpenStreetMap Nominatim rate limits, cache responses in memory, and support keyboard navigation.
  > For Current Cycle Used, the gauge dynamically calculates remaining hours and provides a clear regulatory note: because aggregate cycle hours are provided rather than 8-day historical logs, hours are evaluated conservatively.
  > We can also open the **Advanced Details** modal to enter optional operational data: departure date, local departure time (defaulting to 06:00), home terminal timezone, driver name, carrier information, truck/trailer numbers, and BOL manifest."

---

## ⏱ 1:15 – 2:00: Interactive Route Map & Inserted Stops
* **Visual:** Click **"Plan Trip & Generate Logs"**. Show the step-by-step progress indicator, then scroll down to the interactive Leaflet map.
* **Talking Points:**
  > "Upon clicking Plan Trip, the backend computes turn-by-turn road geometry with OSRM and runs our deterministic trip scheduler.
  > Here on the interactive map:
  > - We see the full polyline route across states.
  > - **Green marker** is the departure origin.
  > - **Blue marker** is the shipper pickup stop.
  > - **Purple marker** is the consignee dropoff.
  > - Notice intermediate stops: **amber markers** for planned fuel stops every 1,000 miles, **cyan markers** for 30-minute driving breaks, and **indigo markers** for 10-hour off-duty resets.
  > Clicking any marker reveals an informative popup with exact route mileage, timestamps, duration, and the regulatory justification."

---

## ⏱ 2:00 – 2:45: HOS Compliance Dashboard & 70/8 Logic
* **Visual:** Scroll to the **HOS Compliance & Trip Dashboard** and **Compliance Audit** panels.
* **Talking Points:**
  > "Here in the HOS Dashboard, the system displays hero metrics: total route miles, base driving duration, total planned elapsed time, and scheduled intervention counts.
  > The scheduler strictly enforces FMCSA property-carrier rules:
  > - Driving segments are sliced before reaching 8 cumulative driving hours, inserting a 30-minute break.
  > - If 11 driving hours or the 14-hour window is reached, the driver is parked for a mandatory 10 consecutive hours off duty.
  > - If remaining cycle hours are insufficient for required driving or loading work, a 34-hour restart is scheduled, resetting the cycle clock to zero.
  > - In the **Compliance Audit** section, an independent validator audits the timeline across 18 separate constraints: zero overlaps, positive durations, continuous timeline, and strict rule bounds."

---

## ⏱ 2:45 – 3:45: Daily Log Sheets & Plotted Vector Graph
* **Visual:** Scroll to the **FMCSA 24-Hour Driver Daily Log Sheets** section. Switch between Day 1, Day 2 tabs. Zoom in and out. Click **Print Sheet** or show the print preview modal.
* **Talking Points:**
  > "Now for the centerpiece of the application: the **Drivers Daily Log Sheets**.
  > Rather than displaying a generic table, RouteWise renders a faithful recreation of the official paper ELD daily log:
  > - Header with From, To, Date, and Total Miles Driving Today.
  > - The 24-hour grid spanning Midnight to Midnight with quarter-hour tick marks.
  > - The application visually **DRAWS** the driver's schedule onto the graph: horizontal status lines across Off Duty, Sleeper Berth, Driving, and On Duty, connected by vertical transition lines with minute-level precision.
  > - On the right side, daily hours are summed across all four duty lines, and our automated tests guarantee they equal **exactly 24.00 hours** for every calendar day.
  > - Below the grid, we have the Shipping Documents section, detailed Remarks for every duty change, and the complete 70-Hour / 8-Day Recap table with Driver Signature.
  > - Multiple days are automatically partitioned at midnight in the driver's home terminal timezone.
  > - By clicking **Print Sheet** or **Download PDF**, the log prints in Letter-size landscape format on clean white paper with all navigation elements hidden."

---

## ⏱ 3:45 – 4:30: Architecture, Testing & Security
* **Visual:** Briefly show the terminal running `python -m pytest` (23 passed) or show project files in the editor.
* **Talking Points:**
  > "Let's touch on the architecture:
  > - **Backend:** Built with Python, Django, and Django REST Framework. The HOS rule engine, trip scheduler, daily log partitioner, and compliance validator are modular services with 100% test coverage.
  > - **Frontend:** Built with React 18, TypeScript, Vite, and Tailwind CSS.
  > - **Mapping:** Free and open stack using Leaflet, OpenStreetMap tiles, Nominatim geocoding, and OSRM routing behind provider abstractions.
  > - **Security & Production:** Django runs with WhiteNoise serving the React SPA, secure HTTP headers, CSRF/CORS controls, input validation, and zero committed secrets.
  > - **Testing:** We have 23 comprehensive automated tests covering 11h, 14h, 8h breaks, 10h resets, 34h restarts, fuel intervals, and API endpoints."

---

## ⏱ 4:30 – 5:00: Deployment Readiness & Wrap-up
* **Visual:** Show `Dockerfile`, `docker-compose.yml`, or `.github/workflows/ci.yml`.
* **Talking Points:**
  > "Finally, the application is completely deployment-ready:
  > - A multi-stage `Dockerfile` compiles the frontend and runs Gunicorn with WhiteNoise.
  > - A `docker-compose.yml` allows one-command startup (`docker compose up --build`).
  > - A complete GitHub Actions CI/CD workflow validates both backend tests and frontend builds on every commit.
  > Thank you for your time, and please feel free to test any route or edge case with RouteWise!"
