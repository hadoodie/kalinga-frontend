# Kalinga Cloud Development — Mock Data Summary
**Seeded:** March 9, 2026 | **Database:** Supabase PostgreSQL (psblyvwfbgmwyrtzoyhz)

---

## Seed Files
| File | Purpose |
|---|---|
| `node-backend/database/seed.sql` | Primary seed: users, incidents, notifications, new tables |
| `node-backend/database/seed_fix.sql` | Fix seed: hospitals (sequence reset), hospital_reports, triage_cases |

---

## Table-by-Table Summary

### 1. `hospitals` — 9 total (3 existing + 6 new)
**Used by:** `TriageCard.jsx`, `HospitalPatientChart.jsx`, `IncidentLogs.jsx`, `MapCard.jsx`

| ID | Name | Code | Occupancy | Level |
|---|---|---|---|---|
| 1 | Central General Hospital *(existing)* | HOSP-NCR-001 | 0 | — |
| 2 | Emergency Field Hospital *(existing)* | FIELD-NCR-001 | 0 | — |
| 3 | St. Luke's Medical Center - Global City *(existing)* | PRIVATE-NCR-001 | 0 | — |
| 4 | Philippine General Hospital | PGH-001 | 1410/1500 (94%) | DOH Hospital |
| 5 | East Avenue Medical Center | EAMC-001 | 736/800 (92%) | DOH Hospital |
| 6 | Rizal Medical Center | RMC-001 | 468/600 (78%) | DOH Hospital |
| 7 | Jose R. Reyes Memorial Medical Center | JRRMMC-001 | 686/700 (98%) | DOH Hospital |
| 8 | National Children's Hospital | NCH-001 | 352/400 (88%) | DOH Hospital |
| 9 | Ospital ng Maynila Medical Center | OMMC-001 | 410/500 (82%) | DOH Hospital |

---

### 2. `responders` — 11 total (6 existing + 5 new)
**Used by:** `HealthRespondersCard.jsx` (stats: on_duty/standby counts)

| Code | Name | Status |
|---|---|---|
| RSP-001 | Juan Dela Cruz | **On Duty** |
| RSP-002 | Maria Santos | Available |
| RSP-003 | Pedro Reyes | **On Duty** |
| RSP-004 | Ana Lim | **On Duty** |
| RSP-005 | Jose Tan | Available |
| RSP-006 | Luz Cruz | On Leave |
| RSP-007 | Carla Diaz *(new)* | **On Duty** |
| RSP-008 | Roel Macaraeg *(new)* | Available |
| RSP-009 | Dante Villanueva *(new)* | **On Duty** |
| RSP-010 | Sofia Mendoza *(new)* | **On Duty** |
| RSP-011 | Bernard Ocampo *(new)* | Available |

**API result for `GET /api/responders/stats`:**
```json
{ "total": 11, "on_duty": 6, "standby": 4, "off_duty": 1 }
```

---

### 3. `incidents` — 15 total (5 existing + 10 new)
**Used by:** `IncidentLogs.jsx` (`GET /api/incidents`)

| # | Type | Location | Status |
|---|---|---|---|
| 1 | Residential Fire *(existing)* | Barangay 17, Quezon City | resolved |
| 2 | Flash Flood Evacuation *(existing)* | Riverside, Marikina | hospital_transfer |
| 3 | Highway Collision *(existing)* | East Service Road, Parañaque | resolved |
| 4 | Emergency SOS *(existing)* | Manila HQ | cancelled |
| 5 | Emergency SOS *(existing)* | Lat/lng coords | on_scene |
| 6 | Cardiac Arrest *(new)* | Barangay 188, Caloocan City | on_scene |
| 7 | Vehicular Accident *(new)* | EDSA-Quezon Ave Intersection | en_route |
| 8 | Drowning *(new)* | Manila Bay Baywalk | acknowledged |
| 9 | Stroke Emergency *(new)* | Sampaloc, Manila | transporting |
| 10 | Fire Rescue *(new)* | Tondo, Manila | reported |
| 11 | Mass Food Poisoning *(new)* | Marikina Public Market | on_scene |
| 12 | Industrial Accident *(new)* | PEZA Zone, Calamba | en_route |
| 13 | Pediatric Emergency *(new)* | Barangay Holy Spirit, QC | transporting |
| 14 | Obstetric Emergency *(new)* | Pasay City | hospital_transfer |
| 15 | Diabetic Emergency *(new)* | BGC, Taguig City | resolved |

---

### 4. `notifications` — 24 total (14 new)
**Used by:** Topbar Notifications (`GET /api/notifications`, `GET /api/notifications/unread`)

| Recipient | Title | Read? |
|---|---|---|
| Admin | New Incident Reported | Unread |
| Admin | Hospital Capacity Alert | Unread |
| Admin | Responder Status Update | Read |
| Admin | Critical Resource Low | Unread |
| Admin | Incident Resolved | Read |
| Responder Verified | Incident Assigned to You | Unread |
| Responder Verified | Nearby Emergency Alert | Unread |
| Responder Verified | Training Module Completed | Read |
| Jane Doe | Dispatch Notification | Unread |
| Jane Doe | System Maintenance Notice | Read |
| John Smith | Incident Update: Stroke Case | Read |
| John Smith | New Incident: Industrial Spill | Unread |
| Maria Clara | Patient Transferred | Read |
| Maria Clara | Triage Update | Unread |

**Unread count for Admin: 3 | for responders: 2 each**

---

### 5. `hospital_reports` — 10 rows (all new)
**Used by:** `Reports.jsx` (`GET /api/reports`)

| Title | Hospital | Type | Severity |
|---|---|---|---|
| Capacity Alert: ED Near Full | Philippine General Hospital | capacity | **high** |
| ICU Critical Occupancy | East Avenue Medical Center | capacity | **critical** |
| Limited Oxygen Supply | Rizal Medical Center | supply | **high** |
| NICU Capacity Near Full | National Children's Hospital | capacity | medium |
| ED Overcrowding | Ospital ng Maynila | capacity | **high** |
| Cardiology Team Unavailable | Philippine General Hospital | specialist | **critical** |
| Neurology Team on Rotation Leave | Jose R. Reyes Memorial | specialist | **high** |
| Pediatricians Limited Availability | Ospital ng Maynila | specialist | medium |
| Blood Bank Low: O-Negative | East Avenue Medical Center | supply | **critical** |
| Generator Maintenance Alert | Rizal Medical Center | general | low |

---

### 6. `patients` — 18 rows (all new)
**Used by:** `HospitalPatientChart.jsx` (`GET /api/hospitals/patient-distribution`)

| Status | Count | Display Name |
|---|---|---|
| admitted | 14 | Admitted Patients |
| discharged | 2 | Discharged Patients |
| referred | 1 | Referred Patients |
| critical | 1 | Critical Cases |

**Distribution across hospitals:**
- PGH: 5 patients | EAMC: 4 | RMC: 2 | JRRMMC: 2 | NCH: 2 | OMMC: 3

---

### 7. `triage_cases` — 16 rows (all new)
**Used by:** `TriageCard.jsx` (`GET /api/triage/stats` + `GET /api/hospitals`)

| Triage Level | Count |
|---|---|
| critical | 4 (Baby Gonzales, Lourdes Garcia, Elena Villanueva, Ricardo Santos) |
| high | 6 |
| medium | 6 |

*Each case has randomised vitals (BP, HR, Temp, SpO2, RR) stored as JSONB.*

---

### 8. `regions` — 10 rows (all new)
**Used by:** `DateRow.jsx` / `GET /api/location/areas`

Metro Manila: Manila, Quezon City, Caloocan, Marikina, Pasig City, Taguig City, Parañaque, Las Piñas, Muntinlupa, Mandaluyong

---

### 9. `responder_activity` — 10 rows (all new)
**Used by:** QR Module / Activity Overview (`GET /api/activity`)

| Action | Responder | Points |
|---|---|---|
| Incident Dispatched | Responder Verified | 10 |
| BLS Administered | Responder Verified | 25 |
| Patient Transported | Responder Verified | 15 |
| Incident Dispatched | Jane Doe | 10 |
| Triage Performed | Jane Doe | 20 |
| Incident Closed | John Smith | 15 |
| Training Completed | John Smith | 30 |
| Incident Dispatched | Maria Clara | 10 |
| Scene Assessment | Maria Clara | 15 |
| Training Completed | Responder Verified | 30 |

---

### 10. `training_courses` — 5 rows (all new)
**Used by:** Training Progress / Online Training (`GET /api/training/progress`)

| Course | Category | Lessons | Duration |
|---|---|---|---|
| Basic Life Support (BLS) | Emergency Response | 6 | 180 min |
| Advanced Cardiac Life Support (ACLS) | Emergency Response | 8 | 300 min |
| Triage Systems & Mass Casualty Management | Disaster Response | 5 | 240 min |
| Pediatric Advanced Life Support (PALS) | Pediatrics | 7 | 270 min |
| Hazmat First Response | Specialized | 5 | 210 min |

---

### 11. `training_records` — 11 rows (all new)
**Used by:** Training Progress (`GET /api/training/progress`)

| Responder | Course | Status | Score |
|---|---|---|---|
| Responder Verified | BLS | completed | 94.5% |
| Responder Verified | Triage Systems | completed | 88.0% |
| Responder Verified | ACLS | in_progress | 60% done |
| Jane Doe | BLS | completed | 91.0% |
| Jane Doe | ACLS | completed | 85.5% |
| Jane Doe | PALS | in_progress | 35% done |
| John Smith | BLS | completed | 97.0% |
| John Smith | ACLS | completed | 92.0% |
| John Smith | Hazmat | not_started | — |
| Maria Clara | BLS | completed | 89.5% |
| Maria Clara | PALS | in_progress | 70% done |

---

### 12. `certifications` — 7 rows (all new)
**Used by:** Certifications page (`GET /api/training/certifications`)

7 certificates issued to 4 responders for completed courses. All expire in 2 years.

---

### 13. `user_settings` — 18 rows (all new)
**Used by:** Settings page (`GET /api/settings`)

Default settings for all admin/responder/dispatcher users:
- Theme: Light | Language: English (en) | Timezone: Asia/Manila
- Notifications: Enabled | Email: Enabled | 2FA: Disabled

---

### 14. `accounts` — 38 rows (all new)
**Used by:** Account Status (`GET /api/account/status`)

Mirrors the `verification_status` from the `users` table:
- `verified` → `verified` with `verified_at` timestamp
- `pending` / `rejected` → `pending`

---

## Page → Data Mapping

| Page / Component | Table(s) Queried | Endpoint |
|---|---|---|
| `HealthRespondersCard.jsx` | `responders` | `GET /api/responders/stats` |
| `ResourcesCard.jsx` | `resources` | `GET /api/resources/summary` |
| `TriageCard.jsx` | `hospitals` + `triage_cases` | `GET /api/hospitals` + `GET /api/triage/stats` |
| `HospitalPatientChart.jsx` | `patients` | `GET /api/hospitals/patient-distribution` |
| `Reports.jsx` | `hospital_reports` | `GET /api/reports` |
| `IncidentLogs.jsx` | `incidents` + `hospitals` | `GET /api/incidents` |
| Topbar Notifications | `notifications` | `GET /api/notifications/unread` |
| Global Search | `hospitals`, `incidents`, `responders`, `hospital_reports` | `GET /api/search?q=` |
| `DateRow.jsx` (Location) | `locations` + `regions` | `GET /api/location/current` |
| `Profile.jsx` | `users` | `GET /api/profile` |
| `Settings.jsx` | `user_settings` | `GET /api/settings` |
| `IncidentLogs.jsx` (filter) | `hospitals` | `GET /api/hospitals` |
| QR Module / Activity | `responder_activity` | `GET /api/activity` |
| Online Training | `training_courses` + `training_records` | `GET /api/training/progress` |
| Certifications | `certifications` + `training_courses` | `GET /api/training/certifications` |
| Account Status | `accounts` | `GET /api/account/status` |
| Footer / System | N/A (uptime) | `GET /api/system/status` |
