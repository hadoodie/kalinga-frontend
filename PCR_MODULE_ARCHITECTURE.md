# Patient Care Report (PCR) Module

## Design

- UI pattern: single-page rapid-entry form with section switcher (accordion-like left rail) to avoid long vertical scrolling.
- Input strategy:
  - Big tap targets for NOI/MOI and consciousness state selection.
  - Grid-based Vitals + GCS capture with add/remove row actions.
  - Fixed action bar for Save Draft and Finalize PCR.
- Hardware visibility:
  - Vitals panel shows edge ingestion state (`waiting`, `connected`, `ingesting`).
  - Last edge source + sensor metadata stored in `edgeMeta`.

## Implemented File Structure

- Frontend
  - `src/pages-responders/PatientCareReport.jsx`
  - `src/services/pcrService.js`
  - `src/components/responder/Sidebar.jsx` (new tab)
  - `src/routes/ResponderRoutes.jsx` (route registration)
  - `src/config/routes.js` (path constant)
- Laravel
  - `backend/database/migrations/2026_04_16_000000_create_patient_care_reports_table.php`
  - `backend/app/Models/PatientCareReport.php`
  - `backend/app/Http/Controllers/Api/PatientCareReportController.php`
  - `backend/routes/api.php` (resource route under Sanctum + role middleware)
- Node + Edge integration
  - `node-backend/src/routes/edge.js`
  - `node-backend/src/controllers/edgeController.js`
  - `node-backend/src/realtime/io.js`
  - `node-backend/server.js` (Socket.IO bootstrap + PCR room subscriptions)
  - `edge-scanner/pcr_post_example.py` (secure POST snippet)

## API Contract Summary

### Laravel

- `POST /api/patient-care-reports`
  - Accepts `is_draft` boolean.
  - Draft mode: permissive validation for incomplete field capture.
  - Final mode: enforces key fields (`case_no`, `mobile_unit`, `patient_details.name`, `physiological_status.chiefComplaint`, `management_transport.transportedTo`).

### Node middleware

- `POST /api/edge/pcr-ingest`
  - Header: `X-Edge-Key`
  - Body: `{ case_no, patient_uuid, reading }`
  - Broadcasts `pcr:edge-vitals` via Socket.IO globally and to room channels:
    - `pcr:case:{case_no}`
    - `pcr:patient:{patient_uuid}`

## Audit Checklist

### 1. Data Validation

- Laravel rules split by `is_draft` status.
- GCS bounds enforced (`eyes 1-4`, `verbal 1-5`, `motor 1-6`, `total 3-15`).
- Vitals arrays accepted as JSON for schema flexibility and future sensor expansion.

### 2. Performance

- React Hook Form + `useFieldArray` reduce expensive controlled-input re-renders.
- Section-only rendering (`activeSection`) limits mounted input surface during high-speed entry.
- Draft autosave is debounced before writing to localStorage.

### 3. Security & Sync

- Sanctum token automatically attached via existing `api.js` interceptor.
- Edge ingest endpoint enforces shared `X-Edge-Key`.
- Offline-first strategy:
  - If POST fails due to connectivity, payload queued in localStorage.
  - Queue auto-flush runs on startup and browser `online` event.
