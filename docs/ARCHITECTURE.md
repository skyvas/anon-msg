# System Architecture & Technical Specification
## Anonymous Messaging Platform ("AnonMsg")
**Author**: `cs-engineering-lead` & `cs-backend-engineer`  
**Version**: 1.0.0

---

## 1. Architecture Overview

AnonMsg is structured as a client-server web application utilizing an embedded SQLite relational database for rapid, zero-friction persistence and clean separation of concerns.

```
┌──────────────────────────────────────────────────────────────┐
│                       Client (React)                         │
│  ┌─────────────────┬───────────────────┬──────────────────┐  │
│  │ User Directory  │   Message Modal   │  Inbox Dashboard │  │
│  │  (Profile Tabs) │  (Anon / Named)   │ (Filters & Cards)│  │
│  └────────┬────────┴─────────┬─────────┴─────────┬────────┘  │
└───────────┼──────────────────┼───────────────────┼───────────┘
            │ HTTP / JSON REST │                   │
┌───────────▼──────────────────▼───────────────────▼───────────┐
│                    API Server (Express)                      │
│  ┌───────────────────────┬────────────────────────────────┐  │
│  │     Public Routes     │     Protected Inbox Routes     │  │
│  │  • GET  /api/users    │  • GET    /api/inbox           │  │
│  │  • POST /api/messages │  • PATCH  /api/inbox/:id/read  │  │
│  │  • POST /api/auth/*   │  • DELETE /api/inbox/:id       │  │
│  └───────────┬───────────┴────────────────┬───────────────┘  │
│              │ Auth Middleware & Limiter  │                  │
└──────────────┼────────────────────────────┼──────────────────┘
               ▼                            ▼
┌──────────────────────────────────────────────────────────────┐
│                    SQLite Database                           │
│     [users table]         [messages table]                   │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Database Schema

The database uses SQLite with WAL (Write-Ahead Logging) mode enabled for high-concurrency read/write operations.

```sql
-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL COLLATE NOCASE,
    display_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    prompt TEXT DEFAULT 'Send me an anonymous message!',
    is_available INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipient_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    is_anonymous INTEGER NOT NULL DEFAULT 1,
    sender_name TEXT,
    is_read INTEGER DEFAULT 0,
    is_favorite INTEGER DEFAULT 0,
    ip_hash TEXT, -- Stored solely for rate-limit & anti-abuse checks, never exposed to recipient
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(recipient_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indices for query performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id, created_at DESC);
```

---

## 3. API Contract & Endpoints

### 3.1 Public User & Profile Routes
- **`GET /api/users`**
  - Response: Array of `{ id, username, display_name, avatar_url, bio, prompt, is_available, message_count }`
- **`GET /api/users/:username`**
  - Response: Single user profile object or 404 if not found.

### 3.2 Message Transmission
- **`POST /api/messages`**
  - Request Body:
    ```json
    {
      "recipient_id": 1,
      "content": "Hey! Loved your latest project.",
      "is_anonymous": true,
      "sender_name": null
    }
    ```
  - Validation:
    - Content non-empty, length between 1 and 500 characters.
    - If `is_anonymous === true`, `sender_name` is forced to `null`.
    - If `is_anonymous === false`, `sender_name` trimmed to max 50 characters (fallback: "Anonymous").
  - Response: `{ "success": true, "message_id": 42 }`

### 3.3 Authentication Endpoints
- **`POST /api/auth/register`**
  - Request: `{ "username": "alex", "display_name": "Alex Rivers", "password": "...", "bio": "...", "prompt": "..." }`
  - Response: `{ "token": "...", "user": { "id": 1, "username": "alex", ... } }`
- **`POST /api/auth/login`**
  - Request: `{ "username": "alex", "password": "..." }`
  - Response: `{ "token": "...", "user": { ... } }`
- **`GET /api/auth/me`**
  - Header: `Authorization: Bearer <token>`
  - Response: `{ "user": { ... } }`

### 3.4 Recipient Inbox Endpoints (Authenticated)
- **`GET /api/inbox`**
  - Header: `Authorization: Bearer <token>`
  - Response:
    ```json
    {
      "messages": [
        {
          "id": 1,
          "content": "Keep up the great work!",
          "is_anonymous": true,
          "sender_name": null,
          "is_read": false,
          "is_favorite": false,
          "created_at": "2026-09-10T19:30:00Z"
        }
      ],
      "stats": {
        "total": 12,
        "unread": 3,
        "anonymous_count": 9,
        "named_count": 3
      }
    }
    ```
- **`PATCH /api/inbox/:id/read`**: Toggles or marks message as read.
- **`PATCH /api/inbox/:id/favorite`**: Toggles favorite status.
- **`DELETE /api/inbox/:id`**: Permanently removes message from recipient's inbox.

---

## 4. Security & Privacy Architecture

1. **True Anonymity Guarantees**:
   - The recipient's inbox endpoint explicitly suppresses any network identifiers (`ip_hash`, user agent).
   - Only `content`, `is_anonymous`, `sender_name`, `created_at`, `is_read`, and `is_favorite` are serialized to the client.
2. **Abuse Prevention & Rate Limiting**:
   - In-memory / hashed sliding-window rate limiter on `POST /api/messages`:
     - Max 5 messages per 60 seconds per IP.
     - Cooldown period on violations.
3. **Password Security**:
   - Minimum 6 characters.
   - Hashed using `bcryptjs` with salt round 10.
4. **Session Management**:
   - Signed JWTs with user id and expiration.
