# 🔒 Security Implementation Guide

## Overview
This document outlines the security measures implemented in the Kalinga Healthcare Application.

## ✅ Security Features Implemented

### 1. **CORS Protection**
- ✅ Restricted origins to specific domains
- ✅ Limited allowed methods
- ✅ Specific allowed headers only
- ✅ Credentials support enabled for cookie-based auth

**Configuration:** `backend/config/cors.php`

```php
'allowed_origins' => [
    env('FRONTEND_URL', 'http://localhost:5173'),
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
],
'supports_credentials' => true,
```

### 2. **CSRF Protection**
- ✅ Laravel Sanctum CSRF cookie implementation
- ✅ Automatic CSRF token refresh
- ✅ Token included in all state-changing requests
- ✅ 419 error handling with automatic retry

**Frontend Implementation:** `src/services/api.js`
- CSRF cookie fetched before authentication
- Token automatically added to requests
- Automatic retry on token mismatch

### 3. **Rate Limiting**

#### API Endpoints Rate Limits:
- **Authentication endpoints**: 10 requests/minute per IP
- **Public endpoints**: 60 requests/minute per IP
- **Authenticated API**: 120 requests/minute per user
- **Sensitive operations**: 5 requests/minute per user

**Configuration:** `backend/app/Providers/RateLimitServiceProvider.php`

### 4. **Secure Cookie Configuration**
- ✅ HttpOnly cookies enabled (prevents XSS)
- ✅ SameSite: Lax (CSRF protection)
- ✅ Secure flag for production (HTTPS only)
- ✅ Domain-specific cookies

**Configuration:** `backend/config/session.php`

### 5. **Token Storage**
- ✅ Primary: HttpOnly cookies (XSS-safe)
- ✅ Fallback: Bearer tokens for external clients
- ✅ Automatic token cleanup on logout

### 6. **Authentication Security**
- ✅ Laravel Sanctum SPA authentication
- ✅ Stateful authentication for web
- ✅ Token-based for mobile/external
- ✅ Automatic session management

## 🚀 Production Deployment Checklist

### Backend (.env)
```env
APP_ENV=production
APP_DEBUG=false
SESSION_SECURE_COOKIE=true  # Force HTTPS
SESSION_SAME_SITE=lax
SANCTUM_STATEFUL_DOMAINS=yourdomain.com,www.yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

### CORS (config/cors.php)
```php
'allowed_origins' => [
    'https://yourdomain.com',
    'https://www.yourdomain.com',
],
```

### SSL/TLS
- ✅ Use HTTPS in production
- ✅ Enable HSTS headers
- ✅ Set SESSION_SECURE_COOKIE=true

## 🛡️ Security Best Practices

### 1. **Input Validation**
Always validate and sanitize user inputs in controllers:
```php
$request->validate([
    'email' => 'required|email|max:255',
    'password' => 'required|min:8',
]);
```

### 2. **SQL Injection Prevention**
- ✅ Use Eloquent ORM (automatic protection)
- ✅ Use parameterized queries
- ❌ Never use raw SQL with user input

### 3. **XSS Prevention**
- ✅ HttpOnly cookies (implemented)
- ✅ Sanitize output in frontend
- ✅ Content Security Policy (CSP) recommended

### 4. **CSRF Prevention**
- ✅ CSRF tokens on all state-changing requests
- ✅ SameSite cookie attribute
- ✅ Origin validation

### 5. **Authentication**
- ✅ Strong password requirements
- ✅ Password hashing (bcrypt)
- ✅ Account lockout on failed attempts (rate limiting)
- ✅ Session timeout

## 🔍 Monitoring & Logging

### What to Monitor:
1. Failed authentication attempts
2. Rate limit violations
3. CSRF token mismatches
4. Unauthorized access attempts
5. API abuse patterns

### Laravel Logs:
```bash
tail -f storage/logs/laravel.log
```

## 🚨 Rate Limit Error Handling

### Frontend Handling:
The API service automatically handles 429 responses:
```javascript
if (error.response?.status === 429) {
  const retryAfter = error.response.headers["retry-after"];
  console.error(`Rate limit exceeded. Retry after ${retryAfter} seconds.`);
}
```

### User Experience:
- Show friendly error messages
- Display retry countdown
- Implement exponential backoff

## 📊 Testing Security

### Test CORS:
```bash
curl -H "Origin: https://malicious-site.com" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS http://localhost:8000/api/login
```

### Test Rate Limiting:
```bash
# Should fail after 10 attempts
for i in {1..15}; do
  curl -X POST http://localhost:8000/api/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done
```

### Test CSRF:
```bash
# Should fail without CSRF token
curl -X POST http://localhost:8000/api/profile \
  -H "Authorization: Bearer <token>"
```

## 🔄 Migration from Old System

### If you were using localStorage tokens:
1. ✅ CSRF protection now active
2. ✅ Cookies used for authentication
3. ✅ Old tokens still supported as fallback
4. ⚠️ Users may need to re-login once

### Breaking Changes:
- `withCredentials: true` required in API calls
- CSRF cookie must be fetched before auth
- Rate limits now enforced

## 📚 Additional Resources

- [Laravel Sanctum Documentation](https://laravel.com/docs/sanctum)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CORS Best Practices](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

## 🆘 Troubleshooting

### CORS Errors:
1. Check frontend URL in `FRONTEND_URL` env
2. Verify `withCredentials: true` in axios
3. Check browser console for specific error

### CSRF Token Mismatch:
1. Clear cookies
2. Refresh CSRF cookie
3. Check session driver configuration

### Rate Limit Issues:
1. Check IP address (proxies/load balancers)
2. Adjust limits in RateLimitServiceProvider
3. Use Redis for distributed rate limiting

## 📝 Notes

- Development: `SESSION_SECURE_COOKIE=false` (HTTP allowed)
- Production: `SESSION_SECURE_COOKIE=true` (HTTPS only)
- Always use environment variables for sensitive config
- Regular security audits recommended
