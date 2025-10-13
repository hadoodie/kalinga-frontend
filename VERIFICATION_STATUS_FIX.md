# Verification Status Fix - Testing Guide

## What Was Fixed

### The Problem
- When users registered, they automatically got `verification_status = 'pending'` (from database default)
- Even if they exited the verification flow without submitting, status was still `'pending'`
- This caused them to see the "Verification Pending" waiting screen instead of the verify-id form

### The Solution
1. **Changed database default** from `'pending'` to `null`
   - Now new users have `verification_status = null` (not started)
   - Status only becomes `'pending'` when they **submit** the verification form

2. **Updated FillInfo.jsx** to set status to `'pending'` on submission
   - When user completes the form, localStorage is updated with status `'pending'`
   - User is then redirected to `/verification-pending` page

## Verification Flow States

```
┌─────────────────────────────────────────────────────────────┐
│  STATE 1: JUST REGISTERED (verification_status = null)      │
├─────────────────────────────────────────────────────────────┤
│  User Action: Just created account                          │
│  Redirect To: /verify-id (start verification)               │
│  User Sees: "Choose an ID to get verified" page             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    User fills form
                    and clicks Submit
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  STATE 2: SUBMITTED (verification_status = 'pending')       │
├─────────────────────────────────────────────────────────────┤
│  User Action: Submitted verification form                   │
│  Redirect To: /verification-pending                         │
│  User Sees: "Your verification is being reviewed" page      │
│  Duration: Until admin approves/rejects                     │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
                ▼                       ▼
┌─────────────────────────┐   ┌─────────────────────────┐
│  STATE 3A: APPROVED     │   │  STATE 3B: REJECTED     │
│  (status = 'verified')  │   │  (status = 'rejected')  │
├─────────────────────────┤   ├─────────────────────────┤
│  Redirect: /dashboard   │   │  Redirect: /verify-id   │
│  Full access granted    │   │  Can resubmit           │
└─────────────────────────┘   └─────────────────────────┘
```

## How to Test

### Test 1: New User Flow (Happy Path)

```bash
Step 1: Register new patient
→ Go to: http://localhost:5174/create-acc
→ Email: newuser@test.com
→ Password: password123
→ Click "Create Account"
→ Expected: Auto-login + redirect to /verify-id
→ Status in DB: null

Step 2: Exit verification (don't submit)
→ Click browser back button OR close tab
→ Login again with same credentials
→ Expected: Redirect to /verify-id (can restart)
→ Status in DB: still null

Step 3: Complete verification
→ Choose an ID type
→ Upload ID image
→ Fill in personal information
→ Click "Submit"
→ Expected: Alert "Verification submitted successfully!"
→ Then redirect to: /verification-pending
→ Status in localStorage: 'pending'

Step 4: Try accessing dashboard
→ Manually type: http://localhost:5174/dashboard
→ Expected: Redirect back to /verification-pending
→ Cannot bypass verification!
```

### Test 2: Verify User with Tinker

```bash
# Open terminal in backend folder
cd backend
php artisan tinker

# Find the user
$user = User::where('email', 'newuser@test.com')->first();

# Check current status
echo $user->verification_status; // Should be null or 'pending'

# Approve verification
$user->verification_status = 'verified';
$user->save();

# Exit tinker
exit;
```

### Test 3: Login After Verification

```bash
Step 1: Logout
→ Click logout button

Step 2: Login again
→ Email: newuser@test.com
→ Password: password123
→ Expected: Redirect to /dashboard
→ Full access granted!

Step 3: Try accessing verify-id
→ Type: http://localhost:5174/verify-id
→ Expected: Auto-redirect to /dashboard
→ Cannot restart verification when already verified
```

### Test 4: Rejected Verification

```bash
# In tinker
$user = User::where('email', 'newuser@test.com')->first();
$user->verification_status = 'rejected';
$user->save();
exit;

# Login
→ Expected: Redirect to /verification-pending
→ Page shows: "Verification Rejected" with red alert
→ Button: "Resubmit Verification"
→ Click button → Goes to /verify-id
```

## Quick Status Checks

### Check User Status in Browser Console

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

### Check Database Directly

```bash
cd backend
php artisan tinker

# List all users with their status
User::all(['id', 'name', 'email', 'role', 'verification_status'])->toArray();

# Count users by status
echo "Null: " . User::whereNull('verification_status')->count() . "\n";
echo "Pending: " . User::where('verification_status', 'pending')->count() . "\n";
echo "Verified: " . User::where('verification_status', 'verified')->count() . "\n";
echo "Rejected: " . User::where('verification_status', 'rejected')->count() . "\n";
```

## Reset Test User

If you need to reset a user to test again:

```bash
cd backend
php artisan tinker

$user = User::where('email', 'newuser@test.com')->first();

# Reset to "not started" state
$user->verification_status = null;
$user->id_type = null;
$user->id_image_path = null;
$user->save();

# Or delete completely
$user->delete();

exit;
```

## Expected Behavior Summary

| User Status | Login Redirect | Can Access /dashboard? | Can Access /verify-id? |
|------------|---------------|----------------------|---------------------|
| `null` (not started) | `/verify-id` | ❌ Redirect to verify-id | ✅ Yes |
| `'pending'` (submitted) | `/verification-pending` | ❌ Redirect to pending | ✅ Yes (can view) |
| `'verified'` (approved) | `/dashboard` | ✅ Yes | ❌ Redirect to dashboard |
| `'rejected'` (rejected) | `/verification-pending` | ❌ Redirect to pending | ✅ Yes (resubmit) |

## Important Notes

⚠️ **After changing migration:**
- Database was reset with `php artisan migrate:fresh --seed`
- All test data was recreated
- Existing seeded users have `verification_status = 'verified'` (from UserSeeder.php)

⚠️ **Temporary Implementation:**
- Verification form only updates localStorage (not backend)
- Real backend API integration needed for production
- Admin approval system not yet implemented

✅ **What Works Now:**
- New users start with `null` status (not started)
- Can exit and resume verification flow
- Status changes to `'pending'` only after submission
- Proper redirects based on verification state
- Cannot bypass verification via URL manipulation

## Troubleshooting

### Issue: User still sees "pending" after fresh registration
**Solution:** Clear localStorage and try again
```javascript
localStorage.clear();
location.reload();
```

### Issue: After logout, login redirects to wrong page
**Solution:** The user data in localStorage might be stale
```javascript
localStorage.removeItem('user');
location.reload();
```

### Issue: Database still has old default value
**Solution:** Run migration refresh again
```bash
cd backend
php artisan migrate:fresh --seed
```
