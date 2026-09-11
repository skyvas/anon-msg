# AnonMsg: Anonymous & Transparent Social Messaging Platform

AnonMsg is a modern social messaging platform built with React 19, Express, and PostgreSQL. It empowers community members to collect candid feedback, constructive thoughts, confessions, and inquiries through an inviting question prompt. Visitors can choose to send notes completely anonymously or transparently attach their identity.

---

## Key Features

- **Anonymous and Signed Messaging**: Visitors can post thoughts with total anonymity by default or choose to sign with their identity via a transparent toggle.
- **Member Directory and Prompts**: Explore available community members, each displaying their custom question prompt and typographic initials badge.
- **Recipient Inbox Dashboard**: Authenticated members receive a personal dashboard to browse incoming notes, filter by anonymity or status, star favorites, and manage messages.
- **No Default Recipient Selection**: Visitors arrive at an exploratory directory and must actively select a member before composing, with the option to change recipients on the fly.
- **Typographic Initials Avatars**: Completely photo-free design utilizing deterministic gradients and high-contrast typographic initials.
- **Customizable Profile & Prompts**: Members can adjust their display name, custom question prompt, and bio with live character counters.
- **Obsidian Dark Glassmorphism**: Tailored design system with rich glass panels, dark gradients, responsive layouts, and zero external CSS utility bloat.
- **Security-First Architecture**: Hardened against OWASP Top 10 vulnerabilities, featuring atomic SQL authorization against IDOR, sliding rate limiting, timing-attack mitigation, and IP address redaction.
- **Edge Deployment Ready**: Packaged for containerized execution and edge deployment via Wasmer.

---

## Architecture Overview

```mermaid
flowchart TD
    Client["React 19 Frontend (Vite + Vanilla CSS)"]
    API["Express REST API (Port 3001)"]
    DB[("PostgreSQL Database (localhost:5432/anon_msg)")]
    Edge["Wasmer Edge Runtime (Dockerfile + wasmer.toml)"]

    Client -->|HTTP / JSON Requests| API
    API -->|pg Pool Queries| DB
    Edge -->|Hosts Production Bundle| Client
    Edge -->|Executes Server Process| API
```

### Database Schema (PostgreSQL)

- **`users`**: `id` (SERIAL PRIMARY KEY), `username` (VARCHAR UNIQUE), `display_name` (VARCHAR), `password_hash` (VARCHAR), `bio` (TEXT), `prompt` (TEXT), `is_available` (BOOLEAN), `created_at` (TIMESTAMPTZ)
- **`messages`**: `id` (SERIAL PRIMARY KEY), `recipient_id` (INTEGER REFERENCES users), `content` (TEXT), `is_anonymous` (BOOLEAN), `sender_name` (VARCHAR), `is_read` (BOOLEAN), `is_favorite` (BOOLEAN), `ip_hash` (VARCHAR), `created_at` (TIMESTAMPTZ)

---

## Security & Penetration Testing

AnonMsg incorporates comprehensive application security standards audited by automated penetration suites:

1. **Information Disclosure & Clickjacking Protection**:
   - Express fingerprinting disabled (`x-powered-by`).
   - Standard security headers enforced (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin`).
2. **SQL Injection Resistance**:
   - 100% parameterized SQL statements across all queries.
3. **Stored Cross-Site Scripting (XSS) Sanitization**:
   - Strips HTML and script tags from message content and sender names prior to persistence.
4. **Insecure Direct Object Reference (IDOR) Defense**:
   - Message status modifications (`/read`, `/favorite`, `/delete`) enforce atomic SQL isolation: `WHERE id = $1 AND recipient_id = $2`. Non-owners receive an authenticated `404 Not Found`.
5. **Timing-Attack & Username Enumeration Mitigation**:
   - Constant-time dummy hash comparison is executed when a queried username does not exist.
6. **Denial-of-Service (DoS) & Brute Force Prevention**:
   - JSON request body limited to 64kb.
   - Sliding in-memory rate limiter on failed logins and message submissions.
   - Password policy requiring 8 to 128 characters and rejecting whitespace-only inputs.
7. **Privacy & Anonymity Shield**:
   - IP hash information is strictly stripped from recipient inbox API responses.

---

## Automated Test Suites

AnonMsg includes automated test suites for both API contracts and penetration testing:

```bash
# Run both test suites
npm test

# Run API contract suite
npm run test:api

# Run security penetration suite
npm run test:security
```

### Verification Status

- **API Contract Suite** (`npm run test:api`): **15 / 15 Passed (100%)**
- **Security Penetration Suite** (`npm run test:security`): **17 / 17 Passed (100%)**
- **Zero Emoji Compliance**: **0 Unicode emojis across all source files and documentation**

---

## Continuous Integration (CI) Pipeline

The project includes an automated GitHub Actions testing pipeline located at `.github/workflows/ci.yml`:

- **Pull Requests and Main Branch**: Automatically spins up an ephemeral PostgreSQL 15 service container, installs dependencies, builds the production client, and runs all test suites (`npm run test:api`, `npm run test:security`, and `npm run test:wasmer`).
- **Wasmer Edge Deployment**: Handled automatically by Wasmer pulling directly from the `main` branch origin upon commit, packaging `wasmer.toml`, `main.py`, and `dist/`.

---

## Local Development Setup

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)

### Setup Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/skyvas/anon-msg.git
   cd anon-msg
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment:
   ```bash
   export DATABASE_URL="postgres://postgres:password@localhost:5432/anon_msg"
   export JWT_SECRET="your-secure-jwt-secret-key"
   export PORT=3001
   ```

4. Launch development servers (Vite client + Express API):
   ```bash
   npm run dev
   ```

5. Access the application:
   - Frontend: `http://localhost:3000` (or Vite assigned port)
   - Backend API: `http://localhost:3001`

---

## Deployment with Wasmer

AnonMsg is packaged with `wasmer.toml` and a multi-stage `Dockerfile`:

```bash
# Login to Wasmer
wasmer login

# Deploy application
wasmer deploy
```

---

## License

MIT License. See LICENSE for details.
