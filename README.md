# Kalinga Emergency Response System

A comprehensive emergency response and healthcare management system with real-time logistics tracking, patient health records, and automatic database failover.

## 🏗️ Architecture

```
kalinga-hotfix-db/
├── frontend/          # React + Vite + TailwindCSS
└── backend/           # Laravel 11 + PostgreSQL (with failover)
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PHP 8.2+
- PostgreSQL 17.x
- Composer

### Frontend Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs on: `http://localhost:5173`

### Backend Setup

```bash
cd backend

# Install dependencies
composer install
npm install

# Configure environment
cp .env.example .env
php artisan key:generate

# Run migrations and seed data
php artisan migrate --seed

# Start server
php artisan serve
```

Backend runs on: `http://localhost:8000`

**For complete backend setup including database failover, see:** [backend/README.md](./backend/README.md)

## 🎯 Features

### 🏥 Healthcare Management

- Patient health records and medical history
- Appointment scheduling and management
- Lab results and test reports
- Medication and immunization tracking
- Allergy and diagnosis management

### 🚨 Emergency Response

- Real-time emergency reporting
- Evacuation center management
- Responder coordination
- Emergency communication system
- **Response Mode (new):** dedicated workspace that unlocks after a responder joins an incident, showing the patient conversation, live navigation, AI-generated patient context, and hospital handoff guidance. Response Mode remains active until the incident is resolved, then locks until the responder takes a new case, and it now stays synchronized via Laravel Echo so chat, timelines, and navigation update instantly without manual refreshes. When the environment lacks the new incident/conversation/hospital APIs, the UI now automatically falls back to cached incident data and surfaces inline notices so responders can keep operating without hard failures.

#### AI-Assisted Context Generator

- Streams every patient message prior to the responder marking "On Scene" and extracts symptoms, hazards, and environment clues using lightweight on-device heuristics.
- Flags escalation cues (e.g., "can't breathe", "fire spreading") and surfaces the last five patient statements for quick reference.
- Locks once the responder arrives so historical context is preserved even as new hospital navigation data loads.

##### Configuring the AI model

The responder context panel now calls a configurable AI API so summaries reflect the full transcript instead of keyword matches. Provide credentials in your Vite env file:

```
VITE_AI_CONTEXT_API_URL=https://api.openai.com/v1/chat/completions   # or any compatible endpoint
VITE_AI_CONTEXT_API_KEY=sk-...
VITE_AI_CONTEXT_MODEL=gpt-4o-mini                                  # optional, defaults to gpt-4o-mini
VITE_AI_CONTEXT_WINDOW=24                                           # optional max message window
```

If the API is unreachable or unset, the UI automatically falls back to the on-device heuristic classifier so responders still see context.

#### Response Navigation

- Route view tracks the responder's live location versus the incident site, highlighting reported blockades.
- When the incident status transitions to `on_scene` (or hospital transfer states), the map automatically pivots to the nearest capable hospital that matches the resource request coming from the AI context generator.
- The responder can exit Response Mode anytime to return to the dashboard; re-opening an active incident resumes the same session state.

### 📦 Logistics & Resources

- Hospital and resource management
- Inventory tracking with alerts
- Supply request management
- Vehicle tracking

### 🔐 Authentication & Security

- JWT token-based authentication
- Role-based access control (RBAC)
- 4 user roles: Admin, Logistics, Responder, Patient
- Secure API endpoints

### 💾 Database Failover System

- Automatic failover between cloud (Supabase) and local PostgreSQL
- Bidirectional data synchronization
- Zero downtime during outages
- Complete data consistency

## 🔑 Test Credentials

All test accounts use password: `password123`

| Role      | Email                        | Access Level                    |
| --------- | ---------------------------- | ------------------------------- |
| Admin     | admin@kalinga.com            | Full system access              |
| Logistics | logistics@kalinga.com        | Resources & supply management   |
| Responder | responder@kalinga.com        | Emergency response features     |
| Patient   | patient@kalinga.com          | Health records & appointments   |
| Patient   | patient_verified@kalinga.com | Verified patient with full data |

## 🛠️ Tech Stack

### Frontend

- **Framework**: React 19
- **Build Tool**: Vite
- **Styling**: TailwindCSS 4
- **UI Components**: Radix UI, Framer Motion
- **Data Visualization**: Recharts
- **Maps**: React Leaflet
- **HTTP Client**: Axios
- **Routing**: React Router v7

### Backend

- **Framework**: Laravel 11
- **Database**: PostgreSQL (Cloud: Supabase, Local: Failover)
- **Authentication**: Laravel Sanctum (JWT)
- **API**: RESTful
- **Scheduler**: Laravel Task Scheduler

## 📖 API Documentation

### Authentication Endpoints

```
POST   /api/register          # Create new user account
POST   /api/login             # User login (returns token)
POST   /api/logout            # Logout current user
GET    /api/me                # Get authenticated user info
PUT    /api/profile           # Update user profile
POST   /api/verify-id         # Submit ID verification
```

### Health Records (Patient/Admin)

```
GET    /api/appointments      # List user appointments
GET    /api/lab-results       # List lab results
GET    /api/notifications     # Get user notifications
```

### Logistics (Admin/Logistics)

```
GET    /api/resources         # List all resources
POST   /api/resources         # Create new resource
PUT    /api/resources/{id}    # Update resource
DELETE /api/resources/{id}    # Delete resource
GET    /api/hospitals         # List all hospitals
POST   /api/hospitals         # Create new hospital
```

### Database Management

```
php artisan db:status                  # Check database connection status
php artisan db:sync-cloud-to-local     # Sync cloud → local
php artisan db:sync-local-to-cloud     # Sync local → cloud
```

For complete API documentation, see [backend/README.md](./backend/README.md)

## 🚀 Development

### Running in Development

**Terminal 1 - Frontend:**

```bash
npm run dev
```

**Terminal 2 - Backend:**

```bash
cd backend
php artisan serve
```

**Terminal 3 - Scheduler (for database sync):**

```bash
cd backend
php artisan schedule:work
```

### Building for Production

**Frontend:**

```bash
npm run build
npm run preview  # Test production build
```

**Backend:**

```bash
cd backend
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

## 🧪 Testing

### Frontend

```bash
npm run test
```

### Backend

```bash
cd backend
php artisan test
```

## � Configuration

### Environment Variables

**Frontend** (`.env`):

```env
VITE_API_URL=http://localhost:8000
```

**Backend** (`backend/.env`):

```env
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173

# Cloud Database (Primary)
DB_CONNECTION=pgsql_cloud
CLOUD_DB_HOST=aws-1-ap-southeast-1.pooler.supabase.com
CLOUD_DB_DATABASE=postgres
CLOUD_DB_USERNAME=your_username
CLOUD_DB_PASSWORD=your_password

# Local Database (Failover)
LOCAL_DB_HOST=127.0.0.1
LOCAL_DB_DATABASE=db_kalinga
LOCAL_DB_USERNAME=postgres
LOCAL_DB_PASSWORD=your_local_password
```

## 🐛 Troubleshooting

### Frontend Issues

**Error: "Cannot connect to API"**

- Ensure backend is running on port 8000
- Check `VITE_API_URL` in `.env`
- Verify CORS settings in backend

**Blank page after login**

- Clear browser localStorage: `localStorage.clear()`
- Check browser console for errors
- Verify user token is stored

### Backend Issues

**Database connection failed**

- Ensure PostgreSQL is running
- Verify credentials in `.env`
- Run `php artisan db:status` to check connections

**Scheduler not running**

- Start scheduler: `php artisan schedule:work`
- Verify schedule with: `php artisan schedule:list`

For detailed troubleshooting, see [backend/README.md](./backend/README.md)

## 📁 Project Structure

```
kalinga-hotfix-db/
├── backend/
│   ├── app/
│   │   ├── Console/Commands/          # Database sync commands
│   │   ├── Http/
│   │   │   ├── Controllers/Api/       # API controllers
│   │   │   └── Middleware/            # Auth & failover middleware
│   │   ├── Models/                    # Eloquent models
│   │   └── Services/                  # Business logic
│   ├── database/
│   │   ├── migrations/                # Database schema
│   │   └── seeders/                   # Sample data
│   ├── routes/
│   │   ├── api.php                    # API routes
│   │   └── console.php                # Scheduler config
│   └── README.md                      # Backend documentation
├── src/
│   ├── components/                    # React components
│   ├── pages-account/                 # Registration/login pages
│   ├── pages-admin/                   # Admin dashboard
│   ├── pages-patients/                # Patient portal
│   ├── pages-logistics/               # Logistics management
│   ├── pages-responders/              # Responder interface
│   ├── services/                      # API service layer
│   └── context/                       # React context providers
├── public/                            # Static assets
└── package.json                       # Dependencies
```

## 🤝 Contributing

When cloning this repository:

1. **Frontend**: Run `npm install` and `npm run dev`
2. **Backend**:
   - Install dependencies: `composer install`
   - Set up local database (see [backend/README.md](./backend/README.md))
   - Run migrations: `php artisan migrate`
   - Start scheduler: `php artisan schedule:work`

## 📝 License

This project is licensed under the MIT License.

## 👥 Team

Built by the Kalinga Development Team

---

<p align="center">
  <strong>Emergency Response • Healthcare Management • Logistics Tracking</strong>
</p>

### October 13, 2025 - Registration Flow Fix

- ✅ **Connected Registration to Backend API**

  - Registration now creates real user accounts in database
  - Generates authentication tokens automatically
  - Validates all user input with backend rules

- ✅ **Automatic Login After Registration**

  - Users are automatically logged in upon successful registration
  - Seamlessly proceed to ID verification without re-entering credentials
  - Natural flow: Register → Verify ID → Upload ID → Complete Profile

- ✅ **Enhanced Registration Form**

  - Added phone number field (optional)
  - All form inputs bound to React state
  - Real-time validation with clear error messages
  - Backend validation errors displayed to user

- ✅ **Improved User Experience**
  - No interruption after registration
  - No need to login again with new credentials
  - Faster onboarding process
  - Default role: "patient" for self-registered users

### October 13, 2025 - Authentication Integration Completeand Laravel (Backend).

## 🚀 Project Status

✅ **Backend Setup Complete**

- Laravel 11 with PostgreSQL
- Authentication & Role-Based Access Control (RBAC)
- Resource & Hospital Management APIs
- Test users with different roles

✅ **Frontend Setup Complete**

- React 18 with Vite
- TailwindCSS for styling
- Service layer for API integration
- Component library ready
  \/.[=
  ⏳ **In Progress**

- Frontend-Backend integration
- Role-based UI components
- Real-time features

## 📚 Documentation

- **[Backend Connection Guide](BACKEND_CONNECTION_GUIDE.md)** - API endpoints and usage
- **[Backend Test Results](BACKEND_TEST_RESULTS.md)** - Database and API tests
- **[Auth RBAC Guide](AUTH_RBAC_TEST_GUIDE.md)** - Authentication testing
- **[Auth Integration](AUTH_INTEGRATION_COMPLETE.md)** - Complete auth documentation

## 🏗️ Tech Stack

### Frontend

- React 18
- Vite
- TailwindCSS
- Axios for API calls
- React Router for navigation

### Backend

- Laravel 11
- PostgreSQL
- Laravel Sanctum (Authentication)
- RESTful API

## 🎯 Features

### Authentication & Authorization

- ✅ JWT token-based authentication
- ✅ Role-based access control
- ✅ 4 user roles: Admin, Logistics, Responder, Patient

### Logistics Management

- ✅ Resource inventory tracking
- ✅ Hospital management
- ✅ Low stock alerts
- ✅ Critical items monitoring

### Emergency Response

- ⏳ Emergency reporting
- ⏳ Evacuation center management
- ⏳ Weather monitoring
- ⏳ Chat support

## 🚀 Quick Start

### Prerequisites

- Node.js 16+
- PHP 8.1+
- PostgreSQL 12+
- Composer

### Backend Setup

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve
```

Backend runs on: `http://127.0.0.1:8000`

### Frontend Setup

```bash
npm install
npm run dev
```

Frontend runs on: `http://localhost:5173`

## 🔑 Test Credentials

All passwords: `password123`

| Role      | Email                 | Access Level          |
| --------- | --------------------- | --------------------- |
| Admin     | admin@kalinga.com     | Full access           |
| Logistics | logistics@kalinga.com | Resources & Hospitals |
| Responder | responder@kalinga.com | Emergency features    |
| Patient   | patient@kalinga.com   | Basic features        |

## 📖 API Documentation

See [BACKEND_CONNECTION_GUIDE.md](BACKEND_CONNECTION_GUIDE.md) for complete API documentation.

### Key Endpoints

**Authentication**

- `POST /api/login` - User login
- `POST /api/register` - User registration
- `GET /api/me` - Get current user
- `POST /api/logout` - Logout

**Resources (Admin/Logistics)**

- `GET /api/resources` - List all resources
- `POST /api/resources` - Create resource
- `PUT /api/resources/{id}` - Update resource
- `DELETE /api/resources/{id}` - Delete resource

**Hospitals (Admin/Logistics)**

- `GET /api/hospitals` - List all hospitals
- `POST /api/hospitals` - Create hospital
- `PUT /api/hospitals/{id}` - Update hospital
- `DELETE /api/hospitals/{id}` - Delete hospital

## 🧪 Testing

Backend authentication and RBAC fully tested. See [AUTH_INTEGRATION_COMPLETE.md](AUTH_INTEGRATION_COMPLETE.md) for test results.

## � Recent Updates

### October 13, 2025 - Authentication Integration Complete

- ✅ **Fixed CSRF Token Mismatch (Error 419)**

  - Removed `statefulApi()` middleware from backend
  - Configured API for stateless token-based authentication
  - Updated CORS settings for proper token auth support

- ✅ **Frontend Authentication Integration**

  - Created AuthContext for global state management
  - Implemented ProtectedRoute component with role-based access
  - Updated login component with real API integration
  - Added logout functionality to all sidebars
  - Optimized page loading with localStorage caching

- ✅ **Performance Improvements**

  - Instant page loads using cached user data
  - Background refresh for up-to-date information
  - Reduced initial load time from 2-3s to <100ms

- ✅ **Backend Setup**
  - Laravel 11 with PostgreSQL database
  - Laravel Sanctum for JWT authentication
  - Custom CheckRole middleware for RBAC
  - 5 test users with different roles seeded
  - Resources and hospitals tables with sample data

### Configuration Notes

- API uses **token-based authentication** (stateless)
- No CSRF tokens required for API routes
- Tokens stored in localStorage with key: `token`
- User data cached for performance

## 📝 License

MIT

## 🔧 Troubleshooting

### Error 419 on Login

If you see a 419 error when logging in:

1. Clear browser localStorage: `localStorage.clear()`
2. Ensure backend has `statefulApi()` removed from `bootstrap/app.php`
3. Verify CORS config has `supports_credentials: false`
4. Restart both servers

### Slow Page Loading

1. Check if user data is cached in localStorage
2. Clear cache and reload to rebuild cache
3. Verify backend is running on port 8000

### Cannot Access Protected Routes

1. Verify you're logged in (check localStorage for `token`)
2. Check user role matches route requirements
3. Look for 403 errors in console (wrong role)
4. Try logging out and back in
