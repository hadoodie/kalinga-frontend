# Kalinga Emergency Response System

A comprehensive emergency response and logistics management system built with React (Frontend) and Laravel (Backend).

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

| Role | Email | Access Level |
|------|-------|--------------|
| Admin | admin@kalinga.com | Full access |
| Logistics | logistics@kalinga.com | Resources & Hospitals |
| Responder | responder@kalinga.com | Emergency features |
| Patient | patient@kalinga.com | Basic features |

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
