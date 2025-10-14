# 🔐 Authentication & Role-Based Access Control Test Guide

## ✅ Setup Complete

### Test Users Created

All users have password: `password123`

| Email                 | Role      | Access Level                   |
| --------------------- | --------- | ------------------------------ |
| admin@kalinga.com     | admin     | Full access to all features    |
| logistics@kalinga.com | logistics | Resource & hospital management |
| responder@kalinga.com | responder | Emergency response features    |
| resident@kalinga.com  | patient   | Basic resident features        |
| patient@kalinga.com   | patient   | Patient/resident features      |

---

## 🧪 Test the Authentication System

### 1. Test Login Endpoint

**Login as Admin:**

```bash
curl -X POST http://127.0.0.1:8000/api/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@kalinga.com\",\"password\":\"password123\"}"
```

**Expected Response:**

```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@kalinga.com",
    "role": "admin",
    "is_active": true
  },
  "token": "1|xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

**Save the token** - You'll need it for testing protected routes!

---

### 2. Test Protected Routes (With Auth)

**Get Current User:**

```bash
curl http://127.0.0.1:8000/api/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Get Resources (Admin/Logistics only):**

```bash
curl http://127.0.0.1:8000/api/resources \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### 3. Test Role-Based Access Control

**Login as Different Roles and Test Access:**

#### Test 1: Admin Access (Should Work ✅)

```bash
# 1. Login as admin
TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@kalinga.com\",\"password\":\"password123\"}" \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# 2. Access resources (Should work)
curl http://127.0.0.1:8000/api/resources \
  -H "Authorization: Bearer $TOKEN"

# 3. Access admin users endpoint (Should work)
curl http://127.0.0.1:8000/api/admin/users \
  -H "Authorization: Bearer $TOKEN"
```

#### Test 2: Logistics Access (Should Work for Resources ✅)

```bash
# 1. Login as logistics
TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"logistics@kalinga.com\",\"password\":\"password123\"}" \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# 2. Access resources (Should work)
curl http://127.0.0.1:8000/api/resources \
  -H "Authorization: Bearer $TOKEN"

# 3. Access admin users endpoint (Should FAIL ❌)
curl http://127.0.0.1:8000/api/admin/users \
  -H "Authorization: Bearer $TOKEN"
```

**Expected 403 Response:**

```json
{
  "message": "Forbidden. You do not have permission to access this resource.",
  "required_roles": ["admin"],
  "your_role": "logistics"
}
```

#### Test 3: Patient Access (Should FAIL ❌)

```bash
# 1. Login as patient
TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"patient@kalinga.com\",\"password\":\"password123\"}" \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# 2. Try to access resources (Should FAIL ❌)
curl http://127.0.0.1:8000/api/resources \
  -H "Authorization: Bearer $TOKEN"
```

**Expected 403 Response:**

```json
{
  "message": "Forbidden. You do not have permission to access this resource.",
  "required_roles": ["admin", "logistics"],
  "your_role": "patient"
}
```

---

## 🎯 PowerShell Test Commands

### Test 1: Login as Admin

```powershell
$response = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"admin@kalinga.com","password":"password123"}'

$token = $response.token
Write-Host "Admin Token: $token"
Write-Host "User: $($response.user.name) - Role: $($response.user.role)"
```

### Test 2: Access Protected Resource

```powershell
$headers = @{
    "Authorization" = "Bearer $token"
}

$resources = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/resources" `
  -Headers $headers

Write-Host "Found $($resources.Count) resources"
```

### Test 3: Test Admin-Only Endpoint

```powershell
$users = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/admin/users" `
  -Headers $headers

Write-Host "Found $($users.data.Count) users"
```

### Test 4: Login as Patient and Try to Access Resources (Should Fail)

```powershell
$patientResponse = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"patient@kalinga.com","password":"password123"}'

$patientToken = $patientResponse.token
$patientHeaders = @{
    "Authorization" = "Bearer $patientToken"
}

# This should fail with 403
try {
    $resources = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/resources" `
      -Headers $patientHeaders
} catch {
    Write-Host "Access Denied (Expected): $($_.Exception.Response.StatusCode)"
}
```

---

## 📊 Role Permission Matrix

| Endpoint                             | Admin | Logistics | Responder | Patient |
| ------------------------------------ | ----- | --------- | --------- | ------- |
| `POST /api/login`                    | ✅    | ✅        | ✅        | ✅      |
| `POST /api/register`                 | ✅    | ✅        | ✅        | ✅      |
| `GET /api/me`                        | ✅    | ✅        | ✅        | ✅      |
| `POST /api/logout`                   | ✅    | ✅        | ✅        | ✅      |
| `GET /api/resources`                 | ✅    | ✅        | ❌        | ❌      |
| `POST /api/resources`                | ✅    | ✅        | ❌        | ❌      |
| `PUT /api/resources/{id}`            | ✅    | ✅        | ❌        | ❌      |
| `DELETE /api/resources/{id}`         | ✅    | ✅        | ❌        | ❌      |
| `GET /api/hospitals`                 | ✅    | ✅        | ❌        | ❌      |
| `GET /api/admin/users`               | ✅    | ❌        | ❌        | ❌      |
| `PUT /api/admin/users/{id}/activate` | ✅    | ❌        | ❌        | ❌      |

---

## 🔄 Frontend Integration

### Update Login Component

```javascript
import { useState } from "react";
import { authService } from "../services/authService";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await authService.login({ email, password });

      // Save user and token
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));

      // Redirect based on role
      switch (response.user.role) {
        case "admin":
          navigate("/admin/dashboard");
          break;
        case "logistics":
          navigate("/logistics/dashboard");
          break;
        case "responder":
          navigate("/responder/dashboard");
          break;
        case "patient":
          navigate("/patient/dashboard");
          break;
        default:
          navigate("/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <form onSubmit={handleLogin}>
      {error && <div className="error">{error}</div>}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit">Login</button>
    </form>
  );
}
```

### Quick Test Buttons

```javascript
function QuickLoginButtons() {
  const handleQuickLogin = async (email) => {
    try {
      const response = await authService.login({
        email,
        password: "password123",
      });
      console.log("Logged in as:", response.user.role);
      // Redirect as needed
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  return (
    <div>
      <h3>Quick Login (For Testing)</h3>
      <button onClick={() => handleQuickLogin("admin@kalinga.com")}>
        Login as Admin
      </button>
      <button onClick={() => handleQuickLogin("logistics@kalinga.com")}>
        Login as Logistics
      </button>
      <button onClick={() => handleQuickLogin("responder@kalinga.com")}>
        Login as Responder
      </button>
      <button onClick={() => handleQuickLogin("patient@kalinga.com")}>
        Login as Patient
      </button>
    </div>
  );
}
```

---

## ✅ What's Working Now

1. ✅ **Authentication System** - Login, register, logout
2. ✅ **JWT Token Generation** - Sanctum tokens
3. ✅ **Role-Based Middleware** - Custom CheckRole middleware
4. ✅ **5 Test Users** - Different roles for testing
5. ✅ **Protected Routes** - Auth required endpoints
6. ✅ **Role-Restricted Routes** - Role-based access control
7. ✅ **Admin Endpoints** - User management
8. ✅ **Proper Error Messages** - 401, 403 with details

---

## 🎯 Next Steps

1. Test login with all 5 users
2. Test role-based access restrictions
3. Integrate with frontend login page
4. Add role-based UI component visibility
5. Test token expiration handling

---

## 🐛 Troubleshooting

### Token not working?

- Check if token is in `Authorization: Bearer TOKEN` format
- Verify token hasn't expired
- Check if user is active (`is_active = true`)

### 403 Forbidden?

- Check user role matches route requirements
- Verify middleware is applied correctly
- Check route definition in `routes/api.php`

### 401 Unauthorized?

- Token might be missing or invalid
- User might not be logged in
- Token might be expired

---

## 🎉 Ready to Test!

All authentication and role-based access control is now implemented and ready for testing!
