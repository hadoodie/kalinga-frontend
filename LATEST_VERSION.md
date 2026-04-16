# Latest Version Documentation (firebase-cms)

This document describes the latest state of the Kalinga Emergency Response System in the firebase-cms branch.

## Overview
Kalinga is a full-stack emergency response and healthcare management platform with role-based experiences for patients, responders, logistics, and administrators. The system combines a React frontend, a Laravel API with automatic database failover, a Node.js API for additional services, and an edge scanner service.

## Architecture
- Frontend: React 19 + Vite 7, TailwindCSS 4
- Core API: Laravel 11 (PHP 8.2+) with PostgreSQL 17
- Realtime: Laravel Reverb (WebSockets)
- Node API: Express 4 with Supabase/PostgreSQL client
- Edge scanner: Python service

## Key capabilities
- Responder workspace with maps, navigation, incident timeline, and chat
- Patient portal for SOS reporting, appointments, and health records
- Logistics workflows for hospital resources and inventory
- Database failover with automatic cloud-to-local and local-to-cloud sync

## Services and ports (dev defaults)
- Frontend: http://localhost:5173
- Laravel API: http://localhost:8000
- Node API: http://localhost:5000
- Reverb (WebSockets): http://localhost:6001

## Frontend
### Scripts
- npm run dev
- npm run build
- npm run preview
- npm run lint

### Notable libraries
- UI and state: React, SWR, Zustand, Radix UI, Framer Motion
- Maps: React Leaflet + OpenStreetMap
- Realtime: Laravel Echo + Pusher JS

## Laravel backend
### Features
- Automatic database failover with scheduled sync
- Role-based access control
- Realtime events via Reverb

### Common commands
- php artisan serve
- php artisan migrate
- php artisan db:seed
- php artisan reverb:start
- php artisan schedule:work

## Node backend
### Features
- REST endpoints for account, activity, incidents, hospitals, notifications
- JWT authentication and role checks
- Request validation and rate limiting

### Scripts
- npm run dev
- npm start

## Edge scanner
- Python service that integrates with scanner workflows
- Uses requirements.txt for dependencies

## Environment configuration
Use example env files and add secrets locally. Do not commit real API keys.
- Root: .env.example
- Backend: backend/.env.example
- Node: node-backend/.env.example
- Edge scanner: edge-scanner/.env.example

## Setup quick start
1) Frontend
- npm install
- npm run dev

2) Backend (Laravel)
- cd backend
- composer install
- cp .env.example .env
- php artisan key:generate
- php artisan migrate --seed
- php artisan serve

3) Realtime
- cd backend
- php artisan reverb:start

4) Node backend
- cd node-backend
- npm install
- npm run dev

## Database failover summary
- Cloud database is primary (Supabase/PostgreSQL)
- Local PostgreSQL runs as a backup
- Scheduled jobs sync cloud to local every minute
- On recovery, local changes are synced back to cloud

## Repository layout (high level)
- src/ : React app
- backend/ : Laravel API
- node-backend/ : Express API
- edge-scanner/ : Python scanner service
- storage/ : local data and env templates

## Notes
- Keep secrets in local .env files only
- Use the example env files to onboard new developers
