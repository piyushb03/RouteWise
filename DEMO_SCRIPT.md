# RouteWise — 3-Minute Live Website Demo Script

A tightly timed, professional, 100% browser-only walkthrough script for recording a high-impact video demonstration of **RouteWise** (max 3:00 minutes).

---

## 📋 Timing & Scene Breakdown (3:00 Max)

| Scene | Timestamp | Focus Area | Key Visual Action |
| :--- | :--- | :--- | :--- |
| **1. Intro & Hero** | `0:00 – 0:30` | Problem & Overview | Show clean Light Theme landing page, live telemetry card |
| **2. Trip Planning** | `0:30 – 1:15` | Route & HOS Inputs | Click preset haul, show autocomplete & 70h cycle budget console |
| **3. Map & Telemetry**| `1:15 – 1:55` | Route Geometry & Stops | Click Plan Trip, explore 2-column map & stop popups |
| **4. Vector Daily Logs**| `1:55 – 2:35` | Official 24h Daily Logs | Multi-day tabs, 24.0h duty lines, zoom controls, print preview |
| **5. Audit & Wrap-up** | `2:35 – 3:00` | Compliance Verification | 18-point audit checklist, turn-by-turn itinerary, closing |

---

## 🎬 Scene 1: Introduction & Hero Showcase
**⏱ Timestamp: `0:00 – 0:30` (30 seconds)**

### 🖥️ Visual Actions:
1. Browser open to **RouteWise** home page in full screen.
2. Hover briefly over the **FMCSA Part 395 Standard** live badge.
3. Scroll slightly to highlight the **CMV Telemetry Preview Card** on the right (progress bar, 11h/14h/70h clocks, and mini 24h log simulation).

### 🎙️ Speaker Script:
> "Hello everyone! Today I’m walking you through **RouteWise**, an automated interstate commercial motor vehicle trip planner and FMCSA ELD daily log generator.
>
> Commercial property-carrying truck drivers must navigate complex federal regulations: the 11-hour driving cap, the 14-hour duty window, mandatory 30-minute rest breaks after 8 hours of driving, 10-hour sleeper resets, and fuel stops every 1,000 miles.
>
> RouteWise automates this entire planning workflow in real time, calculating exact route geometry and producing official, audit-ready 24-hour daily log sheets with zero manual calculation."

---

## 🎬 Scene 2: Interactive Trip Configuration & HOS Console
**⏱ Timestamp: `0:30 – 1:15` (45 seconds)**

### 🖥️ Visual Actions:
1. Scroll down to the **Interstate CMV Trip Planner** section.
2. Click the **"Dallas → Chicago (1,050 mi)"** preset haul button.
3. Show the origin, pickup, and dropoff cards populated with verified green checkmarks.
4. Briefly click the Pickup input to show the live autocomplete dropdown.
5. In the **Driver 70-Hour Cycle Hours** console:
   - Click the `[+]` / `[-]` stepper buttons to change hours used.
   - Point to the live **Available Drive Budget** dial dynamically updating remaining hours.
6. Click **"Trip & Driver Settings"** (Advanced Details) modal for 3 seconds to show Start Time (06:00), Driver Name, and Carrier info, then close it.

### 🎙️ Speaker Script:
> "Configuring a trip takes seconds. RouteWise requires just four primary inputs:
> Departure terminal, Shipper pickup with 1 hour of loading, Consignee delivery with 1 hour of unloading, and current 70-hour cycle hours used.
>
> We offer 1-click sample corridors, or you can search any US highway city with debounced geocoding.
>
> Notice the 70-hour cycle console: as we adjust accumulated shift hours using the stepper or slider, the live **Available Drive Budget** dial immediately computes remaining driving capacity and advises whether an upcoming 34-hour restart will be required.
>
> In Advanced Settings, dispatchers can customize departure dates, morning start times, carrier addresses, and BOL shipping manifest numbers."

---

## 🎬 Scene 3: Route Calculation & Interactive Route Map
**⏱ Timestamp: `1:15 – 1:55` (40 seconds)**

### 🖥️ Visual Actions:
1. Click the gradient **"Plan Trip & Generate Logs"** button.
2. Show the progress indicator calculating route geometry.
3. Stop at the **HOS Compliance Dashboard** (point out total miles, driving time, elapsed time).
4. Move down to the **Interactive Route Map**:
   - Show the full interstate highway polyline.
   - Click a **Fuel stop marker** (amber ⛽) to show distance and duration popup.
   - Click a **Rest break marker** (cyan ☕) or **10h Sleeper Reset** (indigo 🌙) to show the regulatory rationale popup.

### 🎙️ Speaker Script:
> "Clicking **Plan Trip** calculates turn-by-turn road geometry using real highway networks and runs our deterministic HOS scheduling engine.
>
> In the dashboard, we immediately see key route telemetry: total miles, net driving hours, total elapsed journey time, and the exact count of scheduled interventions.
>
> On the interactive map, the complete corridor is visually mapped with color-coded regulatory stops:
> Green for departure, blue for shipper loading, cyan for mandatory 30-minute rest breaks, amber for fuel stops scheduled at or before 1,000 miles, and indigo for 10-hour off-duty sleeper resets. Every marker popup details the exact arrival time and federal compliance rationale."

---

## 🎬 Scene 4: FMCSA 24-Hour Vector SVG Daily Log Sheets
**⏱ Timestamp: `1:55 – 2:35` (40 seconds)**

### 🖥️ Visual Actions:
1. Scroll down to the **FMCSA 24-Hour Daily Log Sheets** section.
2. Click between **Day 1** and **Day 2** tabs at the top.
3. Use the zoom controls (`+` / `-`) to zoom in on the 24-hour grid.
4. Point out:
   - The plotted duty lines across: 1. Off Duty, 2. Sleeper Berth, 3. Driving, 4. On Duty (Not Driving).
   - The right-hand column showing the exact sum equaling **24.00 Hours**.
   - Remarks section with city/state locations and Driver Signature line.
5. Click **"Print Sheet"** or **"Download PDF"** to open the browser print dialog preview for 2 seconds (showing clean, Letter-size landscape document with UI elements hidden), then cancel back to the app.

### 🎙️ Speaker Script:
> "Now for the core deliverable: the **Official FMCSA 24-Hour Driver Daily Log Sheets**.
>
> Rather than a plain data table, RouteWise renders an authentic, vector SVG recreation of the official paper driver log:
> - Multi-day itineraries are cleanly partitioned at midnight in the driver's home terminal timezone.
> - The application draws horizontal status lines across all four duty statuses connected by minute-precise vertical transition lines.
> - On the right, hours are totaled across every status row, mathematically guaranteed to equal **exactly 24.00 hours** per day.
> - Complete with carrier info, shipping doc numbers, remarks for every duty change, and driver signature.
> - Drivers or safety managers can click **Download PDF** to instantly export a print-ready, Letter-size landscape document."

---

## 🎬 Scene 5: Audit-Ready Compliance Checklist & Wrap-Up
**⏱ Timestamp: `2:35 – 3:00` (25 seconds)**

### 🖥️ Visual Actions:
1. Scroll down to the **Compliance Audit & Regulatory Rationale** panel.
2. Highlight the green **"18/18 Checks Passed"** badge and audit items (Zero Overlaps, 11h Drive Limit Respected, 14h Duty Window Respected, Mandatory 30m Breaks, 10h Consecutive Resets).
3. Scroll back up smoothly to the top of the page.

### 🎙️ Speaker Script:
> "Finally, the **Compliance Audit Engine** validates the entire schedule against 18 rigorous federal safety checks—guaranteeing zero timeline overlaps, continuous duty tracking, and strict adherence to 49 CFR Part 395 regulations.
>
> RouteWise bridges commercial trucking dispatch with automated federal compliance in one seamless, modern web experience.
>
> Thank you for watching!"

---

## 💡 Quick Tips for the Presenter:
- **Browser Setup:** Record at 1080p (1920×1080) at 100% zoom with bookmarks bar hidden for a clean, pro look.
- **Pacing:** Speak at an even, conversational pace (~135 words per minute). The script is written to take ~2 minutes and 45 seconds, leaving you 15 seconds of buffer.
- **Mouse Movement:** Move the cursor deliberately. Hover over key badges and buttons for 1–2 seconds to draw the viewer's attention.
