# Travel Tracker API - Lab 7

## Overview
REST API for managing travel destinations with JWT-based authentication, role-based access control, and full CRUD operations.

## Features
✅ **JWT Authentication** - Secure token-based access with 1-minute expiration
✅ **Role-Based Access Control** - ADMIN, WRITER, VISITOR roles
✅ **CRUD Operations** - Create, Read, Update, Delete destinations
✅ **Pagination** - Handle large datasets with limit/page parameters
✅ **Swagger Documentation** - Interactive API docs at `/docs`
✅ **Proper HTTP Status Codes** - 200, 201, 400, 401, 403, 404, 500
✅ **CORS Enabled** - Frontend integration ready

## Installation

```bash
cd server
npm install
```

## Running the Server

```bash
npm start
```

Server will run on **http://localhost:5000**
Swagger docs available at **http://localhost:5000/docs**

## API Endpoints

### Authentication

#### POST `/token`
Generate JWT token for API access

**Request:**
```json
{
  "role": "ADMIN" | "WRITER" | "VISITOR"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Roles & Permissions:**
- **ADMIN**: READ, WRITE, DELETE
- **WRITER**: READ, WRITE
- **VISITOR**: READ

**Token Expiration:** 1 minute (demo setting)

---

### Destinations

#### GET `/destinations`
Retrieve paginated list of destinations

**Query Parameters:**
- `page` (default: 1) - Page number
- `limit` (default: 6) - Items per page

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Tokyo",
      "country": "Japan",
      "category": "City",
      "rating": 5,
      "visited": false,
      "notes": "Visit Akihabara",
      "lat": 35.6764,
      "lng": 139.65,
      "image": "https://..."
    }
  ],
  "total": 2,
  "page": 1
}
```

**Status Codes:**
- 200 - Success
- 401 - Missing/Invalid token
- 403 - Insufficient permissions

---

#### POST `/destinations`
Create a new destination

**Required Permission:** WRITE

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "string (required)",
  "country": "string (required)",
  "lat": "number (required)",
  "lng": "number (required)",
  "category": "string (optional)",
  "rating": "number 1-5 (optional, default: 3)",
  "visited": "boolean (optional, default: false)",
  "notes": "string (optional)",
  "image": "string (optional)"
}
```

**Response (201):**
```json
{
  "id": 1234567890,
  "name": "Tokyo",
  "country": "Japan",
  "category": "City",
  "rating": 5,
  "visited": false,
  "notes": "Visit Akihabara",
  "lat": 35.6764,
  "lng": 139.65,
  "image": "https://..."
}
```

**Status Codes:**
- 201 - Created
- 400 - Missing required fields
- 401 - Missing/Invalid token
- 403 - Insufficient permissions

---

#### PUT `/destinations/{id}`
Update an existing destination

**Required Permission:** WRITE

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "string (optional)",
  "country": "string (optional)",
  "category": "string (optional)",
  "rating": "number (optional)",
  "visited": "boolean (optional)",
  "notes": "string (optional)",
  "lat": "number (optional)",
  "lng": "number (optional)",
  "image": "string (optional)"
}
```

**Response (200):**
```json
{
  "message": "Updated successfully",
  "data": { ... }
}
```

**Status Codes:**
- 200 - Updated
- 404 - Destination not found
- 401 - Missing/Invalid token
- 403 - Insufficient permissions

---

#### DELETE `/destinations/{id}`
Delete a destination

**Required Permission:** DELETE

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "Deleted successfully"
}
```

**Status Codes:**
- 200 - Deleted
- 404 - Destination not found
- 401 - Missing/Invalid token
- 403 - Insufficient permissions

---

### Health Check

#### GET `/health`
Check if API is running

**Response (200):**
```json
{
  "status": "ok"
}
```

---

## Testing with cURL

### Get Token
```bash
curl -X POST http://localhost:5000/token \
  -H "Content-Type: application/json" \
  -d '{"role":"ADMIN"}'
```

### Get Destinations
```bash
curl -H "Authorization: Bearer {token}" \
  http://localhost:5000/destinations?page=1&limit=6
```

### Create Destination
```bash
curl -X POST http://localhost:5000/destinations \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Paris",
    "country": "France",
    "lat": 48.8566,
    "lng": 2.3522,
    "rating": 5,
    "notes": "City of Light"
  }'
```

### Update Destination
```bash
curl -X PUT http://localhost:5000/destinations/1 \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"visited": true}'
```

### Delete Destination
```bash
curl -X DELETE http://localhost:5000/destinations/1 \
  -H "Authorization: Bearer {token}"
```

---

## Frontend Integration

The frontend (React app) is configured to connect to this API.

**Environment Variable:**
```
VITE_API=http://localhost:5000
```

**Example Frontend Usage:**
```javascript
const token = localStorage.getItem('token')

// Get destinations
const res = await fetch(`${API}/destinations?page=1&limit=6`, {
  headers: { Authorization: `Bearer ${token}` }
})

// Create destination
await fetch(`${API}/destinations`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  },
  body: JSON.stringify({ name: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522 })
})
```

---

## Database

Currently using **file-based storage**(destinations.json). Data persists across server restarts.

---

## Security Notes

⚠️ **For Production:**
- Replace `super_secret_key` with strong secret
- Use HTTPS instead of HTTP
- Implement rate limiting
- Add input validation
- Use environment variables for sensitive data
- Implement refresh token rotation
- Add CSRF protection

---

## Swagger Documentation

Access interactive API documentation at:
**http://localhost:5000/docs**

All endpoints are documented with request/response examples.

---

## Status Codes Reference

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing/Invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 500 | Server Error |

---

## Troubleshooting

**Token Expired Error:**
- Tokens expire after 1 minute. Get a new token from `/token` endpoint

**CORS Error:**
- Ensure server is running on port 5000
- Check VITE_API environment variable in frontend

**401 Unauthorized:**
- Verify token is included in Authorization header
- Format: `Authorization: Bearer {token}`

**403 Forbidden:**
- Check user role has required permission for operation
- ADMIN has all permissions
- WRITER has READ, WRITE
- VISITOR has READ only

---

## Lab 7 Requirements Checklist

✅ CRUD API for entities
✅ JWT authentication with permissions/roles
✅ JWT expiration (1 minute for demo)
✅ Frontend integration
✅ Swagger documentation
✅ Appropriate HTTP status codes
✅ Pagination support (limit, page)
✅ `/token` endpoint
✅ Fully integrated with frontend

