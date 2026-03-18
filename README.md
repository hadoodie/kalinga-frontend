# Kalinga Emergency Response System

A comprehensive, real-time emergency response and healthcare management platform designed to bridge the gap between patients, responders, and hospital logistics. Kalinga ensures rapid incident response, seamless communication, and efficient resource allocation during crises.

![Kalinga Banner](public/kalinga-logo-white.PNG)

## 🌟 Project Overview

Kalinga is a full-stack web application built to handle the complexities of emergency management. It features a robust role-based system powered by real-time WebSockets and AI forecasting, catering to four core modules:

1. **Patient Module:** Public portal for emergency SOS reporting, health record management, and appointment requests.
2. **Responder Module:** Real-time emergency console for live map tracking, secure communications, and on-scene assessment.
3. **Logistics Module (TATAG):** End-to-end request lifecycle, AI demand/risk forecasting, auto-reorder monitoring, and centralized inventory matching.
4. **Admin Module:** Complete coordination panel, system-wide overwatch, status syncing, and user management.

---

## 🚀 Core Modules

### 🚑 Responder Module

- **Emergency Console:** A dedicated, distraction-free edge-to-edge UI optimized for active incidents.
- **Live Map Tracking:** Turn-by-turn routing and real-time incident visualization using Leaflet.
- **Real-time Comms:** iMessage-style secure chat with patients and hospital staff powered by Laravel Reverb for sub-second, real-time delivery.
- **AI Context & Hand-off:** Automated summarization of patient distress messages to provide immediate situational awareness.

### 🏥 Patient Module

- **Emergency SOS:** One-tap dispatch alerts that instantly notify nearby responders with precise geolocation.
- **Health Portal:** Secure storage for digital medical history, lab results (with Tesseract.js OCR integration), and prescriptions.
- **Scheduling:** Streamlined appointment system and supply request submission.

### 📦 Logistics Module (TATAG)

- **Unified Request Lifecycle:** A strict single-source-of-truth state machine ensuring all dispatch, transit, and delivery statuses are synchronized globally.
- **AI Demand Forecasting:** Python-powered ML pipeline (LightGBM) to forecast supply demands, predict risk thresholds, and automatically trigger reorders.
- **Inventory Matching:** Automated suggestions for connecting requested resources with the most optimal hospital buffer.
- **Coordination Panel:** High-level interfaces for resolving logistics bottlenecks, confirming deliveries, and archiving records.

### 🏢 Admin Module

- **System Overwatch:** Global dashboard offering a bird's-eye view of all concurrent incidents, active responders, and logistic flow.
- **Role Management:** Strict JWT-based RBAC overseeing staff authorizations and deployments.
- **Database Failover Insights:** Dashboards to monitor the local <-> cloud database replication status.

---

## 🛠️ Tech Stack

### Frontend

- **Framework:** React 19
- **Build Tool:** Vite 7
- **Styling:** TailwindCSS 4
- **State Management:** Zustand (Global Status) + React Context API + SWR
- **Maps & Utilities:** React Leaflet, Tesseract.js (OCR)
- **Real-time:** Laravel Echo + Pusher JS
- **UI Components:** Lucide React, Radix UI, Framer Motion

### Backend (Core API)

- **Framework:** Laravel 11 / PHP 8.2+
- **Database:** PostgreSQL 17 (Supabase Cloud + Local Failover)
- **WebSockets:** Laravel Reverb
- **Authentication:** Laravel Sanctum
- **Testing:** PHPUnit

### Backend (ML & Forecasting)

- **Framework:** FastAPI / Python 3.10+
- **Machine Learning:** Scikit-Learn, LightGBM, Pandas, Numpy
- **Server:** Uvicorn

---

## ⚡ Getting Started

### Prerequisites

- Node.js 18+
- PHP 8.2+ & Composer
- Python 3.10+
- PostgreSQL 17 (or compatible MariaDB equivalent via Docker)

### 1. Repository Setup

```bash
git clone https://github.com/jrdyfrdy/kalinga-frontend.git
cd kalinga
```

### 2. Frontend Installation & Run

```bash
# Install Node dependencies
npm install

# Start the Vite development server
npm run dev
```

_Frontend will be running at `http://localhost:5173`_

### 3. Backend API Setup & Run

```bash
cd backend

# Install PHP packages
composer install

# Environment configuration
cp .env.example .env
# Important: Update .env with database credentials (DB_*)

# Setup application keys and database
php artisan key:generate
php artisan migrate --seed

# Start Laravel development server
php artisan serve
```

_Backend API will be running at `http://localhost:8000`_

### 4. WebSocket Server (Laravel Reverb)

You need to run Reverb in a separate terminal process to enable real-time tracking, Unified Logistics syncing, and chat.

```bash
cd backend
php artisan reverb:start
```

### 5. AI Forecasting Setup & Run (Python Microservice)

The TATAG Logistics module relies on this microservice for automated reordering and demand prediction.

```bash
cd forecasting

# Create and activate a virtual environment
python -m venv venv
source venv/Scripts/activate      # Windows
# source venv/bin/activate        # Mac/Linux

# Install ML requirements
pip install -r requirements.txt

# Start the FastAPI server
uvicorn api:app --reload --port 8001
```

_Forecasting API will be running at `http://localhost:8001`_

_(Optional) Start the Laravel Schedule Worker for Automated Jobs:_

```bash
cd backend
php artisan schedule:work
```

---

## 🧪 Test Accounts

Use the password `password123` for all accounts below:

| Role                     | Email                              | Description                           |
| ------------------------ | ---------------------------------- | ------------------------------------- |
| **Admin User**           | `admin@kalinga.com`                | Full system access & Overwatch        |
| **Logistics Unverified** | `logistics_unverified@kalinga.com` | Access to TATAG Inventory & Forecasts |
| **Logistics Verified**   | `logistics_verified@kalinga.com`   | Access to TATAG Inventory & Forecasts |
| **Responder Unverified** | `responder_unverified@kalinga.com` | Access to Responder Workspace & Maps  |
| **Responder Verified**   | `responder_verified@kalinga.com`   | Access to Responder Workspace & Maps  |
| **Jane Doe**             | `jane.doe@kalinga.com`             | Access to Responder Workspace & Maps  |
| **John Smith**           | `john.smith@kalinga.com`           | Access to Responder Workspace & Maps  |
| **Maria Clara**          | `maria.clara@kalinga.com`          | Access to Responder Workspace & Maps  |
| **Patient Unverified**   | `patient_unverified@kalinga.com`   | Access to SOS, Chat & Health Records  |
| **Patient Verified**     | `patient_verified@kalinga.com`     | Access to SOS, Chat & Health Records  |

## 🤝 Contributing

We welcome contributions to Kalinga! Please follow standard Git Flow:

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

_Built with ❤️ by the Kalinga Development Team_
