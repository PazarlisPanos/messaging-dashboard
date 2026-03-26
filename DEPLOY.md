# Deployment Guide — Coolify on Hetzner VPS

## Overview

```
Hetzner VPS
└── Coolify
    ├── messaging-dashboard  (this Next.js app, Docker)
    ├── n8n                  (already running)
    └── PostgreSQL           (already running per client)
```

---

## 1. Prepare the repository

Push your project to a Git remote (GitHub, GitLab, Gitea — Coolify supports all three).

```bash
cd messaging-dashboard
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USER/messaging-dashboard.git
git push -u origin main
```

---

## 2. Create the app in Coolify

1. Open Coolify → **Projects** → **New Resource**
2. Choose **Application**
3. Select your Git provider and pick the repo
4. Set **Build Pack** → **Dockerfile**
5. Coolify will detect the `Dockerfile` at root automatically

**Build settings:**
| Field | Value |
|---|---|
| Branch | `main` |
| Base directory | `/` |
| Dockerfile path | `Dockerfile` |
| Port | `3000` |

---

## 3. Environment Variables

In Coolify → **Application** → **Environment Variables**, add:

```env
# ── Database ─────────────────────────────────────
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/CLIENT_DB_NAME

# If your PostgreSQL is also on Coolify (internal network):
# DATABASE_URL=postgresql://USER:PASSWORD@postgres-service:5432/CLIENT_DB_NAME

# ── Auth ─────────────────────────────────────────
NEXTAUTH_SECRET=<run: openssl rand -base64 32>
NEXTAUTH_URL=https://dashboard.yourdomain.com

DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=<strong-password>

# ── n8n ──────────────────────────────────────────
N8N_BASE_URL=https://n8n.yourdomain.com
N8N_WA_REPLY_WEBHOOK=/webhook/wa-manual-reply
N8N_VB_REPLY_WEBHOOK=/webhook/vb-manual-reply
N8N_WEBHOOK_SECRET=<optional-shared-secret>

# ── Next.js ──────────────────────────────────────
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

> ⚠️ **Never commit `.env` files.** Only set these in Coolify's UI.

---

## 4. Domain / Subdomain

1. In Coolify → **Application** → **Domains**
2. Add your domain: `dashboard.yourdomain.com`
3. Coolify auto-provisions Let's Encrypt TLS via Traefik

In your DNS provider, add an A record:
```
dashboard.yourdomain.com  →  <your Hetzner VPS IP>
```

---

## 5. Connect to PostgreSQL

### Option A: PostgreSQL also on Coolify (recommended)

If your per-client DB is managed by Coolify:

1. Go to Coolify → **Databases** → find your PostgreSQL instance
2. Copy the **internal connection string** (uses Docker network hostname)
3. Use that as `DATABASE_URL` — no port exposure needed

Format: `postgresql://user:pass@postgres-XXXX:5432/db_name`

### Option B: External PostgreSQL

If your PostgreSQL is on a separate host or exposed:
```
DATABASE_URL=postgresql://user:pass@YOUR_VPS_IP:5432/db_name
```

Make sure port 5432 is accessible from within the Docker network.

---

## 6. Connect to n8n

Your n8n is already running. The dashboard calls n8n webhooks from **server-side** (API routes), so:

- If n8n is on the **same VPS and Coolify network**: use the internal Docker hostname
  ```
  N8N_BASE_URL=http://n8n-service:5678
  ```
- If n8n is behind a domain: use the public URL
  ```
  N8N_BASE_URL=https://n8n.yourdomain.com
  ```

### n8n Webhook setup

In n8n, create a **Webhook node** for manual WhatsApp replies:

1. **New workflow** → Add **Webhook** node
2. Path: `wa-manual-reply`
3. Method: `POST`
4. Connect to your WhatsApp send node
5. Activate the workflow

The dashboard will POST this payload:
```json
{
  "platform": "whatsapp",
  "contact_id": "351912345678@s.whatsapp.net",
  "message": "Hello from dashboard",
  "session_id": "default"
}
```

---

## 7. Deploy

In Coolify:
1. Click **Deploy** (first time)
2. Watch the build logs — typically ~90 seconds
3. Once green, visit `https://dashboard.yourdomain.com`

For subsequent deploys:
- **Auto-deploy**: Enable in Coolify → push to `main` → auto-redeploy
- **Manual**: Coolify UI → **Redeploy**

---

## 8. Resource usage (VPS sizing)

The app uses `output: 'standalone'` in Next.js — the Docker image is ~120MB.

| Resource | Idle | Under load |
|---|---|---|
| RAM | ~80–120 MB | ~150–200 MB |
| CPU | <1% | 5–15% |
| Disk | ~200 MB | ~200 MB |

Minimum VPS: **Hetzner CX21** (2 vCPU, 4 GB RAM) is more than enough.

PostgreSQL connection pool is capped at **5 connections** (`max: 5` in `db.ts`) to stay light.

---

## 9. Multi-client setup

Because each client has their own database, you run **one dashboard instance per client**:

```
client-a.yourdomain.com  →  dashboard instance A  (DATABASE_URL=...client_a_db)
client-b.yourdomain.com  →  dashboard instance B  (DATABASE_URL=...client_b_db)
```

In Coolify, duplicate the application resource and change only `DATABASE_URL`, `NEXTAUTH_URL`, and `DASHBOARD_PASSWORD`.

---

## 10. Health check (optional)

Add to Coolify's health check config:
```
Path: /api/health
Interval: 30s
```

Then create the endpoint at `src/app/api/health/route.ts`:
```ts
export function GET() {
  return Response.json({ ok: true, ts: Date.now() })
}
```

---

## Checklist before going live

- [ ] `NEXTAUTH_SECRET` is a strong random string (≥32 chars)
- [ ] `DASHBOARD_PASSWORD` is not `change-me-in-production`
- [ ] `DATABASE_URL` points to the correct client database
- [ ] n8n webhook workflow is active
- [ ] TLS certificate provisioned by Coolify/Traefik
- [ ] `.env.local` is in `.gitignore` (never committed)
