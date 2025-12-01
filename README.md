# Kalinga Emergency Response System

A comprehensive, real-time emergency response and healthcare management platform designed to bridge the gap between patients, responders, and hospital logistics. Kalinga ensures rapid incident response, seamless communication, and efficient resource allocation during crises.

![Kalinga Banner](public/kalinga-logo-white.PNG)

## 🌟 Project Overview

Kalinga is a full-stack web application built to handle the complexities of emergency management. It features a robust role-based system catering to four distinct user types:
- **Patients:** For emergency SOS reporting, health record management, and appointment scheduling.
- **Responders:** For real-time incident navigation, secure communication, and on-scene assessment.
- **Logistics:** For hospital resource tracking, inventory management, and supply chain coordination.
- **Admins:** For overall system oversight, user management, and analytics.

## 🚀 Key Features

### 🚑 Responder Workspace (New & Enhanced)
- **Unified Layout:** A consistent, responsive interface across all responder tools with sticky navigation and optimized screen real estate.
- **Response Mode:** A dedicated, distraction-free interface for active incidents, featuring:
  - **Live Navigation:** Turn-by-turn routing to patients and hospitals using Leaflet.
  - **Real-time Chat:** iMessage-style secure messaging with patients and hospital staff, powered by Laravel Reverb for instant delivery.
  - **AI Context:** Automated summarization of patient distress messages to provide responders with immediate situational awareness.
  - **Incident Timeline:** A chronological log of all actions, from dispatch to resolution.
- **Interactive Maps:**
  - **Response Map:** Visualize active incidents, road blockades, and optimal routes.
  - **Hospital Map:** Locate nearby medical facilities and check their real-time status.

### 🏥 Healthcare & Patient Portal
- **Digital Health Records:** Secure storage for medical history, lab results, and prescriptions.
- **Emergency SOS:** One-tap emergency alerts that instantly notify nearby responders with precise geolocation.
- **Appointment System:** Easy scheduling with healthcare providers.

### 📦 Logistics & Resource Management
- **Inventory Tracking:** Real-time monitoring of hospital supplies, blood banks, and equipment.
- **Resource Allocation:** Automated suggestions for resource distribution based on hospital capacity and emergency severity.
- **Failover Database:** Robust architecture ensuring data availability even during cloud connectivity issues (Local <-> Cloud Sync).

### 🔐 Security & Architecture
- **Authentication:** Secure JWT-based auth via Laravel Sanctum.
- **RBAC:** Strict Role-Based Access Control ensuring users only access data relevant to their role.
- **Real-time Infrastructure:** Built on Laravel Reverb (WebSocket server) for sub-second data updates across clients.

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19
- **Build Tool:** Vite 7
- **Styling:** TailwindCSS 4
- **State Management:** React Context API + SWR
- **Maps:** React Leaflet + OpenStreetMap
- **Real-time:** Laravel Echo + Pusher JS
- **UI Components:** Lucide React, Radix UI, Framer Motion

### Backend
- **Framework:** Laravel 11
- **Language:** PHP 8.2+
- **Database:** PostgreSQL 17 (Supabase Cloud + Local Failover)
- **WebSockets:** Laravel Reverb
- **Authentication:** Laravel Sanctum
- **Testing:** PHPUnit

## ⚡ Getting Started

### Prerequisites
- Node.js 18+
- PHP 8.2+
- PostgreSQL 17
- Composer

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/jrdyfrdy/kalinga-frontend.git
   cd kalinga
   ```

2. **Frontend Setup**
   ```bash
   # Install dependencies
   npm install

   # Start the development server
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173`.

3. **Backend Setup**
   ```bash
   cd backend

   # Install PHP dependencies
   composer install

   # Setup Environment
   cp .env.example .env
   # Update .env with your database credentials

   # Generate App Key
   php artisan key:generate

   # Run Migrations & Seeders
   php artisan migrate --seed

   # Start the Backend Server
   php artisan serve
   ```
   The backend API will be available at `http://localhost:8000`.

4. **Real-time Server (WebSockets)**
   ```bash
   cd backend
   php artisan reverb:start
   ```

5. **Database Sync Scheduler (Optional)**
   ```bash
   cd backend
   php artisan schedule:work
   ```

## 🧪 Test Accounts

Use the password `password123` for all accounts below:

| Role | Email | Description |
|------|-------|-------------|
| **Admin** | `admin@kalinga.com` | Full system access |
| **Responder** | `responder@kalinga.com` | Access to Responder Workspace & Maps |
| **Logistics** | `logistics@kalinga.com` | Access to Inventory & Hospital Management |
| **Patient** | `patient@kalinga.com` | Access to SOS & Health Records |

## 📅 Recent Updates (December 2025)

### Responder Experience Overhaul
- **Layout Standardization:** Refactored `ResponseMap`, `HospitalMap`, and `ResponseMode` to use a shared `Layout` component, fixing overflow issues and ensuring a consistent sticky sidebar experience.
- **Chat UI Polish:** Enhanced the secure messaging interface with better spacing, bubble alignment, and visual hierarchy (iMessage style).
- **Map Integration:** Improved the integration of Leaflet maps within the application shell, ensuring controls are accessible and responsive on mobile devices.

### System Stability
- **Database Failover:** Enhanced the synchronization logic between local and cloud databases to prevent data loss during intermittent connectivity.
- **Real-time Reliability:** Tuned Laravel Reverb configurations for more stable WebSocket connections during high-traffic emergency events.

## 🤝 Contributing

We welcome contributions! Please follow these steps:
1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
*Built with ❤️ by the Kalinga Development Team*
