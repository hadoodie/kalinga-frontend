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

## 📝 License

MIT+ Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
