# Timely DTR — Quick Setup Guide

---

## Prerequisites

- **Node.js** 18 or later
- **npm** 9 or later (bundled with Node 18)
- A **Neon** PostgreSQL database ([neon.tech](https://neon.tech) — free tier works)

---

## 1. Clone and Install

```bash
git clone <repo-url> timely
cd timely
npm install
```

---

## 2. Configure Environment

```bash
cp apps/server/.env.production.example apps/server/.env
```

Open `apps/server/.env` and fill in the required values:

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon connection string (from your Neon project dashboard) |
| `JWT_SECRET` | A random string of at least 32 characters |
| `SCAN_COOLDOWN_MINUTES` | Minutes between allowed scans per employee (default: `120`) |
| `PORT` | Server port (default: `3000`) |

---

## 3. Run Database Migration and Seed

```bash
cd apps/server
npx prisma migrate dev --name init
npm run prisma:seed
cd ../..
```

This creates all tables and seeds the default admin account.

---

## 4. Start Development

From the **repo root**:

```bash
npm run dev
```

---

## 5. Access the Apps

| App | URL | Default credentials |
|---|---|---|
| Admin Portal | http://localhost:5174 | admin@timely.local / Admin@1234 |
| Kiosk | http://localhost:5175 | _(no login — scan only)_ |
| API | http://localhost:3000 | — |

> **Important:** Change the default admin password after your first login.

---

## 6. Production Deployment with PM2

```bash
# Build the server
cd apps/server
npm run build

# Start with PM2
pm2 start ecosystem.config.js --env production

# (Optional) Save the PM2 process list so it restarts on server reboot
pm2 save
pm2 startup
```

For kiosk terminal autostart instructions, see [`apps/kiosk/KIOSK_SETUP.md`](apps/kiosk/KIOSK_SETUP.md).

---

## 7. Environment File Reference

A full production environment template is at `apps/server/.env.production.example`.
