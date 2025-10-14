# Backend API Connection Guide

## ✅ Backend Setup Complete

### Migrations Created

- ✅ `hospitals` table (2025_10_13_184523)
- ✅ `resources` table (2025_10_13_184524) - **unit_cost removed**

### Models Created

- ✅ `Hospital` model with fillable fields
- ✅ `Resource` model (updated to remove unit_cost)

### Controllers Created

- ✅ `HospitalController` - Full CRUD operations
- ✅ `ResourceController` - Full CRUD + special endpoints

### Seeders Created

- ✅ `HospitalSeeder` - 2 sample hospitals
- ✅ `ResourceSeeder` - 15 sample resources

### API Routes Configured

All routes require authentication (`auth:sanctum` middleware)

#### Hospital Routes

```
GET    /api/hospitals          - Get all hospitals
GET    /api/hospitals/{id}     - Get single hospital
POST   /api/hospitals          - Create hospital
PUT    /api/hospitals/{id}     - Update hospital
DELETE /api/hospitals/{id}     - Delete hospital
```

#### Resource Routes

```
GET    /api/resources              - Get all resources (with filters)
GET    /api/resources/{id}         - Get single resource
POST   /api/resources              - Create resource
PUT    /api/resources/{id}         - Update resource
DELETE /api/resources/{id}         - Delete resource
GET    /api/resources/low-stock    - Get low stock resources
GET    /api/resources/critical     - Get critical resources
GET    /api/resources/expiring     - Get expiring resources
```

### Frontend Services Created

- ✅ `resourceService.js` - Complete resource API wrapper
- ✅ `hospitalService.js` - Complete hospital API wrapper
- ✅ `ResourceTest.jsx` - Test component to verify connection

---

## 🚀 How to Test

### 1. Start Backend Server

```bash
cd backend
php artisan serve
```

Server will run on `http://127.0.0.1:8000`

### 2. Start Frontend Server

```bash
npm run dev
```

### 3. Test API Connection

Import and use the test component:

```jsx
import ResourceTest from "./components/logistics/ResourceTest";

function App() {
  return <ResourceTest />;
}
```

Or directly use the services:

```jsx
import resourceService from "./services/resourceService";
import hospitalService from "./services/hospitalService";

// Get all resources
const resources = await resourceService.getAll();

// Get all hospitals
const hospitals = await hospitalService.getAll();

// Filter resources by category
const foodResources = await resourceService.getByCategory("food");

// Get low stock items
const lowStock = await resourceService.getLowStock();

// Search resources
const searchResults = await resourceService.search("Rice");
```

---

## 📊 Sample Data

### Hospitals (2)

1. **Central General Hospital**

   - Capacity: 500
   - Type: General
   - Location: City Center

2. **Emergency Field Hospital**
   - Capacity: 100
   - Type: Field
   - Location: Evacuation Site

### Resources (15)

- **Food**: Rice, Canned Goods, Instant Noodles
- **Water**: Bottled Water, Purification Tablets
- **Medical**: First Aid Kits, Paracetamol, Antibiotics
- **Clothing**: Blankets, T-Shirts
- **Shelter**: Tents, Tarpaulins
- **Equipment**: Flashlights, Batteries, Portable Radio

---

## 🔐 Authentication Required

All resource and hospital endpoints require authentication. Make sure to:

1. **Login first** to get auth token
2. **Token is stored** in `localStorage` as `auth_token`
3. **Automatic token injection** via axios interceptor

---

## 📝 Query Parameters for Resources

```javascript
// Filter by category
resourceService.getAll({ category: "food" });

// Filter by status
resourceService.getAll({ status: "Low" });

// Search
resourceService.getAll({ search: "Rice" });

// Get low stock only
resourceService.getAll({ low_stock: true });

// Get critical only
resourceService.getAll({ critical: true });

// Pagination
resourceService.getAll({ per_page: 20, page: 2 });

// Sort
resourceService.getAll({ sort_by: "quantity", sort_order: "asc" });
```

---

## ✨ Next Steps

1. ✅ Backend migrations and seeders tested
2. ✅ API routes configured
3. ✅ Frontend services created
4. ⏳ Integrate into logistics dashboard pages
5. ⏳ Add real-time updates (optional)
6. ⏳ Add image upload for resources (optional)

---

## 🐛 Troubleshooting

### CORS Issues

- Backend CORS is configured for `localhost:5173`
- Check `.env` file: `SANCTUM_STATEFUL_DOMAINS=localhost:5173`

### 401 Unauthorized

- Make sure user is logged in
- Check if token exists: `localStorage.getItem('auth_token')`
- Login endpoint: `POST /api/login`

### Connection Refused

- Make sure backend server is running: `php artisan serve`
- Default backend URL: `http://localhost:8000/api`
- Check frontend `src/services/api.js` baseURL

---

## 🎉 Success!

Your Laravel backend is now connected to the React frontend with:

- ✅ Hospital management
- ✅ Resource management (without unit_cost)
- ✅ Authentication required
- ✅ Sample data seeded
- ✅ Frontend services ready to use
