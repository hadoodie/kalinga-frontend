# 🧪 Quick Testing Guide - Logistics Resource Management

## ✅ Integration Complete!

The logistics resource management system is now fully integrated with the backend API.

---

## 🚀 How to Test

### 1. **Start Backend Server**

```powershell
cd backend
php artisan serve
```

Backend will run on: `http://127.0.0.1:8000`

### 2. **Start Frontend**

```powershell
npm run dev
```

Frontend will run on: `http://localhost:5174`

### 3. **Login as Logistics User**

```
Email: logistics_verified@kalinga.com
Password: password123
```

### 4. **Navigate to Resource Management**

Click on "Resource Management" in the sidebar

---

## 🎯 What to Test

### ✅ **Data Loading**

- Page should show loading spinner initially
- Data should load from backend automatically
- Should see real resources from database

### ✅ **Facility Switching**

1. Click "Evacuation Center" dropdown
2. Switch to "Medical Facility"
3. Resources should automatically update
4. Categories should change:
   - Evacuation: Food & Water, Hygiene
   - Medical: Medicine, First Aid Kit

### ✅ **Category Filtering**

1. Click different category buttons
2. Resources should filter instantly
3. Overview stats should update

### ✅ **Critical Filter**

1. Click any category button
2. Resources with "Critical" status should show
3. Overview should show critical count

### ✅ **Refresh Button**

1. Click "Refresh Data" button
2. Loading spinner should appear
3. Data should reload from backend

### ✅ **Error Handling**

1. Stop backend server (`Ctrl+C`)
2. Click "Refresh Data"
3. Should see error message with "Try again" button
4. Restart backend
5. Click "Try again"
6. Data should load successfully

---

## 📊 Expected Data

### Evacuation Center

- **Food & Water**: Rice, Canned Goods, Bottled Water
- **Hygiene**: Soap, Shampoo, Conditioner, Toothpaste, Toothbrush

### Medical Facility

- **Medicine**: Tylenol, Ibuprofen, Tempra, Bioflu, Neozep, Antibiotic
- **First Aid Kit**: Tweezers, Triangular Bandage, Adhesive Bandage, Roller Bandage, Betadine, Band Aid

---

## 🔍 Check These Features

### Overview Cards

- ✅ **Remaining Items**: Total quantity remaining
- ✅ **Distributed Items**: Total distributed
- ✅ **Received Items**: Total received
- ✅ **Critical Items**: Count of critical status items

### Resource Table

- ✅ Shows: Resource name, Category, Received, Distributed, Remaining, Unit, Status
- ✅ Status badges: Critical (red), High (green), Low (yellow)
- ✅ Responsive: Desktop table view, Mobile card view

### Filtering

- ✅ "All" shows everything for selected facility
- ✅ Category buttons filter by category
- ✅ Totals update based on filtered view

---

## 🐛 Common Issues & Solutions

### Issue: "Failed to load resources"

**Solution:**

1. Check backend is running: `http://localhost:8000`
2. Check you're logged in as `logistics_verified@kalinga.com`
3. Check browser console for errors (F12)

### Issue: No data showing

**Solution:**

1. Run seeder: `cd backend; php artisan db:seed --class=ResourceSeeder`
2. Check database has resources: `php artisan tinker` → `\App\Models\Resource::count();`

### Issue: CORS errors

**Solution:**

1. Check `backend/config/cors.php`
2. Ensure `'paths' => ['api/*']` is set
3. Restart backend server

### Issue: 401 Unauthorized

**Solution:**

1. Logout and login again
2. Check JWT token in browser localStorage
3. Token might have expired

---

## 📱 Mobile Testing

1. Open Chrome DevTools (F12)
2. Click device toolbar icon (Ctrl+Shift+M)
3. Select mobile device (iPhone 12, Galaxy S20, etc.)
4. Test all features on mobile view
5. Cards should replace table layout

---

## ✨ Key Interactions to Verify

1. **Auto-fetch on mount** - Data loads when page opens
2. **Auto-fetch on filter change** - No manual refresh needed
3. **Loading states** - Spinner shows during fetch
4. **Error recovery** - Can retry after errors
5. **Facility persistence** - Selected facility remembered during session
6. **Responsive design** - Works on all screen sizes

---

## 🎉 Success Criteria

All of these should work:

- [ ] Page loads with data from backend
- [ ] Switching facilities updates data
- [ ] Category filtering works
- [ ] Critical filter shows only critical items
- [ ] Refresh button reloads data
- [ ] Loading spinner appears during fetch
- [ ] Error message shows on API failure
- [ ] Overview stats calculate correctly
- [ ] Table shows all resource details
- [ ] Mobile view uses card layout

---

## 🔗 API Endpoints Being Used

```javascript
GET /api/resources?all=true&facility=Evacuation Center
GET /api/resources?all=true&facility=Medical Facility&category=Medicine
GET /api/resources?all=true&status=Critical
```

---

## 🎯 Next Steps

After verifying everything works:

1. **Test with real data** - Add actual resources via Postman/API
2. **Add CRUD operations** - Create, Update, Delete resources
3. **Add distribution tracking** - Record when items are distributed
4. **Add stock alerts** - Notifications for low stock
5. **Add reports** - Generate resource reports

---

## 📞 Debugging Tips

### Check API Response

```powershell
$token = (Invoke-RestMethod -Uri "http://localhost:8000/api/login" -Method Post -Headers @{"Content-Type"="application/json"} -Body '{"email":"logistics_verified@kalinga.com","password":"password123"}').token

Invoke-RestMethod -Uri "http://localhost:8000/api/resources?all=true" -Headers @{"Authorization"="Bearer $token"}
```

### Check Browser Console

Press F12 → Console tab → Look for:

- API requests (Network tab)
- Error messages (Console tab)
- Component state (React DevTools)

### Check Database

```bash
cd backend
php artisan tinker
```

```php
\App\Models\Resource::count();
\App\Models\Resource::where('location', 'LIKE', '%Evacuation%')->count();
\App\Models\Resource::where('status', 'Critical')->get();
```

---

🎉 **Congratulations!** The logistics resource management system is now fully operational with real-time backend integration!
