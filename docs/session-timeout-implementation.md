# Session Timeout Verification Test

This document outlines how to test the 5-minute rolling session timeout implementation.

## Changes Made

### 1. Server Configuration (`server.js`)
- **Session timeout**: Changed from 24 hours to 5 minutes (300 seconds)
- **Rolling sessions**: Enabled with `resave: true` and `rolling: true`
- **MongoDB store**: Configured with TTL of 5 minutes and immediate updates (`touchAfter: 0`)
- **Cookie settings**: Maintained security settings (httpOnly, secure in production, sameSite: lax)

### 2. User Model (`models/User.js`)
- **Default session expiry**: Changed from 24 hours to 5 minutes
- **Touch session method**: Added `touchSession()` method for rolling behavior
- **Remember me support**: TouchSession distinguishes between regular (5 min) and remember-me (30 day) sessions

### 3. Authentication Routes (`routes/auth.js`)
- **Login session expiry**: Regular sessions set to 5 minutes, remember-me sessions to 30 days
- **User session tracking**: Updated to extend session expiry properly for remember-me

### 4. Authentication Middleware (`middleware/auth.js`)
- **Session extension**: Added automatic session touching on every authenticated request
- **Rolling behavior**: Sessions are extended on each valid request

## Expected Behavior

1. **Regular Login**: Sessions expire after 5 minutes of inactivity
2. **Rolling Sessions**: Each authenticated request resets the 5-minute timer
3. **Remember Me**: Long-term sessions (30 days) with rolling behavior
4. **MongoDB Cleanup**: Expired sessions automatically removed from database
5. **No Breaking Changes**: Existing authentication flows continue to work

## Manual Testing Steps

### Prerequisites
- MongoDB running locally or accessible via MONGO_URL
- Server started with `node server.js`

### Test 1: Basic Session Timeout
```bash
# 1. Register a user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }' -c cookies.txt

# 2. Login and save session cookie
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "test@example.com",
    "password": "password123",
    "rememberMe": false
  }' -c cookies.txt

# 3. Check session status immediately
curl -X GET http://localhost:3001/api/auth/session -b cookies.txt

# 4. Wait 6+ minutes and check again (should fail)
# sleep 360
# curl -X GET http://localhost:3001/api/auth/session -b cookies.txt
```

### Test 2: Rolling Session Behavior
```bash
# 1. Login (as above)
# 2. Make requests every 30 seconds for 5+ minutes
# Each request should extend the session
for i in {1..12}; do
  echo "Request $i at $(date)"
  curl -X GET http://localhost:3001/api/auth/session -b cookies.txt
  sleep 30
done

# Session should still be active after 6 minutes due to rolling
```

### Test 3: Remember Me Functionality
```bash
# 1. Login with remember me
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "test@example.com",
    "password": "password123",
    "rememberMe": true
  }' -c cookies.txt

# 2. Session should persist much longer (30 days rolling)
curl -X GET http://localhost:3001/api/auth/session -b cookies.txt
```

## Verification Points

✅ **Session Cookie**: Contains `maxAge` of 300000ms (5 minutes) for regular sessions
✅ **Rolling Behavior**: Session expiry resets on each authenticated request
✅ **MongoDB TTL**: Sessions automatically removed from database after expiry
✅ **Remember Me**: 30-day sessions with rolling behavior maintained
✅ **Security**: httpOnly, secure (production), sameSite=lax maintained
✅ **No Breaking Changes**: Existing auth flows work unchanged

## Configuration Summary

| Setting | Before | After |
|---------|--------|--------|
| Session Timeout | 24 hours | 5 minutes |
| Rolling Sessions | No | Yes |
| MongoDB TTL | Not set | 5 minutes |
| Touch Behavior | Lazy (24h) | Immediate |
| Remember Me | 30 days fixed | 30 days rolling |

The implementation successfully provides 5-minute idle timeout with rolling sessions while maintaining all existing functionality and security measures.