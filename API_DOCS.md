# API Documentation

## Base URL
- Local: `http://localhost:3000`
- Production: `https://your-domain.vercel.app`

## Authentication

All endpoints except `/api/auth/signup` and `/api/auth/login` require authentication via session cookie named `sessionId`. This cookie is automatically set after login/signup.

---

## Auth Endpoints

### Signup
Create a new user account.

**Endpoint:** `POST /api/auth/signup`

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "securepassword123"
}
```

**Success Response (201):**
```json
{
  "message": "User created successfully",
  "userId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Cookie Set:**
```
sessionId=<SESSION_ID>; Path=/; HttpOnly; Max-Age=2592000
```

**Error Responses:**
- `400`: Username and password required
- `400`: User already exists
- `500`: Internal server error

---

### Login
Authenticate an existing user.

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "securepassword123"
}
```

**Success Response (200):**
```json
{
  "message": "Login successful",
  "userId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Cookie Set:**
```
sessionId=<SESSION_ID>; Path=/; HttpOnly; Max-Age=2592000
```

**Error Responses:**
- `400`: Username and password required
- `401`: Invalid username or password
- `500`: Internal server error

---

### Logout
End the user session.

**Endpoint:** `POST /api/auth/logout`

**Request Body:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Success Response (200):**
```json
{
  "message": "Logout successful"
}
```

**Cookie Cleared:**
```
sessionId=; Path=/; HttpOnly; Max-Age=0
```

---

## Check-in Endpoints

### Get Check-ins
Retrieve all check-ins for the authenticated user.

**Endpoint:** `GET /api/checkins`

**Headers:**
```
Cookie: sessionId=<SESSION_ID>
```

**Success Response (200):**
```json
{
  "checkins": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "number": 1,
      "isCompleted": true,
      "isUnlocked": true,
      "completedAt": "2026-04-08T10:30:00.000Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "number": 2,
      "isCompleted": false,
      "isUnlocked": true,
      "completedAt": null
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440003",
      "number": 3,
      "isCompleted": false,
      "isUnlocked": false,
      "completedAt": null
    }
  ]
}
```

**Error Responses:**
- `401`: Not authenticated (missing sessionId)
- `401`: Session expired
- `500`: Internal server error

---

### Submit Check-in
Submit responses for a specific check-in. Automatically marks as completed and unlocks the next check-in.

**Endpoint:** `POST /api/checkin-submit`

**Headers:**
```
Cookie: sessionId=<SESSION_ID>
Content-Type: application/json
```

**Request Body:**
```json
{
  "checkinId": "550e8400-e29b-41d4-a716-446655440001",
  "data": {
    "submittedAt": "2026-04-08T10:30:00.000Z",
    "answers": [
      {
        "question": "How are you feeling today?",
        "answer": "Okay"
      },
      {
        "question": "Any concerns?",
        "answer": "Mild anxiety"
      }
    ],
    "audioUrl": "https://s3.amazonaws.com/bucket/checkins/audio123.wav"
  }
}
```

**Success Response (200):**
```json
{
  "message": "Check-in submitted successfully",
  "dataId": "550e8400-e29b-41d4-a716-446655440099"
}
```

**Side Effects:**
- Check-in marked as `is_completed = true`
- `completed_at` timestamp set to NOW()
- Next check-in's `unlocked_at` set to 3 days from now
- Data stored in `checkins_data` table

**Error Responses:**
- `401`: Not authenticated
- `401`: Session expired
- `403`: Check-in not yet unlocked
- `404`: Check-in not found
- `500`: Internal server error

---

## Data Models

### User
```javascript
{
  id: string,           // UUID
  username: string,     // Unique
  password_hash: string,// Bcrypt hashed
  created_at: datetime
}
```

### Session
```javascript
{
  id: string,           // UUID
  user_id: string,      // Foreign key
  created_at: datetime,
  expires_at: datetime  // 30 days from creation
}
```

### Checkin
```javascript
{
  id: string,           // UUID
  user_id: string,      // Foreign key
  checkin_number: int,  // 1, 2, or 3
  is_completed: boolean,
  unlocked_at: datetime,
  completed_at: datetime | null,
  created_at: datetime
}
```

### CheckinData
```javascript
{
  id: string,           // UUID
  checkin_id: string,   // Foreign key
  user_id: string,      // Foreign key
  data: json,           // Survey responses
  audio_url: string | null,
  created_at: datetime
}
```

---

## Example Client Usage

### React/JavaScript

```javascript
// Signup
const signupRes = await fetch('/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'john', password: 'pass123' })
});

// Get check-ins
const checkinsRes = await fetch('/api/checkins');
const { checkins } = await checkinsRes.json();

// Submit check-in
const submitRes = await fetch('/api/checkin-submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    checkinId: checkins[0].id,
    data: { answers: [...] }
  })
});
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad request (invalid data) |
| 401 | Unauthorized (auth required) |
| 403 | Forbidden (access denied) |
| 404 | Not found |
| 405 | Method not allowed |
| 500 | Server error |

---

## Rate Limiting

Currently not implemented. For production, add:
- 5 login attempts per IP per hour
- 10 check-in submissions per user per day
- General API rate limiting

---

## CORS

Currently, same-origin only. To enable CORS for APIs called from different domain:

```javascript
// In API route
res.setHeader('Access-Control-Allow-Origin', 'https://your-domain.com');
```

---

## Future Enhancements

- [ ] Email verification for signup
- [ ] Password reset endpoint
- [ ] Admin dashboard API
- [ ] Analytics endpoints
- [ ] Bulk data export
- [ ] File upload endpoints
- [ ] WebSocket for real-time updates
