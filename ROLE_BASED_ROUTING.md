# Role-Based Routing Implementation

## Overview
Implemented a centralized role-based routing system that automatically redirects users to their appropriate dashboard after login or registration.

## Changes Made

### 1. Centralized Routing Utility (`src/utils/roleRouting.js`)
Created a reusable utility module with the following functions:

#### `getDefaultRouteForRole(user)`
Maps user roles to their default routes:
- **Admin** → `/admin`
- **Logistics** → `/logistic-dashboard`
- **Responder** → `/responder`
- **Patient/Resident** → `/verify-id` (if not verified) or `/dashboard` (if verified)

#### `navigateToRoleBasedRoute(user, navigate, options)`
Handles navigation with optional delay and "from" location support:
```javascript
// Example usage
navigateToRoleBasedRoute(user, navigate, { 
  delay: 1500,  // Optional delay before redirect
  from: '/login'  // Optional: where user came from
});
```

#### `needsVerification(user)`
Checks if a patient/resident needs ID verification:
- Returns `true` if role is patient/resident AND verification_status !== 'verified'

#### `getPostAuthDescription(user)`
Provides user-friendly descriptions of where users will be redirected:
```javascript
// Examples:
// "Redirecting to admin dashboard..."
// "Redirecting to logistics dashboard..."
// "Redirecting to verification process..."
```

### 2. Updated Login Component
**Before:**
```javascript
// Inline switch statement
switch(data.user.role.toLowerCase()) {
  case 'admin':
    navigate('/admin');
    break;
  case 'logistics':
    navigate('/logistic-dashboard');
    break;
  // ... more cases
}
```

**After:**
```javascript
// Using centralized utility
navigateToRoleBasedRoute(data.user, navigate, { from });
```

### 3. Updated Registration Component
**Before:**
- No backend integration
- Manual redirect to home
- Required manual login after registration

**After:**
- Integrated with backend API
- Auto-login after successful registration
- Role-based redirect using `navigateToRoleBasedRoute()`

### 4. Created Placeholder Dashboards

#### Admin Dashboard (`src/pages/18_Admin.jsx`)
Features:
- User Management card
- System Settings card
- Reports & Analytics card
- Logistics Overview card
- Emergency Response card
- Audit Logs card
- Quick stats section (Total Users, Active Sessions, System Health, Pending Tasks)

#### Responder Dashboard (`src/pages/19_Responder.jsx`)
Features:
- Active Emergencies card
- Recent Reports card
- Resource Requests card
- Evacuation Centers card
- Team Communication card
- Medical Facilities card
- Alert banner for emergency notifications
- Quick stats section (Responses Today, Active Teams, People Assisted, Resources Deployed)

### 5. Updated App Routes (`src/App.jsx`)
Added protected routes:
```javascript
{/* Admin Routes */}
<Route path="/admin" element={
  <ProtectedRoute allowedRoles={["admin"]}>
    <AdminDashboard />
  </ProtectedRoute>
}/>

{/* Responder Routes */}
<Route path="/responder" element={
  <ProtectedRoute allowedRoles={["responder"]}>
    <ResponderDashboard />
  </ProtectedRoute>
}/>
```

## Testing Checklist

### Login Flow
- [ ] Login as **Admin** → Should redirect to `/admin`
- [ ] Login as **Logistics** → Should redirect to `/logistic-dashboard`
- [ ] Login as **Responder** → Should redirect to `/responder`
- [ ] Login as **Patient (verified)** → Should redirect to `/dashboard`
- [ ] Login as **Patient (unverified)** → Should redirect to `/verify-id`

### Registration Flow
- [ ] Register as **Admin** → Should auto-login and redirect to `/admin`
- [ ] Register as **Logistics** → Should auto-login and redirect to `/logistic-dashboard`
- [ ] Register as **Responder** → Should auto-login and redirect to `/responder`
- [ ] Register as **Patient** → Should auto-login and redirect to `/verify-id`

### Protected Routes
- [ ] Admin cannot access `/logistic-dashboard`
- [ ] Logistics cannot access `/admin`
- [ ] Responder cannot access `/dashboard`
- [ ] Patient cannot access `/admin`, `/responder`, or `/logistic-dashboard`

## Benefits

1. **Centralized Logic**: All routing logic in one place (`roleRouting.js`)
2. **Maintainability**: Easy to update role mappings without touching components
3. **Consistency**: Same routing behavior across login and registration
4. **Extensibility**: Easy to add new roles or modify routing rules
5. **User Experience**: Smooth transitions with optional delays and descriptions

## Next Steps

1. Implement actual features for each dashboard:
   - Admin: User management, system settings, audit logs
   - Responder: Emergency management, resource coordination
   - Logistics: Already implemented
   - Patient: Already implemented

2. Add role-based navigation menus:
   - Show/hide menu items based on user role
   - Update Sidebar component for each role

3. Add breadcrumbs and navigation hints:
   - Show current location in dashboard
   - Provide quick links to common tasks

4. Implement role-specific notifications:
   - Admin: System alerts, user activities
   - Responder: Emergency alerts, resource requests
   - Logistics: Supply updates, allocation requests
   - Patient: Appointment reminders, emergency broadcasts

## Notes

- All placeholder dashboards use TailwindCSS for styling
- Dashboards are responsive (mobile-friendly)
- All dashboards include a notice that they are placeholders
- Role routing respects the "from" parameter to redirect back after authentication
