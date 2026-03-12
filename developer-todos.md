# Alisto Capstone — Branch Changelog & Priority Backlog

**Branch:** `firebase-cms`  
**Date:** March 12, 2026  
**Scope:** All uncommitted changes since commit `ade21a5`

---

## 1. Changelog — Recent Changes by Layer

### 1.1 Database (PostgreSQL / Supabase)

| Change | Detail |
|--------|--------|
| **`active_devices` table** | New table with columns: `id SERIAL PK`, `user_id BIGINT FK→users`, `device_name`, `device_type`, `location`, `ip_address VARCHAR(45)`, `last_active TIMESTAMP`, `is_current_device BOOLEAN`, `created_at`. Unique constraint on `(user_id, device_name, ip_address)` for UPSERT support. |
| **`hospitals.current_patients` column** | Migration `002_add_current_patients_to_hospitals.sql` adds `current_patients INT DEFAULT 0` to `hospitals` table (idempotent PL/pgSQL). Seeds all 9 hospital rows with realistic patient counts calibrated for occupancy display (e.g., 1410/1500 = 94%). |

### 1.2 Backend — Node.js/Express (`node-backend/`)

#### New Files Created

| File | Purpose |
|------|---------|
| `src/controllers/authController.js` | `parseDeviceName(ua)` — User-Agent → readable name; `normalizeIp()` — maps `::1`, `::ffff:*` to `127.0.0.1`; `recordDevice` — UPSERT into `active_devices` on login; `getUserDevices` — returns all devices with dynamic `is_current_device` flag. |
| `src/controllers/dashboardController.js` | `getHospitals()` — active hospitals with computed occupancy % and priority tags; `getRealtimeIncidents()` — non-resolved incidents with reporter/responder names via LEFT JOINs. |
| `src/services/dashboardService.js` | `getHospitalsWithOccupancy()` — `(current_patients / bed_capacity) * 100` → Critical ≥90%, High 75-89%, Medium <75%; `getRealtimeIncidents()` — raw SQL query for live dashboard. |
| `src/routes/auth.js` | `POST /api/auth/record-device` — requires `authenticate` middleware. |
| `src/routes/users.js` | `GET /api/users/:user_id/devices` — requires `authenticate`, scoped to own user. |
| `src/routes/dashboard.js` | `GET /api/dashboard/hospitals`, `GET /api/dashboard/incidents/realtime` — `optionalAuth`. |
| `database/migrations/002_add_current_patients_to_hospitals.sql` | Described above under Database. |

#### Modified Files

| File | What Changed |
|------|-------------|
| `server.js` | Rate limiter relaxed for dev environment: 2000 req/window + `skip()` for localhost IPs. Added `isDev` flag. |
| `src/routes/index.js` | Mounted 3 new routers: `/dashboard`, `/auth`, `/users`. |
| `src/routes/profile.js` | Added `GET /api/profile/devices` and `DELETE /api/profile/devices/:deviceId`. |
| `src/routes/responders.js` | Added `PUT /api/responders/:id/status` — duty status update by `user_id`. |
| `src/controllers/profileController.js` | Added `getDevices()` and `removeDevice()` actions delegating to `profileService`. |
| `src/controllers/respondersController.js` | Added `updateStatus()` — validates body, calls `updateStatusByUserId()`. |
| `src/services/profileService.js` | Bcrypt hash normalization (`$2y$`/`$2a$` → `$2b$`); hash cost reduced 12→10; added `getDevices()` and `removeDevice()` methods. |
| `src/services/respondersService.js` | Added `updateStatusByUserId()` — UPSERT into `responders` table using `user_id`, creates row if not exists with auto-generated `responder_code`. |
| `src/services/activityService.js` | Merged `responder_activity` + `activity_logs` via `UNION ALL` query; added `ACTION_LABELS` map for human-readable descriptions; composite key `'ra_' || id` / `'al_' || id` prevents collisions. |
| `src/services/triageService.js` | `getTriageStats()` rewritten: groups active triage cases by hospital via JOIN, pivots into per-hospital objects with individual level counts — replaces old flat aggregate. |

### 1.3 Backend — Laravel (`backend/`)

| File | What Changed |
|------|-------------|
| `routes/api.php` | +184 lines: Added sensor data routes (`/api/sensor/*`), health simulator routes (`/api/simulator/*`), hospital patient distribution endpoint, DOH hospital reports endpoint, DOH triage status endpoint, incident polling endpoint. All with appropriate throttling. |
| `app/Http/Controllers/Api/SensorDataController.php` | **New.** `latest()`, `history()`, `store()`, `summary()` — bridges RPi sensor data to dashboard with graceful mock fallback when no real data exists. |
| `app/Http/Controllers/Api/HealthSimulatorController.php` | **New.** `start()` batch-generates simulated vitals per scenario (normal, fever, hypoxia, tachycardia, bradycardia, critical); `stream()` single reading; `cleanup()` purges simulated data; `scenarios()` lists available profiles. |

### 1.4 Frontend — React (`src/`)

| File | What Changed |
|------|-------------|
| `context/AuthContext.jsx` | Imports `nodeApi`; fires `POST /auth/record-device` (fire-and-forget) after successful login. |
| `context/TriageProvider.jsx` | **Removed all mock data.** Replaced `generatePatientTriage()` import with `nodeApi` calls to `/hospitals` + `/triage/patients`. Real-time UNION enrichment: groups patients by `hospital_id`, computes `counts` and `topDoctor` dynamically. Polling via `setInterval(fetchTriage, refreshInterval)`. |
| `components/responder/TriageCard.jsx` | Rewired to consume per-hospital stats from `GET /triage/stats` instead of dividing flat aggregate by hospital count. async/await replaces `.then()` chain. |
| `components/responder/HospitalPatientChart.jsx` | Refactored from `.then()` chain to async/await with explicit error logging. |
| `components/responder/Reports.jsx` | Refactored from `.then()` chain to async/await; improved error boundary. |
| `pages-responders/Settings.jsx` | **DutyStatusModal:** Now uses `user_id` instead of `responder_id`; calls `PUT /responders/:id/status`; rollback on failure; added `savedStatus` state. **ChangePasswordModal:** Wired to `PUT /profile/password` (was commented out). **LoggedInDevicesModal:** Imports `useAuth()`; fetches from `/users/:id/devices`; green "Current Device" badge; sorts by `last_active` DESC. |
| `pages-responders/Profile.jsx` | QR code only renders when `qrToken` exists from server; shows "QR unavailable" fallback instead of fabricated value. |
| `pages-responders/IncidentLogs.jsx` | Added 15-second polling via `setInterval` + `useRef`; `mergeIncidents()` upserts by `id` and re-sorts; no full-page re-fetch on each poll. |
| `services/nodeApi.js` | Modified (details not fully extracted but includes interceptor/config changes). |
| `services/sensorService.js` | **New.** Unified API layer for sensor/simulator endpoints; 10-second TTL cache with scoped keys; write operations invalidate cache. |

### 1.5 Edge — Raspberry Pi / Flask (`edge-scanner/`)

| File | What Changed |
|------|-------------|
| `scanner_service.py` | Added `LARAVEL_URL` env var; thread-safe `_latest_vitals` in-memory buffer; `POST /sensor/vitals` — receives RPi sensor data, caches locally, forwards to Laravel `POST /api/sensor/vitals`; `GET /sensor/vitals/latest` — returns cached vitals for local readout. Includes validation and error forwarding. |
| `requirements.txt` | Added commented-out RPi 5 sensor libraries (`adafruit-circuitpython-max30102`, `adafruit-circuitpython-mlx90614`) for heart rate/SpO2 and IR temperature sensors. |

### 1.6 DevOps / Config

| File | What Changed |
|------|-------------|
| `start.cmd` | **New.** Windows batch script: kills ports 5000/8000/4000, spawns Laravel + Node + Vite in separate cmd windows with staggered startup. |
| `.env` / `storage/.env` | Updated environment configuration (secrets redacted). |

---

## 2. Priority Backlog — Remaining Tasks

### P1 — Critical (Functional Blockers)

| # | Task | Component | Detail |
|---|------|-----------|--------|
| 1.1 | **Logistics Dashboard — Replace mock data** | `src/pages-logistics/Dashboard.jsx` | 6 mock arrays (`MOCK_RESOURCE_REQUESTS`, `MOCK_INVENTORY_ITEMS`, `MOCK_SHIPMENTS`, `MOCK_FACILITIES`, `MOCK_ASSETS`, `MOCK_NOTIFICATIONS`) with 40+ hardcoded entries. Wire to real API endpoints or create backing Node routes. |
| 1.2 | **Sidebar hardcoded name** | `src/components/Sidebar.jsx:193` | `"John Doe"` is hardcoded. Must pull from auth context `user.name`. |
| 1.3 | **Logistics Profile hardcoded** | `src/components/logistics/Profile.jsx:10-16` | Name `"John Doe"`, QR value `"John Doe | Youth Leader | johndoe@gmail.com"` — fully static. Wire to `nodeApi.get("/profile")`. |
| 1.4 | **mockAssetService.js** — 1800+ lines of mock data still in use | `src/services/mockAssetService.js` | Used by `maintenanceCalendarService.js`, `MaintenanceCalendar.jsx`, `ScheduleMaintenanceDrawer.jsx`. Entire asset registry maintenance system is backed by fake data. Create real backend endpoints or remove feature. |
| 1.5 | **EvacuationCenter — 100% mock** | `src/pages-patients/EvacuationCenter.jsx` | Hardcoded `centerData` with 3 fake centers. No API calls, no loading/error states. Also has undefined `setSelectedSupply` bug. |
| 1.6 | **Hospital patient distribution uses `mt_rand()`** | `backend/routes/api.php` `/hospitals/patient-distribution` | When real hospitals exist, occupancy is _simulated_ with `mt_rand(55, 90)` instead of reading actual `current_patients`. Replace with real query. |
| 1.7 | **DOH Hospital Reports uses `mt_rand()`** | `backend/routes/api.php` `/reports/doh-hospital` | Occupancy % is `mt_rand(45, 98)`. Should query actual data from `hospitals.current_patients` or triage cases. |

### P2 — High (Data & State Correctness)

| # | Task | Component | Detail |
|---|------|-----------|--------|
| 2.1 | **AssignAssetModal — mock allocations/responders** | `src/components/logistics/.../AssignAssetModal.jsx:12-30` | Comment says `// Mock data - replace with actual API calls`. Contains fake allocations and responders (`John Smith`, `Maria Garcia`). |
| 2.2 | **RequestsView — mock delivery fallback** | `src/components/logistics/ResourceMngmt/RequestsView.jsx:498-550` | Adds fake `allocation` object (driver `John Doe`, vehicle `DOH-REF-07`) when API doesn't return allocation data. |
| 2.3 | **ConnectivityMonitoring — fully mocked** | `src/components/admin/sections/ConnectivityMonitoring.jsx` | `pingHistory` and `accessPoints` arrays are static. No real monitoring. Create `/api/connectivity/status` endpoint or remove the page. |
| 2.4 | **maintenanceCalendarService.js** — `USE_MOCK_DATA = true` | `src/services/maintenanceCalendarService.js` | Three methods with `// TODO: Real API call`. Service is permanently locked to mock. |
| 2.5 | **Grades.jsx — mock grades** | `src/pages-responders/Grades.jsx:103-120` | `mockGrades` with 12 fake course scores. Wire to training/grades API. |
| 2.6 | **Patient Dashboard vitals — hardcoded** | `src/pages-patients/Dashboard.jsx:300-330` | 4 fake vital-sign records. Wire to sensor/vitals API or patient health records. |
| 2.7 | **HealthRecords.jsx — hardcoded triage history** | `src/pages-patients/HealthRecords.jsx:24-60` | 4 static triage records, same data as patient Dashboard. |
| 2.8 | **EmergencySOS hospital database hardcoded** | `src/pages-responders/EmergencySOS.jsx:76-330+` | 30+ hospitals with coordinates hardcoded by province. Consider sourcing from `hospitals` API. |
| 2.9 | **HospitalMap.jsx — hardcoded hospital list** | `src/pages-patients/HospitalMap.jsx:245-310` | Additional hardcoded hospitals duplicating EmergencySOS data. |
| 2.10 | **triageUtils.jsx static hospital list** | `src/lib/triageUtils.jsx:5-25` | 5 hospitals with specialties. `generatePatientTriage()` no longer imported but file is still present — candidate for removal or repurpose. |
| 2.11 | **`_fix_ip.mjs` temp file in node-backend** | `node-backend/_fix_ip.mjs` | Leftover debug script. Delete before commit. |

### P3 — Medium/Low (UI/UX & Polish)

| # | Task | Component | Detail |
|---|------|-----------|--------|
| 3.1 | **TODO: archive/mark-as-unread in Messages** | `src/components/responder/Messages.jsx:115-122`, `src/components/patients/Messages.jsx:451-458` | `// TODO: Implement archive functionality` and `// TODO: Implement mark as unread functionality`. |
| 3.2 | **TODO: Vehicle selection backend** | `src/pages-resident/2a_Vehicle.jsx:11`, `src/pages-resident/2b_OtherVehicle.jsx:10` | `// TODO: Send vehicle selection to backend` and `// TODO: Send custom vehicle type to backend`. |
| 3.3 | **courseContent.jsx — static content** | `src/data/courseContent.jsx` | Quiz questions, activity prompts are hardcoded. Acceptable for MVP if courses are static, but consider CMS integration for maintainability. |
| 3.4 | **Evacuation center data in `Hospitals.jsx` pattern** | Multiple files in `pages-patients/` | `MedicalFacilities.jsx`, `EvacuationCenter.jsx` share hardcoded facility data. Centralize into a facilities API. |
| 3.5 | **Missing loading/error states** | EvacuationCenter, ConnectivityMonitoring, Logistics Profile | No loading spinners, no error UI, no retry mechanisms. |
| 3.6 | **Admin fallback incidents** | `src/pages-admin/Admin.jsx` | Contains `fallbackIncidents` mock data template for UI when API call fails. Replace with a proper empty-state/error UI. |
| 3.7 | **Device record on session restore** | `src/context/AuthContext.jsx` (`initAuth`) | `record-device` only fires on fresh `login()`. If user restores session from `localStorage`, no device record is created/updated. Consider also calling record-device during `initAuth` when a cached session is valid. |
| 3.8 | **`triageUtils.jsx` dead code** | `src/lib/triageUtils.jsx` | `generatePatientTriage()` is no longer imported anywhere. Remove or archive to reduce bundle size. |
| 3.9 | **Centralize IP normalization** | `node-backend/src/controllers/authController.js` | `normalizeIp()` is currently local to one controller. If other controllers need it, extract to a shared utility. |

---

## 3. Summary Metrics

| Metric | Value |
|--------|-------|
| Files changed (tracked) | 24 |
| New files (untracked) | 11 |
| Lines added | ~710 |
| Lines removed | ~182 |
| New API endpoints (Node) | 6 (`record-device`, `user devices`, `dashboard hospitals`, `dashboard incidents`, `profile devices`, `responder status`) |
| New API endpoints (Laravel) | 8 (`sensor/*` x5, `simulator/*` x4, `hospitals/patient-distribution`, `reports/doh-hospital`, `reports/doh-triage`, `incidents/poll`) |
| Mock data sources remaining | ~12 files/components |
| Components fully wired to real APIs | Dashboard, TriageCard, TriageProvider, Reports, HospitalPatientChart, IncidentLogs, Settings (3 modals), Profile (QR), Messages (2), AuthContext |

---

*Generated from workspace analysis on `firebase-cms` branch — March 12, 2026*
