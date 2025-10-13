# 🚀 Kalinga Backend Implementation Guide

## ✅ Setup Complete

### What's Already Configured:

1. ✅ Laravel 11 installed
2. ✅ Laravel Sanctum (API authentication)
3. ✅ PostgreSQL configured (.env file)
4. ✅ CORS enabled for React frontend (http://localhost:5173)
5. ✅ Timezone set to Asia/Manila

---

## 📋 Prerequisites Checklist

Before starting development, ensure you have:

-   [ ] **PostgreSQL** installed and running
-   [ ] **PHP 8.2+** installed
-   [ ] **Composer** installed
-   [ ] **Node.js & npm** installed (for frontend)

### PostgreSQL Setup

1. **Install PostgreSQL** (if not installed)
2. **Create Database:**
    ```sql
    CREATE DATABASE kalinga_db;
    ```
3. **Update `.env` file** with your PostgreSQL credentials:

    ```env
    DB_CONNECTION=pgsql
    DB_HOST=127.0.0.1
    DB_PORT=5432
    DB_DATABASE=kalinga_db
    DB_USERNAME=postgres
    DB_PASSWORD=your_password_here
    ```

4. **Run migrations:**
    ```bash
    php artisan migrate
    ```

---

## 🗂️ Database Schema Design

Based on your frontend, here are the required tables:

### Core Tables

#### 1. **users** (Enhanced)

```php
- id
- name
- email
- password
- role (enum: 'resident', 'responder', 'admin', 'logistics')
- phone
- profile_image
- address
- barangay
- city
- zip_code
- id_type (Driver's License, UMID, etc.)
- id_image_path
- verification_status (enum: 'pending', 'verified', 'rejected')
- is_active
- timestamps
```

#### 2. **incidents** (Emergency Reports)

```php
- id
- user_id (foreign key)
- type (enum: 'medical', 'fire', 'flood', 'earthquake', 'accident', 'other')
- description
- latitude
- longitude
- address
- status (enum: 'pending', 'responded', 'resolved', 'cancelled')
- priority (enum: 'low', 'medium', 'high', 'critical')
- responder_id (nullable, foreign key to users)
- response_time
- resolution_time
- timestamps
```

#### 3. **evacuation_centers**

```php
- id
- name
- address
- barangay
- city
- latitude
- longitude
- capacity
- occupied
- available
- status (enum: 'available', 'full', 'closed')
- contact_number
- facilities (json: ['medical', 'food', 'water'])
- timestamps
```

#### 4. **hospitals**

```php
- id
- name
- address
- latitude
- longitude
- contact_number
- beds_total
- beds_occupied
- beds_available
- emergency_status (enum: 'open', 'full', 'emergency_only')
- trauma_level
- specialties (json)
- average_wait_time
- distance_from_center (calculated)
- timestamps
```

#### 5. **resources** (Inventory)

```php
- id
- name
- category (enum: 'food', 'water', 'medicine', 'first_aid', 'hygiene')
- unit
- quantity_received
- quantity_distributed
- quantity_remaining
- facility_type (enum: 'evacuation_center', 'medical_facility')
- facility_id
- status (enum: 'critical', 'low', 'moderate', 'high')
- last_updated
- timestamps
```

#### 6. **resource_requests**

```php
- id
- requester_id (foreign key to users)
- location
- evacuation_center_id (nullable)
- urgency (enum: 'low', 'medium', 'high', 'critical')
- type (enum: 'medical', 'food', 'shelter', 'hygiene')
- status (enum: 'pending', 'approved', 'in_transit', 'delivered', 'rejected')
- justification (text)
- contact_number
- approved_by (nullable, foreign key to users)
- timestamps
```

#### 7. **resource_request_items**

```php
- id
- request_id (foreign key)
- resource_name
- quantity_requested
- quantity_allocated
- timestamps
```

#### 8. **vehicles**

```php
- id
- vehicle_id (unique code like V-101)
- type (enum: 'ambulance', 'fire_truck', 'suv', 'truck', 'bus', 'drone')
- capacity
- status (enum: 'active', 'standby', 'under_repair', 'deployed')
- current_location
- assigned_personnel
- last_maintenance
- timestamps
```

#### 9. **shipments**

```php
- id
- shipment_id (unique code like S-7001)
- vehicle_id (foreign key)
- request_id (nullable, foreign key)
- route_from
- route_to
- contents (json)
- status (enum: 'pending', 'in_transit', 'delayed', 'delivered', 'cancelled')
- priority (enum: 'low', 'medium', 'high', 'critical')
- eta
- latitude
- longitude
- last_ping
- timestamps
```

#### 10. **weather_data**

```php
- id
- city
- barangay (nullable)
- temperature_celsius
- temperature_fahrenheit
- condition (enum: 'sunny', 'cloudy', 'rainy', 'stormy')
- wind_speed
- humidity
- precipitation_chance
- forecast_date
- recorded_at
- timestamps
```

#### 11. **notifications**

```php
- id
- user_id (foreign key)
- type (enum: 'emergency', 'weather', 'resource', 'system')
- title
- message
- is_read
- priority (enum: 'low', 'normal', 'high', 'urgent')
- action_url (nullable)
- timestamps
```

#### 12. **chat_messages**

```php
- id
- incident_id (foreign key)
- sender_id (foreign key to users)
- receiver_id (foreign key to users)
- message
- is_read
- timestamps
```

---

## 🛠️ Step-by-Step Implementation Plan

### **Phase 1: Database Setup (Week 1)**

#### Step 1: Create Migration Files

```bash
# Users enhancement
php artisan make:migration add_fields_to_users_table --table=users

# Core tables
php artisan make:migration create_incidents_table
php artisan make:migration create_evacuation_centers_table
php artisan make:migration create_hospitals_table
php artisan make:migration create_resources_table
php artisan make:migration create_resource_requests_table
php artisan make:migration create_resource_request_items_table
php artisan make:migration create_vehicles_table
php artisan make:migration create_shipments_table
php artisan make:migration create_weather_data_table
php artisan make:migration create_notifications_table
php artisan make:migration create_chat_messages_table
```

#### Step 2: Create Models with Relationships

```bash
php artisan make:model Incident
php artisan make:model EvacuationCenter
php artisan make:model Hospital
php artisan make:model Resource
php artisan make:model ResourceRequest
php artisan make:model ResourceRequestItem
php artisan make:model Vehicle
php artisan make:model Shipment
php artisan make:model WeatherData
php artisan make:model Notification
php artisan make:model ChatMessage
```

#### Step 3: Define Model Relationships

**Example: User Model**

```php
public function incidents() {
    return $this->hasMany(Incident::class);
}

public function respondedIncidents() {
    return $this->hasMany(Incident::class, 'responder_id');
}

public function resourceRequests() {
    return $this->hasMany(ResourceRequest::class, 'requester_id');
}

public function sentMessages() {
    return $this->hasMany(ChatMessage::class, 'sender_id');
}

public function receivedMessages() {
    return $this->hasMany(ChatMessage::class, 'receiver_id');
}
```

#### Step 4: Create Seeders for Test Data

```bash
php artisan make:seeder EvacuationCenterSeeder
php artisan make:seeder HospitalSeeder
php artisan make:seeder ResourceSeeder
php artisan make:seeder VehicleSeeder
```

---

### **Phase 2: Authentication & User Management (Week 1-2)**

#### Step 1: Create Auth Controllers

```bash
php artisan make:controller Api/AuthController
php artisan make:controller Api/UserController
```

#### Step 2: Implement Authentication Endpoints

**AuthController.php** - Key methods:

```php
- register() // Create account with role selection
- login() // Email/password authentication
- logout() // Revoke token
- me() // Get authenticated user
- verifyAccount() // Upload ID verification
- updateProfile() // Update user information
```

#### Step 3: Define API Routes (routes/api.php)

```php
// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);

// Protected routes (require authentication)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::post('/verify-id', [AuthController::class, 'verifyId']);
});
```

#### Step 4: Create Form Requests for Validation

```bash
php artisan make:request RegisterRequest
php artisan make:request LoginRequest
php artisan make:request UpdateProfileRequest
```

---

### **Phase 3: Emergency/Incident Management (Week 2)**

#### Step 1: Create Controllers

```bash
php artisan make:controller Api/IncidentController --api
```

#### Step 2: Implement Incident Endpoints

```php
// routes/api.php
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('incidents', IncidentController::class);
    Route::post('incidents/{incident}/assign', [IncidentController::class, 'assign']);
    Route::post('incidents/{incident}/respond', [IncidentController::class, 'respond']);
    Route::post('incidents/{incident}/resolve', [IncidentController::class, 'resolve']);
});
```

**IncidentController methods:**

-   `index()` - List all incidents (with filters by status, priority, type)
-   `store()` - Create new incident report
-   `show($id)` - Get incident details
-   `update($id)` - Update incident
-   `assign($id)` - Assign responder to incident
-   `respond($id)` - Mark as responded
-   `resolve($id)` - Mark as resolved

---

### **Phase 4: Evacuation Centers & Hospitals (Week 2-3)**

#### Step 1: Create Controllers

```bash
php artisan make:controller Api/EvacuationCenterController --api
php artisan make:controller Api/HospitalController --api
```

#### Step 2: Implement Endpoints

```php
// List evacuation centers with availability
GET /api/evacuation-centers

// Get specific center details
GET /api/evacuation-centers/{id}

// Update occupancy (admin/logistics only)
PUT /api/evacuation-centers/{id}/occupancy

// Search nearby centers
GET /api/evacuation-centers/nearby?lat={lat}&lng={lng}

// Similar for hospitals
GET /api/hospitals
GET /api/hospitals/{id}
GET /api/hospitals/nearby?lat={lat}&lng={lng}
```

---

### **Phase 5: Logistics & Resource Management (Week 3-4)**

#### Step 1: Create Controllers

```bash
php artisan make:controller Api/ResourceController --api
php artisan make:controller Api/ResourceRequestController --api
php artisan make:controller Api/VehicleController --api
php artisan make:controller Api/ShipmentController --api
```

#### Step 2: Implement Logistics Endpoints

```php
// Resource Management
GET /api/resources
POST /api/resources
PUT /api/resources/{id}
GET /api/resources/summary // Total received, distributed, remaining

// Resource Requests
GET /api/resource-requests
POST /api/resource-requests
PUT /api/resource-requests/{id}/approve
PUT /api/resource-requests/{id}/reject
PUT /api/resource-requests/{id}/status

// Vehicle Management
GET /api/vehicles
POST /api/vehicles
PUT /api/vehicles/{id}
GET /api/vehicles/available

// Shipment Tracking
GET /api/shipments
POST /api/shipments
PUT /api/shipments/{id}/status
GET /api/shipments/tracking/{id}
```

---

### **Phase 6: Weather & Notifications (Week 4)**

#### Step 1: Create Controllers

```bash
php artisan make:controller Api/WeatherController
php artisan make:controller Api/NotificationController
```

#### Step 2: Weather API Integration

-   Integrate with OpenWeatherMap API or similar
-   Store historical weather data
-   Provide forecasts by city/barangay

```php
GET /api/weather/{city}
GET /api/weather/forecast/{city}
```

#### Step 3: Notification System

```php
GET /api/notifications
POST /api/notifications/send
PUT /api/notifications/{id}/read
DELETE /api/notifications/{id}
```

---

### **Phase 7: Chat System (Week 4-5)**

#### Step 1: Create Controller

```bash
php artisan make:controller Api/ChatController
```

#### Step 2: Implement Real-time Chat

-   Use Laravel Echo + Pusher or Laravel Reverb (Laravel 11 built-in)
-   Socket.io alternative

```php
GET /api/chats/incident/{incident_id}
POST /api/chats/incident/{incident_id}/message
PUT /api/chats/messages/{id}/read
```

#### Step 3: Broadcasting Setup

```bash
php artisan install:broadcasting
```

---

### **Phase 8: Dashboard Analytics (Week 5)**

#### Step 1: Create Dashboard Controller

```bash
php artisan make:controller Api/DashboardController
```

#### Step 2: Aggregate Endpoints

```php
GET /api/dashboard/stats
// Returns:
// - Total incidents (by status, priority)
// - Active responders
// - Evacuation center occupancy
// - Resource levels
// - Recent activities

GET /api/dashboard/logistics
// Returns:
// - Total resources summary
// - Active shipments
// - Pending requests
// - Vehicle availability
```

---

## 🔐 Security Best Practices

### 1. **Role-Based Access Control (RBAC)**

Create middleware for role checking:

```bash
php artisan make:middleware CheckRole
```

**CheckRole.php**:

```php
public function handle($request, Closure $next, ...$roles) {
    if (!$request->user() || !in_array($request->user()->role, $roles)) {
        return response()->json(['message' => 'Unauthorized'], 403);
    }
    return $next($request);
}
```

Register in `bootstrap/app.php`:

```php
$middleware->alias([
    'role' => \App\Http\Middleware\CheckRole::class,
]);
```

Usage in routes:

```php
Route::middleware(['auth:sanctum', 'role:admin,logistics'])->group(function () {
    // Admin and logistics only routes
});
```

### 2. **API Rate Limiting**

Already configured in Laravel. Customize in `bootstrap/app.php`:

```php
$middleware->throttleApi(attempts: 60, decayMinutes: 1);
```

### 3. **Input Validation**

Always use Form Requests for validation:

```php
php artisan make:request StoreIncidentRequest
```

### 4. **File Upload Security**

-   Validate file types and sizes
-   Store in private storage
-   Use signed URLs for access

---

## 📡 Frontend Integration

### Install Axios in React

```bash
npm install axios
```

### Create API Service (src/services/api.js)

```javascript
import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:8000/api",
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
    withCredentials: true, // Important for Sanctum
});

// Request interceptor for auth token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Redirect to login
            localStorage.removeItem("auth_token");
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);

export default api;
```

### Create Service Modules

**src/services/authService.js**:

```javascript
import api from "./api";

export const authService = {
    async login(credentials) {
        const response = await api.post("/login", credentials);
        if (response.data.token) {
            localStorage.setItem("auth_token", response.data.token);
        }
        return response.data;
    },

    async register(userData) {
        const response = await api.post("/register", userData);
        return response.data;
    },

    async logout() {
        await api.post("/logout");
        localStorage.removeItem("auth_token");
    },

    async getCurrentUser() {
        const response = await api.get("/me");
        return response.data;
    },
};
```

**src/services/incidentService.js**:

```javascript
import api from "./api";

export const incidentService = {
    async getAll(filters = {}) {
        const response = await api.get("/incidents", { params: filters });
        return response.data;
    },

    async create(incidentData) {
        const response = await api.post("/incidents", incidentData);
        return response.data;
    },

    async getById(id) {
        const response = await api.get(`/incidents/${id}`);
        return response.data;
    },

    async update(id, data) {
        const response = await api.put(`/incidents/${id}`, data);
        return response.data;
    },
};
```

### Update Frontend Components

**Example: Login Component**:

```javascript
import { authService } from "../services/authService";

const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
        const data = await authService.login({ email, password });
        toast({
            title: "Signed In",
            description: "Welcome back to Kalinga!",
        });
        navigate("/dashboard");
    } catch (error) {
        toast({
            title: "Error",
            description: error.response?.data?.message || "Login failed",
            variant: "destructive",
        });
    } finally {
        setIsSubmitting(false);
    }
};
```

---

## 🧪 Testing Strategy

### 1. **Feature Tests**

```bash
php artisan make:test IncidentTest
php artisan make:test AuthTest
```

### 2. **API Testing with Postman/Insomnia**

-   Create collection for all endpoints
-   Test authentication flow
-   Test CRUD operations
-   Test error responses

### 3. **Frontend Integration Testing**

-   Test API calls from React components
-   Test authentication persistence
-   Test error handling

---

## 📊 Development Workflow

### Daily Development Cycle:

1. **Create Migration** → `php artisan make:migration ...`
2. **Run Migration** → `php artisan migrate`
3. **Create Model** → `php artisan make:model ...`
4. **Create Controller** → `php artisan make:controller ...`
5. **Define Routes** → Edit `routes/api.php`
6. **Create Form Request** → `php artisan make:request ...`
7. **Implement Logic** → Write controller methods
8. **Test with Postman** → Verify endpoints work
9. **Create Frontend Service** → Create service in React
10. **Integrate with Components** → Update React components
11. **Test End-to-End** → Test full flow

### Useful Commands:

```bash
# Start Laravel server
php artisan serve

# Run migrations
php artisan migrate

# Rollback migrations
php artisan migrate:rollback

# Refresh database (drop all + migrate)
php artisan migrate:fresh

# Run seeders
php artisan db:seed

# Clear cache
php artisan cache:clear
php artisan config:clear
php artisan route:clear

# Generate API documentation
php artisan route:list
```

---

## 📁 Project Structure

```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   └── Api/
│   │   │       ├── AuthController.php
│   │   │       ├── IncidentController.php
│   │   │       ├── EvacuationCenterController.php
│   │   │       ├── HospitalController.php
│   │   │       ├── ResourceController.php
│   │   │       ├── ResourceRequestController.php
│   │   │       ├── VehicleController.php
│   │   │       ├── ShipmentController.php
│   │   │       ├── WeatherController.php
│   │   │       ├── NotificationController.php
│   │   │       ├── ChatController.php
│   │   │       └── DashboardController.php
│   │   ├── Requests/
│   │   └── Middleware/
│   ├── Models/
│   │   ├── User.php
│   │   ├── Incident.php
│   │   ├── EvacuationCenter.php
│   │   ├── Hospital.php
│   │   ├── Resource.php
│   │   ├── ResourceRequest.php
│   │   ├── ResourceRequestItem.php
│   │   ├── Vehicle.php
│   │   ├── Shipment.php
│   │   ├── WeatherData.php
│   │   ├── Notification.php
│   │   └── ChatMessage.php
│   └── Services/ (optional for business logic)
├── database/
│   ├── migrations/
│   ├── seeders/
│   └── factories/
├── routes/
│   ├── api.php
│   └── web.php
├── config/
│   ├── cors.php
│   ├── sanctum.php
│   └── ...
└── .env
```

---

## 🚦 Next Immediate Steps

1. **Set up PostgreSQL database:**

    ```sql
    CREATE DATABASE kalinga_db;
    ```

2. **Update .env with your PostgreSQL password**

3. **Test database connection:**

    ```bash
    php artisan migrate
    ```

4. **Start creating migrations (Phase 1)**

5. **Test Laravel server:**

    ```bash
    php artisan serve
    # Should run on http://localhost:8000
    ```

6. **Test CORS from frontend:**
    ```bash
    # In frontend directory
    npm run dev
    # Should run on http://localhost:5173
    ```

---

## 📚 Additional Resources

-   [Laravel Documentation](https://laravel.com/docs/11.x)
-   [Laravel Sanctum](https://laravel.com/docs/11.x/sanctum)
-   [PostgreSQL Documentation](https://www.postgresql.org/docs/)
-   [React Axios Tutorial](https://axios-http.com/docs/intro)

---

## 🎯 Success Metrics

-   [ ] All database tables created
-   [ ] All API endpoints functional
-   [ ] Authentication working (login, register, logout)
-   [ ] Frontend successfully calling backend APIs
-   [ ] Role-based access control implemented
-   [ ] Real-time features working (chat, notifications)
-   [ ] Weather data integration complete
-   [ ] Logistics tracking operational

---

**Happy Coding! 🎉**

_Last Updated: October 13, 2025_
