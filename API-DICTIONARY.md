# Alisto System — Master API Endpoint Dictionary

> **Generated:** March 12, 2026 | **Branch:** `firebase-cms`  
> **Scope:** Node.js/Express API · Laravel/Sanctum API · Flask Edge Scanner  
> **Total Endpoints:** 198+

---

## Table of Contents

1. [Node.js / Express API (port 5000)](#1-nodejs--express-api-port-5000)
2. [Laravel / Sanctum API (port 8000)](#2-laravel--sanctum-api-port-8000)
3. [Flask Edge Scanner (RPi — port 5000 on-device)](#3-flask-edge-scanner-rpi--port-5000-on-device)
4. [WebSocket / Broadcast Channels](#4-websocket--broadcast-channels)
5. [Cross-Layer Request Flow Map](#5-cross-layer-request-flow-map)
6. [Endpoint Count Summary](#6-endpoint-count-summary)

---

## 1. Node.js / Express API (port 5000)

**Base URL:** `http://localhost:5000/api`  
**Auth:** Sanctum bearer token validated via SHA-256 hash lookup in `personal_access_tokens`.  
**Middleware legend:** `auth` = `authenticate`, `opt` = `optionalAuth`, `role(x)` = `requireRole([x])`, `log(x)` = `activityLogger`, `upload` = multer

### 1.1 System & Health

| Method | Endpoint | Controller / Function | Middleware | Purpose |
|:-------|:---------|:----------------------|:-----------|:--------|
| GET | `/health` | Inline handler | — | Server heartbeat |
| GET | `/api/system/status` | `systemController.getStatus` | — | System status dashboard |

### 1.2 Auth & Device Tracking

| Method | Endpoint | Controller / Function | Middleware | Purpose |
|:-------|:---------|:----------------------|:-----------|:--------|
| POST | `/api/auth/record-device` | `authController.recordDevice` | auth | UPSERT device/browser into `active_devices` on login |
| GET | `/api/users/:user_id/devices` | `authController.getUserDevices` | auth | List user's logged-in devices (dynamic `is_current_device` flag) |

### 1.3 Profile

| Method | Endpoint | Controller / Function | Middleware | Purpose |
|:-------|:---------|:----------------------|:-----------|:--------|
| GET | `/api/profile` | `profileController.getProfile` | auth, log(profile_view) | Get authenticated user's profile |
| PUT | `/api/profile` | `profileController.updateProfile` | auth, log(profile_update) | Update profile fields |
| POST | `/api/profile/avatar` | `profileController.uploadAvatar` | auth, upload.single('avatar') | Upload profile photo |
| PUT | `/api/profile/password` | `profileController.changePassword` | auth | Change password (bcrypt `$2y$`→`$2b$` normalized) |
| GET | `/api/profile/devices` | `profileController.getDevices` | auth | List devices (profile scope) |
| DELETE | `/api/profile/devices/:deviceId` | `profileController.removeDevice` | auth | Log out a specific device |

### 1.4 Account

| Method | Endpoint | Controller / Function | Middleware | Purpose |
|:-------|:---------|:----------------------|:-----------|:--------|
| GET | `/api/account/status` | `accountController.getStatus` | auth | Account verification status |
| PUT | `/api/account/verify` | `accountController.verify` | auth, role(admin,doh_officer) | Verify user account |
| PUT | `/api/account/deactivate` | `accountController.deactivate` | auth | Deactivate own account |

### 1.5 Activity

| Method | Endpoint | Controller / Function | Middleware | Purpose |
|:-------|:---------|:----------------------|:-----------|:--------|
| GET | `/api/activity` | `activityController.getActivity` | auth | Paginated activity log (UNION of `responder_activity` + `activity_logs`) |

### 1.6 Dashboard

| Method | Endpoint | Controller / Function | Middleware | Purpose |
|:-------|:---------|:----------------------|:-----------|:--------|
| GET | `/api/dashboard/hospitals` | `dashboardController.getDashboardHospitals` | opt | Hospitals with computed occupancy % and priority tags |
| GET | `/api/dashboard/incidents/realtime` | `dashboardController.getRealtimeIncidents` | opt | Non-resolved incidents with reporter/responder names |

### 1.7 Hospitals

| Method | Endpoint | Controller / Function | Middleware | Purpose |
|:-------|:---------|:----------------------|:-----------|:--------|
| GET | `/api/hospitals` | `hospitalsController.getAll` | opt | List all active hospitals |
| GET | `/api/hospitals/patient-distribution` | `hospitalsController.getPatientDistribution` | opt | Patient count distribution across hospitals |
| GET | `/api/hospitals/:id` | `hospitalsController.getById` | opt | Single hospital detail |
| GET | `/api/hospitals/:id/patients` | `hospitalsController.getHospitalPatients` | opt | Patients at a specific hospital |

### 1.8 Incidents

| Method | Endpoint | Controller / Function | Middleware | Purpose |
|:-------|:---------|:----------------------|:-----------|:--------|
| GET | `/api/incidents` | `incidentsController.getAll` | opt | List incidents (filterable, sortable) |
| GET | `/api/incidents/:id` | `incidentsController.getById` | opt | Single incident detail |
| POST | `/api/incidents` | `incidentsController.create` | auth | Report new incident |
| PUT | `/api/incidents/:id` | `incidentsController.update` | auth | Update incident |
| DELETE | `/api/incidents/:id` | `incidentsController.remove` | auth, role(admin) | Delete incident |

### 1.9 Triage

| Method | Endpoint | Controller / Function | Middleware | Purpose |
|:-------|:---------|:----------------------|:-----------|:--------|
| GET | `/api/triage` | `triageController.getAll` | opt | List all triage cases |
| GET | `/api/triage/stats` | `triageController.getStats` | opt | Per-hospital triage level counts |
| GET | `/api/triage/patients` | `triageController.getPatients` | opt | Paginated triage patient list |
| GET | `/api/triage/:id` | `triageController.getById` | opt | Single triage case |
| POST | `/api/triage` | `triageController.createCase` | auth, role(admin,doh_officer,responder) | Create triage case |
| PUT | `/api/triage/:id` | `triageController.updateCase` | auth, role(admin,doh_officer,responder) | Update triage case |
| POST | `/api/triage/patient` | `triageController.addPatient` | auth, role(admin,doh_officer,responder) | Add patient to triage |
| PUT | `/api/triage/patient/:id` | `triageController.updatePatient` | auth, role(admin,doh_officer,responder) | Update triage patient |

### 1.10 Responders

| Method | Endpoint | Controller / Function | Middleware | Purpose |
|:-------|:---------|:----------------------|:-----------|:--------|
| GET | `/api/responders` | `respondersController.getAll` | opt | List all responders |
| GET | `/api/responders/active` | `respondersController.getActive` | opt | Active responders only |
| GET | `/api/responders/stats` | `respondersController.getStats` | opt | Responder status breakdown |
| GET | `/api/responders/:id` | `respondersController.getById` | opt | Single responder detail |
| POST | `/api/responders` | `respondersController.create` | auth, role(admin,doh_officer) | Create responder record |
| PUT | `/api/responders/:id/status` | `respondersController.updateStatus` | auth | Update duty status (UPSERT by user_id) |
| PUT | `/api/responders/:id` | `respondersController.update` | auth | Update responder profile |

### 1.11 Resources

| Method | Endpoint | Controller / Function | Middleware | Purpose |
|:-------|:---------|:----------------------|:-----------|:--------|
| GET | `/api/resources` | `resourcesController.getAll` | opt | List resources/supplies |
| GET | `/api/resources/summary` | `resourcesController.getSummary` | opt | Aggregate resource counts |
| GET | `/api/resources/:id` | `resourcesController.getById` | opt | Single resource detail |
| POST | `/api/resources` | `resourcesController.create` | auth, role(admin,doh_officer) | Create resource |
| PUT | `/api/resources/:id` | `resourcesController.update` | auth, role(admin,doh_officer) | Update resource |
| DELETE | `/api/resources/:id` | `resourcesController.remove` | auth, role(admin) | Delete resource |

### 1.12 Reports

| Method | Endpoint | Controller / Function | Middleware | Purpose |
|:-------|:---------|:----------------------|:-----------|:--------|
| GET | `/api/reports` | `reportsController.getAll` | opt | List reports |
| GET | `/api/reports/:id` | `reportsController.getById` | opt | Single report |
| POST | `/api/reports` | `reportsController.create` | auth, role(admin,doh_officer,responder) | Create report |
| PUT | `/api/reports/:id` | `reportsController.update` | auth, role(admin,doh_officer) | Update report |
| DELETE | `/api/reports/:id` | `reportsController.remove` | auth, role(admin) | Delete report |

### 1.13 Notifications

| Method | Endpoint | Controller / Function | Middleware | Purpose |
|:-------|:---------|:----------------------|:-----------|:--------|
| GET | `/api/notifications` | `notificationsController.getNotifications` | auth | List user notifications |
| GET | `/api/notifications/unread` | `notificationsController.getUnread` | auth | Unread count |
| PUT | `/api/notifications/read-all` | `notificationsController.markAllAsRead` | auth | Mark all as read |
| PUT | `/api/notifications/:id/read` | `notificationsController.markAsRead` | auth | Mark single as read |
| POST | `/api/notifications` | `notificationsController.createNotification` | auth, role(admin,doh_officer) | Broadcast notification |
| DELETE | `/api/notifications/:id` | `notificationsController.deleteNotification` | auth | Delete notification |

### 1.14 QR Codes

| Method | Endpoint | Controller / Function | Middleware | Purpose |
|:-------|:---------|:----------------------|:-----------|:--------|
| POST | `/api/qr/bind` | `qrController.bind` | auth | Bind QR token to user |
| POST | `/api/qr/scan` | `qrController.scan` | X-Edge-Key header | Receive scan from edge device |
| GET | `/api/qr/user/:userId` | `qrController.getByUser` | auth | Get QR token for user |
| POST | `/api/qr/regenerate` | `qrController.regenerate` | auth | Regenerate QR token |
| POST | `/api/qr/status` | `qrController.updateStatus` | auth | Update QR active/inactive status |

### 1.15 Location

| Method | Endpoint | Controller / Function | Middleware | Purpose |
|:-------|:---------|:----------------------|:-----------|:--------|
| GET | `/api/location/areas` | `locationController.getAreas` | opt | Service coverage areas |
| GET | `/api/location/current` | `locationController.getCurrentLocation` | auth | User's last known location |
| POST | `/api/location/current` | `locationController.updateLocation` | auth | Update user location |

### 1.16 Logs

| Method | Endpoint | Controller / Function | Middleware | Purpose |
|:-------|:---------|:----------------------|:-----------|:--------|
| POST | `/api/logs` | `logsController.create` | auth | Create log entry |
| GET | `/api/logs/:userId` | `logsController.getByUser` | auth | Get logs by user |

### 1.17 Search

| Method | Endpoint | Controller / Function | Middleware | Purpose |
|:-------|:---------|:----------------------|:-----------|:--------|
| GET | `/api/search` | `searchController.globalSearch` | opt | Global search across entities |

### 1.18 Settings

| Method | Endpoint | Controller / Function | Middleware | Purpose |
|:-------|:---------|:----------------------|:-----------|:--------|
| GET | `/api/settings` | `settingsController.getSettings` | auth | Get user settings |
| PUT | `/api/settings` | `settingsController.updateSettings` | auth | Update user settings |

### 1.19 Training

| Method | Endpoint | Controller / Function | Middleware | Purpose |
|:-------|:---------|:----------------------|:-----------|:--------|
| GET | `/api/training/progress` | `trainingController.getProgress` | auth | Get training progress for authenticated user |
| PUT | `/api/training/progress/:courseId` | `trainingController.updateProgress` | auth | Update course progress |
| GET | `/api/training/certifications` | `trainingController.getCertifications` | auth | List certifications earned |
| POST | `/api/training/update` | `trainingController.updateViaPost` | auth | Bulk training update |
| GET | `/api/training/:userId` | `trainingController.getProgressByUserId` | auth | Get training progress for a specific user |

> **Node.js Total: 76 endpoints**

---

## 2. Laravel / Sanctum API (port 8000)

**Base URL:** `http://localhost:8000/api`  
**Auth:** Laravel Sanctum (`auth:sanctum`).  
**Middleware legend:** `sanctum` = `auth:sanctum`, `role(x)` = `role:x`, `T(n)` = `throttle:n,1`

### 2.1 Public — Auth & Registration

| Method | Endpoint | Controller / Function | Middleware | Purpose |
|:-------|:---------|:----------------------|:-----------|:--------|
| POST | `/api/register` | `AuthController@register` | T(10) | User registration |
| POST | `/api/login` | `AuthController@login` | T(10) | Login → returns Sanctum token |
| POST | `/api/forgot-password` | `AuthController@forgotPassword` | T(10) | Password reset email |
| GET | `/api/health` | Inline closure | — | API health check |

### 2.2 Public — Read-Only Data

| Method | Endpoint | Controller / Function | Middleware | Purpose |
|:-------|:---------|:----------------------|:-----------|:--------|
| GET | `/api/hospitals` | `HospitalController@index` | T(60) | List all hospitals |
| GET | `/api/resources` | `ResourceController@index` | T(60) | List all resources |
| GET | `/api/geocode/reverse` | Inline (Nominatim proxy) | T(30) | Reverse geocode coordinates to address |
| GET | `/api/hospitals/patient-distribution` | Inline closure | T(60) | Hospital occupancy distribution |
| GET | `/api/reports/doh-hospital` | Inline closure | T(60) | DOH hospital priority report |
| GET | `/api/reports/doh-triage` | Inline closure | T(60) | DOH triage severity summary |
| GET | `/api/incidents/poll` | Inline closure | T(120) | Lightweight incident polling with `?since=` |

### 2.3 Public — Sensor Data (RPi Ingestion)

| Method | Endpoint | Controller / Function | Middleware | Purpose |
|:-------|:---------|:----------------------|:-----------|:--------|
| GET | `/api/sensor/vitals/latest` | `SensorDataController@latest` | T(120) | Latest vital signs reading |
| GET | `/api/sensor/vitals/history` | `SensorDataController@history` | T(120) | Time-series vitals (limit 500) |
| GET | `/api/sensor/vitals/summary` | `SensorDataController@summary` | T(120) | Aggregate stats (avg, abnormal counts) |
| GET | `/api/sensor/status` | `SensorDataController@deviceStatus` | T(120) | Sensor device status |
| POST | `/api/sensor/vitals` | `SensorDataController@store` | T(120) | Ingest vital signs from RPi edge |

### 2.4 Authenticated — Common

| Method | Endpoint | Controller / Function | Middleware | Purpose |
|:-------|:---------|:----------------------|:-----------|:--------|
| POST | `/api/logout` | `AuthController@logout` | sanctum, T(120) | Revoke token |
| GET | `/api/me` | `AuthController@me` | sanctum, T(120) | Current user info |
| PUT | `/api/profile` | `AuthController@updateProfile` | sanctum, T(120) | Update profile |
| POST | `/api/verify-id` | `AuthController@verifyId` | sanctum, T(120) | Initiate ID verification |
| POST | `/api/submit-verification` | `AuthController@submitVerification` | sanctum, T(120) | Submit verification docs |
| GET | `/api/notifications` | `NotificationController@index` | sanctum, T(120) | Get notifications |
| POST | `/api/broadcasting/auth` | Inline (Broadcast::auth) | sanctum | WebSocket channel auth |

### 2.5 Authenticated — Health Simulator

| Method | Endpoint | Controller / Function | Middleware | Purpose |
|:-------|:---------|:----------------------|:-----------|:--------|
| GET | `/api/simulator/scenarios` | `HealthSimulatorController@scenarios` | sanctum, T(30) | List simulation profiles |
| POST | `/api/simulator/start` | `HealthSimulatorController@start` | sanctum, T(30) | Batch-generate simulated vitals |
| POST | `/api/simulator/stream` | `HealthSimulatorController@stream` | sanctum, T(30) | Single simulated reading (no persist) |
| DELETE | `/api/simulator/cleanup` | `HealthSimulatorController@cleanup` | sanctum, T(30) | Purge simulated records |

### 2.6 Authenticated — Chat & NLP

| Method | Endpoint | Controller / Function | Middleware | Purpose |
|:-------|:---------|:----------------------|:-----------|:--------|
| GET | `/api/chat/conversations` | `ChatController@getConversations` | sanctum, T(120) | List conversations |
| GET | `/api/chat/messages/:userId` | `ChatController@getMessages` | sanctum, T(120) | Messages with a user |
| POST | `/api/chat/messages` | `ChatController@sendMessage` | sanctum, T(120) | Send message |
| DELETE | `/api/chat/messages/:messageId` | `ChatController@deleteMessage` | sanctum, T(120) | Delete message |
| POST | `/api/nlp/analyze-message` | `NLPController@analyzeMessage` | sanctum, T(120) | NLP sentiment/intent |
| POST | `/api/nlp/urgency-check` | `NLPController@urgencyCheck` | sanctum, T(120) | Message urgency scoring |
| POST | `/api/nlp/analyze-conversation` | `NLPController@analyzeConversation` | sanctum, T(120) | Full conversation NLP |
| POST | `/api/nlp/bulk-urgency` | `NLPController@bulkUrgencyAnalysis` | sanctum, T(120) | Batch urgency |
| GET | `/api/nlp/incident/:id/analysis` | `NLPController@analyzeIncidentMessages` | sanctum, role(admin,responder) | Incident NLP analysis |

### 2.7 Authenticated — Appointments & Route Logs

| Method | Endpoint | Controller / Function | Middleware | Purpose |
|:-------|:---------|:----------------------|:-----------|:--------|
| POST | `/api/book-appointment` | `AppointmentController@store` | sanctum, T(120) | Book appointment |
| GET | `/api/appointments` | `AppointmentController@index` | sanctum, T(120) | List appointments |
| DELETE | `/api/appointments/:id` | `AppointmentController@destroy` | sanctum, T(120) | Cancel appointment |
| POST | `/api/route-logs` | `RouteLogController@store` | sanctum, T(120) | Create route log |
| POST | `/api/route-logs/:id/deviations` | `RouteLogController@storeDeviation` | sanctum, T(120) | Record deviation |
| GET | `/api/route-logs` | `RouteLogController@index` | sanctum, T(120) | List route logs |

### 2.8 Authenticated — Gemini AI

| Method | Endpoint | Controller / Function | Middleware | Purpose |
|:-------|:---------|:----------------------|:-----------|:--------|
| POST | `/api/gemini/context` | `GeminiController@generate` | sanctum, T(120) | AI-generated context for incident triage |

### 2.9 Admin Only

| Method | Endpoint | Controller / Function | Middleware | Purpose |
|:-------|:---------|:----------------------|:-----------|:--------|
| GET | `/api/admin/users` | `AuthController@getAllUsers` | sanctum, role(admin) | List all users |
| PUT | `/api/admin/users/:id/activate` | `AuthController@activateUser` | sanctum, role(admin) | Activate user |
| PUT | `/api/admin/users/:id/deactivate` | `AuthController@deactivateUser` | sanctum, role(admin) | Deactivate user |
| POST | `/api/notifications` | `NotificationController@store` | sanctum, role(admin) | Broadcast system notification |

### 2.10 Admin + Logistics — Requests & Allocations

| Method | Endpoint | Controller / Function | Middleware | Purpose |
|:-------|:---------|:----------------------|:-----------|:--------|
| GET | `/api/requests` | `RequestController@index` | sanctum, role(admin,logistics) | List supply requests |
| POST | `/api/requests` | `RequestController@store` | sanctum, role(admin,logistics) | Create request |
| GET | `/api/requests/:id` | `RequestController@show` | sanctum, role(admin,logistics) | Request detail |
| POST | `/api/requests/draft` | `RequestController@storeDraft` | sanctum, role(admin,logistics) | Save draft |
| DELETE | `/api/requests/:id` | `RequestController@destroy` | sanctum, role(admin,logistics) | Delete request |
| PATCH | `/api/requests/:id/draft` | `RequestController@updateDraft` | sanctum, role(admin,logistics) | Update draft |
| POST | `/api/requests/:id/submit` | `RequestController@submitDraft` | sanctum, role(admin,logistics) | Submit draft |
| POST | `/api/requests/:id/under-review` | `RequestController@markAsUnderReview` | sanctum, role(admin,logistics) | Mark under review |
| GET | `/api/allocations` | `AllocationController@index` | sanctum, role(admin,logistics) | List allocations |
| POST | `/api/allocations` | `AllocationController@store` | sanctum, role(admin,logistics) | Create allocation |
| POST | `/api/allocations/bulk` | `AllocationController@bulkCreate` | sanctum, role(admin,logistics) | Bulk create |
| GET | `/api/allocations/my` | `AllocationController@myAllocations` | sanctum, role(admin,logistics) | Own allocations |
| PATCH | `/api/allocations/:id/confirm` | `AllocationController@confirm` | sanctum, role(admin,logistics) | Confirm allocation |
| GET | `/api/allocations/suggestions/:requestId` | `AllocationController@suggestions` | sanctum, role(admin,logistics) | Smart suggestions |
| DELETE | `/api/allocations/:id/reject` | `AllocationController@rejectSuggestion` | sanctum, role(admin,logistics) | Reject suggestion |
| PATCH | `/api/allocations/:id/assign` | `AllocationController@assign` | sanctum, role(admin,logistics) | Assign allocation |
| GET | `/api/allocations/:id/assignment-details` | `AllocationController@assignmentDetails` | sanctum, role(admin,logistics) | Assignment details |
| GET | `/api/allocations/pending/count` | `AllocationController@pendingCount` | sanctum, role(admin,logistics) | Pending count |
| GET | `/api/allocations/my/count` | `AllocationController@myAllocationsCount` | sanctum, role(admin,logistics) | Own count |
| GET | `/api/allocations/:id/details` | `AllocationController@showWithDetails` | sanctum, role(admin,logistics) | Full details |
| GET | `/api/allocations/:id` | `AllocationController@show` | sanctum, role(admin,logistics) | Single allocation |
| GET | `/api/allocations/:id/assignment` | `AllocationController@assignment` | sanctum, role(admin,logistics) | Assignment record |
| GET | `/api/allocations/:id/suggest-vehicle` | `AllocationController@suggestVehicle` | sanctum, role(admin,logistics) | Vehicle suggestion |
| GET | `/api/allocations/:id/suggest-responder` | `AllocationController@suggestResponder` | sanctum, role(admin,logistics) | Responder suggestion |
| GET | `/api/allocations/:id/available-vehicles` | `AllocationController@availableVehicles` | sanctum, role(admin,logistics) | Available vehicles |
| GET | `/api/allocations/:id/available-responders` | `AllocationController@availableResponders` | sanctum, role(admin,logistics) | Available responders |

### 2.11 Admin + Logistics — Assets

| Method | Endpoint | Controller / Function | Middleware | Purpose |
|:-------|:---------|:----------------------|:-----------|:--------|
| GET | `/api/assets` | `AssetController@index` | sanctum, role(admin,logistics) | List assets |
| POST | `/api/assets` | `AssetController@store` | sanctum, role(admin,logistics) | Create asset |
| GET | `/api/assets/metrics` | `AssetController@metrics` | sanctum, role(admin,logistics) | Asset metrics |
| GET | `/api/assets/export/csv` | `AssetController@exportCsv` | sanctum, role(admin,logistics) | CSV export |
| GET | `/api/assets/available` | `AssetController@available` | sanctum, role(admin,logistics) | Available assets |
| GET | `/api/assets/:code` | `AssetController@show` | sanctum, role(admin,logistics) | Asset detail |
| PUT | `/api/assets/:code` | `AssetController@update` | sanctum, role(admin,logistics) | Update asset |
| DELETE | `/api/assets/:code` | `AssetController@destroy` | sanctum, role(admin,logistics) | Delete asset |
| POST | `/api/assets/:code/adjust-stock` | `AssetController@adjustStock` | sanctum, role(admin,logistics) | Adjust stock |
| GET | `/api/responders/available` | `ResponderController@available` | sanctum, role(admin,logistics) | Available responders |

### 2.12 Admin + Logistics — Resources (Inventory)

| Method | Endpoint | Controller / Function | Middleware | Purpose |
|:-------|:---------|:----------------------|:-----------|:--------|
| POST | `/api/resources` | `ResourceController@store` | sanctum, role(admin,logistics) | Create resource |
| PUT | `/api/resources/:id` | `ResourceController@update` | sanctum, role(admin,logistics) | Update resource |
| DELETE | `/api/resources/:id` | `ResourceController@destroy` | sanctum, role(admin,logistics) | Delete resource |
| GET | `/api/resources/calendar/events` | `ResourceController@calendarEvents` | sanctum, role(admin,logistics) | Calendar events |
| GET | `/api/resources/calendar/events/:date` | `ResourceController@dateEvents` | sanctum, role(admin,logistics) | Events for date |
| GET | `/api/resources/:id/history` | `ResourceController@resourceHistory` | sanctum, role(admin,logistics) | Resource history |
| GET | `/api/resources/stock-movements` | `ResourceController@stockMovements` | sanctum, role(admin,logistics) | Stock movement log |
| POST | `/api/resources/:id/adjust-stock` | `ResourceController@adjustStock` | sanctum, role(admin,logistics) | Adjust stock |
| GET | `/api/resources/low-stock` | `ResourceController@lowStock` | sanctum, role(admin,logistics) | Low stock alerts |
| GET | `/api/resources/critical` | `ResourceController@critical` | sanctum, role(admin,logistics) | Critical stock |
| GET | `/api/resources/expiring` | `ResourceController@expiring` | sanctum, role(admin,logistics) | Expiring resources |

### 2.13 Admin + Logistics — Hospitals (CRUD)

| Method | Endpoint | Controller / Function | Middleware | Purpose |
|:-------|:---------|:----------------------|:-----------|:--------|
| POST | `/api/hospitals` | `HospitalController@store` | sanctum, role(admin,logistics) | Create hospital |
| PUT | `/api/hospitals/:id` | `HospitalController@update` | sanctum, role(admin,logistics) | Update hospital |
| DELETE | `/api/hospitals/:id` | `HospitalController@destroy` | sanctum, role(admin,logistics) | Delete hospital |

### 2.14 Admin + Logistics — Hospital Safety Index (HSI)

| Method | Endpoint | Controller / Function | Middleware | Purpose |
|:-------|:---------|:----------------------|:-----------|:--------|
| GET | `/api/hsi/dashboard` | `HSIController@dashboard` | sanctum, role(admin,logistics) | HSI overview |
| GET | `/api/hsi/hospitals/:id/compliance` | `HSIController@hospitalCompliance` | sanctum, role(admin,logistics) | Hospital compliance report |
| POST | `/api/hsi/hospitals/:id/simulate-disaster` | `HSIController@simulateDisaster` | sanctum, role(admin,logistics) | Run disaster simulation |
| POST | `/api/hsi/hospitals/:id/recalculate` | `HSIController@recalculateResilience` | sanctum, role(admin,logistics) | Recalculate resilience |
| POST | `/api/hsi/hospitals/:id/disaster-mode/activate` | `HSIController@activateDisasterMode` | sanctum, role(admin,logistics) | Activate disaster mode |
| POST | `/api/hsi/hospitals/:id/disaster-mode/deactivate` | `HSIController@deactivateDisasterMode` | sanctum, role(admin,logistics) | Deactivate disaster mode |
| GET | `/api/hsi/hospitals/:id/assessments` | `HSIController@assessments` | sanctum, role(admin,logistics) | List assessments |
| POST | `/api/hsi/hospitals/:id/assessments` | `HSIController@storeAssessment` | sanctum, role(admin,logistics) | Create assessment |
| GET | `/api/hsi/assessments/:id` | `HSIController@showAssessment` | sanctum, role(admin,logistics) | Assessment detail |
| GET | `/api/hsi/hospitals/:id/tanks` | `HSIController@tanks` | sanctum, role(admin,logistics) | List water tanks |
| POST | `/api/hsi/hospitals/:id/tanks` | `HSIController@storeTank` | sanctum, role(admin,logistics) | Create tank |
| PATCH | `/api/hsi/tanks/:id/level` | `HSIController@updateTankLevel` | sanctum, role(admin,logistics) | Update tank level |
| POST | `/api/hsi/tanks/:id/refill` | `HSIController@refillTank` | sanctum, role(admin,logistics) | Refill tank |
| GET | `/api/hsi/tanks/:id/history` | `HSIController@tankHistory` | sanctum, role(admin,logistics) | Tank history |
| GET | `/api/hsi/hospitals/:id/vendors` | `HSIController@vendors` | sanctum, role(admin,logistics) | List vendors |
| POST | `/api/hsi/hospitals/:id/vendors` | `HSIController@storeVendor` | sanctum, role(admin,logistics) | Create vendor |
| PATCH | `/api/hsi/vendors/:id` | `HSIController@updateVendor` | sanctum, role(admin,logistics) | Update vendor |
| POST | `/api/hsi/vendors/:id/trigger` | `HSIController@triggerVendor` | sanctum, role(admin,logistics) | Trigger vendor alert |
| GET | `/api/hsi/hospitals/:id/resilience-configs` | `HSIController@resilienceConfigs` | sanctum, role(admin,logistics) | Resilience configs |
| POST | `/api/hsi/hospitals/:id/resilience-configs` | `HSIController@storeResilienceConfig` | sanctum, role(admin,logistics) | Create config |

### 2.15 Incidents & Responder Dispatch

| Method | Endpoint | Controller / Function | Middleware | Purpose |
|:-------|:---------|:----------------------|:-----------|:--------|
| GET | `/api/incidents` | `IncidentApiController@index` | sanctum, role(admin,responder,logistics,patient) | List incidents |
| GET | `/api/incidents/:id` | `IncidentApiController@show` | sanctum, role(admin,responder,logistics,patient) | Incident detail |
| GET | `/api/incidents/:id/history` | `IncidentApiController@history` | sanctum, role(admin,responder,logistics,patient) | Status history |
| GET | `/api/road-blockades` | `RoadBlockadeController@index` | sanctum, role(admin,responder,logistics,patient) | List blockades |
| GET | `/api/incidents/:id/conversation` | `IncidentApiController@conversation` | sanctum, role(admin,responder,logistics) | Incident chat |
| GET | `/api/incidents/:id/hospital-recommendations` | `IncidentApiController@hospitalRecommendations` | sanctum, role(admin,responder,logistics) | Nearest hospitals |
| POST | `/api/incidents/:id/assign` | `IncidentApiController@assign` | sanctum, role(admin,responder,logistics) | Assign responder |
| POST | `/api/incidents/:id/status` | `IncidentApiController@updateStatus` | sanctum, role(admin,responder,logistics) | Update status |
| POST | `/api/incidents/assign-nearest` | `IncidentApiController@assignNearest` | sanctum, role(admin,responder,logistics) | Auto-assign nearest |
| GET | `/api/incidents/:id/smart-responder-recommendations` | `IncidentApiController@smartResponderRecommendations` | sanctum, role(admin,responder,logistics) | AI responder suggestions |
| POST | `/api/incidents/:id/smart-auto-assign` | `IncidentApiController@smartAutoAssign` | sanctum, role(admin,responder,logistics) | AI auto-assign |

### 2.16 Road Blockades (Responder CRUD)

| Method | Endpoint | Controller / Function | Middleware | Purpose |
|:-------|:---------|:----------------------|:-----------|:--------|
| POST | `/api/road-blockades` | `RoadBlockadeController@store` | sanctum, role(admin,responder,logistics) | Create blockade |
| PUT | `/api/road-blockades/:id` | `RoadBlockadeController@update` | sanctum, role(admin,responder,logistics) | Update blockade |
| DELETE | `/api/road-blockades/:id` | `RoadBlockadeController@destroy` | sanctum, role(admin,responder,logistics) | Delete blockade |
| POST | `/api/road-blockades/route` | `RoadBlockadeController@getRouteBlockades` | sanctum, role(admin,responder,logistics) | Blockades along route |
| PATCH | `/api/road-blockades/:id/remove` | `RoadBlockadeController@removeBlockade` | sanctum, role(admin,responder,logistics) | Remove from coverage |

### 2.17 Patient-Specific

| Method | Endpoint | Controller / Function | Middleware | Purpose |
|:-------|:---------|:----------------------|:-----------|:--------|
| GET | `/api/lab-results` | `LabResultController@index` | sanctum, role(admin,patient) | Lab results |
| GET | `/api/rescue/active` | `ResponderTrackingController@getMyActiveRescue` | sanctum, role(admin,patient) | Patient's active rescue |
| GET | `/api/incidents/:id/responder-location` | `ResponderTrackingController@getResponderLocation` | sanctum, role(admin,patient) | Track responder location |

### 2.18 Responder Location Tracking

| Method | Endpoint | Controller / Function | Middleware | Purpose |
|:-------|:---------|:----------------------|:-----------|:--------|
| POST | `/api/incidents/:id/responder-location` | `ResponderTrackingController@updateLocation` | sanctum, role(admin,responder) | Push GPS coordinates during response |

### 2.19 Debug / Test (Dev Only)

| Method | Endpoint | Controller / Function | Middleware | Purpose |
|:-------|:---------|:----------------------|:-----------|:--------|
| GET | `/api/debug/reverb` | Inline closure | T(10) | Test Reverb WebSocket connectivity |
| POST | `/api/debug/broadcast-auth` | Inline closure | sanctum, T(30) | Test channel auth rules |
| GET | `/api/test/hospitals` | Inline closure | — | Raw Hospital model dump |
| GET | `/api/test/resources` | Inline closure | — | Raw Resource model dump |

> **Laravel Total: 122+ endpoints**

---

## 3. Flask Edge Scanner (RPi — port 5000 on-device)

**Base URL:** `http://<rpi-ip>:5000`  
**Auth:** `X-Edge-Key` shared secret header (for backend forwarding only).  
**Runtime:** Python/Flask on Raspberry Pi 5

| Method | Endpoint | Function | Purpose |
|:-------|:---------|:---------|:--------|
| GET | `/health` | `health()` | Edge device heartbeat |
| POST | `/scan` | `scan()` | Receive QR code from hardware scanner → forward to Node `POST /api/qr/scan` |
| POST | `/sensor/vitals` | `ingest_vitals()` | Receive sensor readings (HR, SpO2, temp) → cache locally + forward to Laravel `POST /api/sensor/vitals` |
| GET | `/sensor/vitals/latest` | `get_latest_vitals()` | Return cached sensor readings (`?user_uuid=` filter) |
| GET | `/sensor/simulate` | `simulate_reading()` | Generate mock sensor reading for testing (no persist) |

> **Flask Total: 5 endpoints**

---

## 4. WebSocket / Broadcast Channels

**Provider:** Laravel Reverb (via Pusher protocol)  
**Auth:** `POST /api/broadcasting/auth` (Sanctum token)

| Channel | Type | Auth Rule | Purpose |
|:--------|:-----|:----------|:--------|
| `online` | Presence | Any authenticated user | Online user awareness |
| `incidents` | Presence | role: admin, responder, logistics, patient | Real-time incident updates |
| `chat.user.{userId}` | Private | User ID match | 1-to-1 private messaging |
| `chat.group.{groupId}` | Private | User must be member | Group messaging |
| `incident.{incidentId}.tracking` | Private | Owner, assigned responder, or admin | Live responder GPS during rescue |

---

## 5. Cross-Layer Request Flow Map

```
┌─────────────┐     Sanctum Token      ┌──────────────────────┐
│  React SPA  │◄──────────────────────► │  Laravel API (:8000) │
│  (Vite :4000)│                        │  Auth, Chat, NLP,    │
│             │     Sanctum Token       │  Incidents, Logistics│
│  nodeApi ───┼────────────────────────►│                      │
│             │                         └──────────┬───────────┘
│  api ───────┼──►  Node API (:5000)               │
│             │   Profile, Triage,                  │ POST /api/sensor/vitals
│             │   Dashboard, QR,                    │
│             │   Devices, Resources                │
└─────────────┘                                     │
                                                    ▼
                   ┌──────────────────────┐    ┌──────────────┐
                   │  Flask Edge (:5000)  │───►│  RPi Sensors │
                   │  QR scan → Node     │    │  MAX30102    │
                   │  Vitals → Laravel   │    │  MLX90614    │
                   │  Local cache        │    └──────────────┘
                   └──────────────────────┘
```

**Key data flows:**
1. **Login:** React → Laravel `POST /api/login` → token → React stores in localStorage → `nodeApi` interceptor attaches to Node calls
2. **QR Scan:** RPi scanner → Flask `POST /scan` → Node `POST /api/qr/scan` (X-Edge-Key auth)
3. **Vitals:** RPi sensors → Flask `POST /sensor/vitals` → Laravel `POST /api/sensor/vitals` → DB
4. **Real-time Chat:** React ↔ Laravel Reverb WebSocket (Pusher protocol) via `chat.user.{id}` channels
5. **Incident Tracking:** Responder app → Laravel `POST /incidents/:id/responder-location` → Reverb `incident.{id}.tracking` → Patient app

---

## 6. Endpoint Count Summary

| Layer | Public | Authenticated | Role-Restricted | Total |
|:------|-------:|--------------:|----------------:|------:|
| Node.js/Express | 2 | 44 | 18 | **76** |
| Laravel/Sanctum | 13 | 25 | 80 | **122** |
| Flask Edge | 5 | 0 | 0 | **5** |
| **Grand Total** | **20** | **69** | **98** | **203** |

| Auth Pattern | Count |
|:-------------|------:|
| No auth (public) | 20 |
| Optional auth | 15 |
| Any authenticated user | 54 |
| Admin only | 4 |
| Admin + Logistics | 52 |
| Admin + Responder + Logistics | 16 |
| Admin + Patient | 3 |
| Admin + Responder | 1 |
| Edge device (X-Edge-Key) | 1 |
| **WebSocket Channels** | **5** |

---

*Generated from static analysis of `firebase-cms` branch — March 12, 2026*
