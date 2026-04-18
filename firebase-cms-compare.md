# firebase-cms branch comparison

This document compares the current HEAD of the firebase-cms branch to its first push.

## Comparison range
- First push: 8b39df4 (Initial commit: Kalinga Cloud Development project with frontend and backend CMS)
- Current HEAD: b28242a (Commit all local changes before pushing to GitHub)

## Commit history since first push
- b28242a Commit all local changes before pushing to GitHub
- ade21a5 chore: ignore local env files and keep example placeholders
- 40c007c chore: workspace updates (auth note/misc)
- ef75553 merge: apply dashboard data preloader fix from copilot worktree
- f67c573 fix: add missing hospitalService.preload() and isolate dataPreloader failures
- ad8fd01 Refactor data preloading logic to improve error handling and add caching for hospital data

## File change summary (git diff --stat)
```
 .env                                               |    1 +
 .env.example                                       |    3 +
 .gitignore                                         |  Bin 863 -> 981 bytes
 backend/.env.example                               |    4 +-
 backend/.env.example.replication                   |    4 +-
 .../Controllers/Api/HealthSimulatorController.php  |  212 +++
 .../Http/Controllers/Api/SensorDataController.php  |  213 +++
 backend/package-lock.json                          |   19 +-
 backend/routes/api.php                             |  182 ++
 developer-todos.md                                 |  147 ++
 edge-scanner/.env.example                          |   11 +
 edge-scanner/requirements.txt                      |    6 +
 edge-scanner/scanner_service.py                    |  223 +++
 node-backend/.env.example                          |   26 +
 node-backend/_fix_ip.mjs                           |    4 +
 node-backend/database/MOCK_DATA_SUMMARY.md         |  252 +++
 .../migrations/001_add_qr_codes_activity_logs.sql  |   45 +
 .../002_add_current_patients_to_hospitals.sql      |   35 +
 node-backend/database/schema.sql                   |  307 ++++
 node-backend/database/seed.sql                     |  518 ++++++
 node-backend/database/seed_fix.sql                 |  216 +++
 node-backend/package-lock.json                     | 1833 ++++++++++++++++++++
 node-backend/package.json                          |   30 +
 node-backend/server.js                             |   79 +
 node-backend/src/config/db.js                      |   20 +
 node-backend/src/config/supabaseClient.js          |   39 +
 node-backend/src/controllers/accountController.js  |   28 +
 node-backend/src/controllers/activityController.js |   11 +
 node-backend/src/controllers/authController.js     |  104 ++
 .../src/controllers/dashboardController.js         |   26 +
 .../src/controllers/hospitalsController.js         |   33 +
 .../src/controllers/incidentsController.js         |   40 +
 node-backend/src/controllers/locationController.js |   25 +
 node-backend/src/controllers/logsController.js     |   49 +
 .../src/controllers/notificationsController.js     |   46 +
 node-backend/src/controllers/profileController.js  |   55 +
 node-backend/src/controllers/qrController.js       |  147 ++
 node-backend/src/controllers/reportsController.js  |   40 +
 .../src/controllers/resourcesController.js         |   47 +
 .../src/controllers/respondersController.js        |   56 +
 node-backend/src/controllers/searchController.js   |   15 +
 node-backend/src/controllers/settingsController.js |   18 +
 node-backend/src/controllers/systemController.js   |   11 +
 node-backend/src/controllers/trainingController.js |   74 +
 node-backend/src/controllers/triageController.js   |   60 +
 node-backend/src/middleware/activityLogger.js      |   34 +
 node-backend/src/middleware/auth.js                |  125 ++
 node-backend/src/middleware/errorHandler.js        |   53 +
 node-backend/src/middleware/roleCheck.js           |   46 +
 node-backend/src/routes/account.js                 |   19 +
 node-backend/src/routes/activity.js                |   12 +
 node-backend/src/routes/auth.js                    |   10 +
 node-backend/src/routes/dashboard.js               |   13 +
 node-backend/src/routes/hospitals.js               |   19 +
 node-backend/src/routes/incidents.js               |   23 +
 node-backend/src/routes/index.js                   |   46 +
 node-backend/src/routes/location.js                |   16 +
 node-backend/src/routes/logs.js                    |   15 +
 node-backend/src/routes/notifications.js           |   29 +
 node-backend/src/routes/profile.js                 |   40 +
 node-backend/src/routes/qr.js                      |   22 +
 node-backend/src/routes/reports.js                 |   23 +
 node-backend/src/routes/resources.js               |   26 +
 node-backend/src/routes/responders.js              |   29 +
 node-backend/src/routes/search.js                  |   10 +
 node-backend/src/routes/settings.js                |   15 +
 node-backend/src/routes/system.js                  |    9 +
 node-backend/src/routes/training.js                |   26 +
 node-backend/src/routes/triage.js                  |   32 +
 node-backend/src/routes/users.js                   |   10 +
 node-backend/src/services/accountService.js        |   41 +
 node-backend/src/services/activityService.js       |   82 +
 node-backend/src/services/dashboardService.js      |   83 +
 node-backend/src/services/hospitalsService.js      |  114 ++
 node-backend/src/services/incidentsService.js      |  126 ++
 node-backend/src/services/locationService.js       |   43 +
 node-backend/src/services/logsService.js           |   51 +
 node-backend/src/services/notificationsService.js  |   85 +
 node-backend/src/services/profileService.js        |   94 +
 node-backend/src/services/qrService.js             |  113 ++
 node-backend/src/services/reportsService.js        |  111 ++
 node-backend/src/services/resourcesService.js      |  124 ++
 node-backend/src/services/respondersService.js     |  142 ++
 node-backend/src/services/searchService.js         |   48 +
 node-backend/src/services/settingsService.js       |   48 +
 node-backend/src/services/systemService.js         |   17 +
 node-backend/src/services/trainingService.js       |   43 +
 node-backend/src/services/triageService.js         |  168 ++
 node-backend/src/utils/pagination.js               |   35 +
 node-backend/src/utils/response.js                 |   33 +
 src/components/responder/DateRow.jsx               |   48 +-
 src/components/responder/HealthRespondersCard.jsx  |   94 +-
 src/components/responder/HospitalPatientChart.jsx  |   72 +-
 src/components/responder/MapCard.jsx               |   58 +-
 src/components/responder/Reports.jsx               |  375 ++--
 src/components/responder/ResourcesCard.jsx         |  118 +-
 src/components/responder/TriageCard.jsx            |  162 +-
 src/components/responder/WeatherCard.jsx           |   32 +-
 src/context/AuthContext.jsx                        |    4 +
 src/context/TriageProvider.jsx                     |   96 +-
 src/lib/dataPreloader.js                           |   42 +-
 src/pages-responders/IncidentLogs.jsx              |  163 +-
 src/pages-responders/Profile.jsx                   |  478 ++---
 src/pages-responders/Settings.jsx                  |  122 +-
 src/pages-responders/TriageSystem.jsx              |  384 ++--
 src/services/hospitalService.js                    |   23 +
 src/services/nodeApi.js                            |   54 +
 src/services/sensorService.js                      |  145 ++
 start.cmd                                          |   26 +
 storage/.env                                       |    1 +
 storage/.env.example                               |    2 +
 111 files changed, 9010 insertions(+), 1106 deletions(-)
```
