# API Test Lab  Admin Panel

Secure admin dashboard for managing users, plans, billing, activity, and analytics.

Built with **Create React App** (not Vite), **Tailwind CSS**, **React Router**, and **axios**.

## Features

- **OTP-secured admin login** (email + password, then 6-digit code)
- **Dashboard**  users, tests, traffic stats
- **Users**  search, filter, create, edit, change plan, activate/deactivate, delete
- **Activity**  API requests, user activity, admin audit log, admin login sessions (IP tracked)
- **Billing**  Freemius snapshot + per-user timeline
- **Analytics**  user growth chart

## Prerequisites

- Node.js 18+
- Running FastAPI backend (`backend/`) on port 8000
- MongoDB
- Admin user with `is_admin: true` in the database
- SMTP configured on backend for OTP emails (or check server logs in dev)

## Setup

```bash
cd adminpanel
cp .env.example .env
npm install
npm start
```

App runs at [http://localhost:3000](http://localhost:3000).

### Environment

| Variable | Description |
|----------|-------------|
| `REACT_APP_API_URL` | Backend URL (default dev proxy: `http://127.0.0.1:8000`) |

In development, `package.json` includes `"proxy": "http://127.0.0.1:8000"` so API calls work without CORS issues when `REACT_APP_API_URL` is empty.

Add your admin panel origin to backend `ALLOWED_ORIGINS` in production.

## Create an admin user

**Option A  MongoDB shell**

```js
db.users.updateOne(
  { email: "you@example.com" },
  { $set: { is_admin: true } }
)
```

**Option B  Create via API** (if you already have an admin)

`POST /api/admin/users` with `is_admin: true`.

## Login flow

1. Enter admin email + password → `POST /api/admin/auth/login`
2. Backend verifies credentials + `is_admin`, sends OTP, logs IP
3. Enter 6-digit OTP → `POST /api/admin/auth/verify-otp`
4. Receive JWT access + refresh tokens; panel stores them in `localStorage`

## Build for production

```bash
npm run build
```

Serve the `build/` folder behind HTTPS. Point `REACT_APP_API_URL` at your production API.

## Security notes

- Only users with `is_admin: true` can log in
- OTP required on every admin login (10 min expiry, 5 attempts max)
- All admin login attempts logged with IP and user-agent (`admin_login_sessions`)
- Admin actions written to `admin_audit`
- JWT refresh + logout revokes tokens
- Cannot delete the last admin or your own account while logged in

## API routes used

| Area | Endpoints |
|------|-----------|
| Auth | `/api/admin/auth/login`, `/api/admin/auth/verify-otp`, `/api/auth/refresh`, `/api/auth/logout`, `/api/auth/me` |
| Admin | `/api/admin/*` (stats, users CRUD, billing, history, analytics) |
