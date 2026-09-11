# AnonMsg

AnonMsg is an anonymous and transparent social messaging platform built with React, Express, and PostgreSQL. It enables visitors to send feedback, confessions, and inquiries to platform members with the choice of remaining strictly anonymous or signing with their chosen name.

---

## Key Features

- **Anonymous and Named Messaging**: Visitors can send thoughts anonymously by default or optionally reveal their name with a dedicated toggle.
- **Member Directory and Prompts**: Explore available community members, each displaying their custom question prompt and typographic initials badge.
- **Recipient Inbox Dashboard**: Authenticated members receive a personal dashboard to browse incoming notes, filter by anonymity or status, star favorites, and manage messages.
- **Security-First Architecture**: Fully hardened against OWASP Top 10 vulnerabilities, featuring atomic SQL authorization against IDOR, sliding rate limiting, timing-attack mitigation, and IP address redaction.
- **Obsidian Dark Glassmorphism**: Responsive design system engineered for high visual appeal across mobile, tablet, and desktop viewports.
- **Edge Deployment Ready**: Packaged for containerized execution and edge deployment via Wasmer.

---

## Quickstart

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment:
   ```bash
   export DATABASE_URL="postgres://postgres:password@localhost:5432/anon_msg"
   export JWT_SECRET="your-secure-jwt-secret-key"
   export PORT=3001
   ```

3. Run the development environment:
   ```bash
   npm run dev
   ```

4. Run tests:
   ```bash
   npm run test:api
   npm run test:security
   ```

---

## License

MIT License. See LICENSE for details.
