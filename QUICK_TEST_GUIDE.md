# 🧪 Testing Guide - Authentication & Verification Flow

## Prerequisites
✅ Backend: `cd backend; php artisan serve` (http://127.0.0.1:8000)
✅ Frontend: `npm run dev` (http://localhost:5174)
✅ Database: `cd backend; php artisan migrate:fresh --seed`

---

## 🎯 Quick Test Scenarios

### Test 1: Complete Registration & Verification Flow
```bash
1. Register: http://localhost:5174/create-acc
   - Email: testuser@example.com
   - Password: password123
   - Expected: Auto-login → /verify-id

2. Complete Verification:
   - Choose ID (e.g., "Driver's License")
   - Upload image (JPEG/PNG < 2MB)
   - Fill personal info (name, birthday, contact, address)
   - Submit form
   - Expected: Success message → /verification-pending

3. Verify in Database:
   cd backend; php artisan tinker
   $user = User::where('email', 'testuser@example.com')->first();
   $user->verification_status; // Should be 'pending'
   exit;

4. Approve Verification:
   cd backend; php artisan tinker
   $user = User::where('email', 'testuser@example.com')->first();
   $user->verification_status = 'verified';
   $user->save();
   exit;

5. Login Again:
   - Expected: Redirect to /dashboard
```

### Test 2: Seeded Test Accounts
```bash
# Admin
Email: admin@kalinga.com
Password: password123
Expected: /admin

# Logistics (Verified)
Email: logistics_verified@kalinga.com  
Password: password123
Expected: /logistic-dashboard

# Logistics (Unverified)
Email: logistics_unverified@kalinga.com
Password: password123
Expected: /verify-id

# Patient (Verified)
Email: patient_verified@kalinga.com
Password: password123
Expected: /dashboard

# Patient (Unverified)
Email: patient_unverified@kalinga.com
Password: password123
Expected: /verify-id

# Responder (Verified)
Email: responder_verified@kalinga.com
Password: password123
Expected: /responder
```

---

## 🔐 Security Tests

### URL Bypass Prevention
```bash
# Test as unverified patient
1. Login: patient_unverified@kalinga.com
2. Type URL: http://localhost:5174/dashboard
3. Expected: Redirect to /verify-id (BLOCKED!)
```

### Already Verified Protection
```bash
# Test as verified patient
1. Login: patient_verified@kalinga.com
2. Type URL: http://localhost:5174/verify-id
3. Expected: Redirect to /dashboard (BLOCKED!)
```

---

## 📊 Check Status via Browser Console
```javascript
// Press F12, then paste:
const user = JSON.parse(localStorage.getItem('user'));
console.table({
  name: user.name,
  email: user.email,
  role: user.role,
  verification_status: user.verification_status || 'null (not started)'
});
```

---

## 🛠️ Database Commands

### View All Users
```bash
cd backend
php artisan tinker
User::all(['id', 'name', 'email', 'role', 'verification_status'])->toArray();
```

### Count by Status
```php
echo "Null: " . User::whereNull('verification_status')->count() . "\n";
echo "Pending: " . User::where('verification_status', 'pending')->count() . "\n";
echo "Verified: " . User::where('verification_status', 'verified')->count() . "\n";
echo "Rejected: " . User::where('verification_status', 'rejected')->count() . "\n";
```

### Manually Change Status
```php
$user = User::where('email', 'test@example.com')->first();
$user->verification_status = 'verified'; // or 'pending', 'rejected', null
$user->save();
exit;
```

---

## ✅ Expected Behavior Matrix

| User Status | Login Redirect | Can Access Dashboard? | Can Access Verify-ID? |
|------------|---------------|---------------------|---------------------|
| `null` (not started) | `/verify-id` | ❌ Redirect | ✅ Yes |
| `'pending'` (submitted) | `/verification-pending` | ❌ Redirect | ❌ Redirect |
| `'verified'` (approved) | `/dashboard` | ✅ Yes | ❌ Redirect |
| `'rejected'` (rejected) | `/verify-id` | ❌ Redirect | ✅ Yes (resubmit) |

---

## 🐛 Troubleshooting

### Issue: "Network Error"
```bash
# Check backend running
cd backend; php artisan serve

# Check CORS settings
cat backend/config/cors.php
```

### Issue: Stale User Data
```javascript
// Clear localStorage
localStorage.clear();
location.reload();
```

### Issue: Database Errors
```bash
# Reset database
cd backend
php artisan migrate:fresh --seed
```

---

## 📝 Key Features Tested

- ✅ Role-based routing (admin, logistics, responder, patient)
- ✅ Verification status handling (null, pending, verified, rejected)
- ✅ URL bypass prevention (ProtectedRoute guards)
- ✅ Already-verified user protection
- ✅ Backend API integration for verification
- ✅ File upload handling
- ✅ Auto-login after registration
- ✅ Logout functionality

