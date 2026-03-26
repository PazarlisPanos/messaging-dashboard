# Messaging Dashboard

Multi-channel messaging automation dashboard — WhatsApp & Viber inbox UI with analytics.

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v3 |
| Auth | NextAuth.js v5 (credentials) |
| Database | PostgreSQL via `pg` |
| Charts | Recharts |
| Backend automation | n8n (external) |
| Deployment | Docker → Coolify |

## Quick start (local dev)

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.local.example .env.local
# Edit .env.local with your values

# 3. Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Pages

| Route | Description |
|---|---|
| `/auth/login` | Login page |
| `/dashboard` | KPI overview: stats + charts |
| `/dashboard/whatsapp` | WhatsApp inbox + manual reply |
| `/dashboard/viber` | Viber inbox (reply coming soon) |
| `/dashboard/settings` | Configuration info |

## API Routes

| Endpoint | Method | Description |
|---|---|---|
| `/api/stats` | GET | Dashboard KPIs + chart data |
| `/api/conversations` | GET | Conversation list (platform param) |
| `/api/messages` | GET | Messages for a contact |
| `/api/reply` | POST | Trigger n8n reply webhook |

## DB assumptions

The dashboard assumes these tables exist in the connected PostgreSQL database:

**`wa_messages`**
```sql
id           SERIAL PRIMARY KEY
session_id   TEXT
remote_jid   TEXT         -- contact identifier (e.g. 351912345678@s.whatsapp.net)
message_id   TEXT
direction    TEXT         -- 'in' | 'out'
message_type TEXT         -- 'text' | 'image' | etc.
content      TEXT
timestamp    TIMESTAMPTZ
status       TEXT         -- 'sent' | 'delivered' | 'read'
metadata     JSONB
```

**`vb_messages`** (same structure, `sender_id` instead of `remote_jid`)

## Deploy

See [DEPLOY.md](./DEPLOY.md) for full Coolify deployment instructions.
