# MsgHub — Project Context & Handoff

## Τι είναι το MsgHub
Multi-tenant messaging dashboard για διαχείριση συνομιλιών WhatsApp & Viber μέσω n8n automation.
Κάθε πελάτης έχει δική του βάση δεδομένων και δικό του dashboard.

---

## Stack
- **Frontend/Backend:** Next.js 14.2.5 (App Router) + TypeScript + Tailwind CSS
- **Auth:** NextAuth v4 (downgraded από v5 λόγω MissingCSRF errors πίσω από Traefik proxy)
- **Database:** PostgreSQL via `pg` (no ORM)
- **Charts:** Recharts
- **Deployment:** Coolify σε Hetzner VPS, GitHub repo: `PazarlisPanos/messaging-dashboard`
- **Live URL:** `https://msghub.pazarlisapps.com`

---

## Architecture
```
Central DB (msghub-db / j84cgkscww4ogswcs0kscwk8:5432)
├── clients table       — client registry με database_url, webhooks κτλ
└── dashboard_users     — users με role + client_slug

Per-client DB (automation-postgres / ackokwcwk0c80ckgwgkwgwos:5432)
├── wa_messages, wa_sessions, wa_statuses, wa_dedupe
├── vb_messages, vb_sessions, vb_statuses, vb_dedupe
└── ai_usage
```

**URL structure:**
- `/dashboard` → super_admin home (all clients)
- `/dashboard/admin` → manage clients & users
- `/dashboard/[slug]` → client dashboard
- `/dashboard/[slug]/whatsapp` → WhatsApp inbox
- `/dashboard/[slug]/viber` → Viber inbox
- `/dashboard/[slug]/settings` → client settings

---

## Roles & Auth
- `super_admin`: βλέπει όλους τους clients, manage panel, settings με webhooks
- `operator`: redirect αυτόματα στον δικό τους client, δεν βλέπει webhooks/DB
- Fallback auth: `DASHBOARD_USERNAME` / `DASHBOARD_PASSWORD` env vars (για πριν τη δημιουργία DB users)

---

## Env Vars (Coolify → msghub-app)
```
DATABASE_URL=postgresql://postgres:PASSWORD@j84cgkscww4ogswcs0kscwk8:5432/postgres
NEXTAUTH_SECRET=<secret>
NEXTAUTH_URL=https://msghub.pazarlisapps.com
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=<password>
N8N_BASE_URL=https://n8n.pazarlisapps.com
NODE_ENV=production
```

---

## Database Schema

### Central DB (msghub-db)
```sql
clients:
  id, slug (UNIQUE), name, database_url, wa_webhook, vb_webhook,
  bot_toggle_webhook, active, created_at

dashboard_users:
  id, username (UNIQUE), password (scrypt), role, client_slug,
  active, created_at, last_login
```

### Per-client DB
```sql
wa_messages:
  id, created_at, sender, recipient, direction (in/out),
  message_id, text, message_type, intent, lang, location_name,
  meta_json, resolved_by, confidence (0-1 scale), reply_to_message_id,
  conversation_key, ai_used

wa_sessions:
  sender (PK), lang, last_intent, last_location, last_question,
  context_json, updated_at, session_summary, last_user_message,
  last_bot_message, open_topic, resolved_by, fallback_count,
  last_message_at, needs_human (BOOLEAN), bot_paused (BOOLEAN DEFAULT FALSE)

wa_statuses:
  id, created_at, message_id, recipient_id, status (sent/delivered/read),
  status_timestamp, pricing_json, meta_json

wa_dedupe: message_id (PK), sender, created_at

-- Same structure for vb_messages, vb_sessions, vb_statuses, vb_dedupe

ai_usage:
  id, created_at, platform (whatsapp/viber), message_id (TEXT),
  sender, model, prompt_tokens, completion_tokens, total_tokens,
  cost_usd, conversation_key, workflow
```

---

## n8n Integration

### Manual Reply payload (από dashboard → n8n):
```json
{
  "platform": "whatsapp",
  "contact_id": "306980153914",
  "message": "Το κείμενο",
  "session_id": null
}
```

### Bot Toggle payload (από dashboard → n8n):
```json
{
  "contact_id": "306980153914",
  "conversation_key": "306980153914",
  "platform": "whatsapp",
  "action": "disable",
  "bot_paused": true
}
```

**n8n SQL για bot toggle:**
```sql
-- WhatsApp:
UPDATE wa_sessions SET bot_paused = {{$json.bot_paused}} WHERE sender = '{{$json.contact_id}}'
-- Viber:
UPDATE vb_sessions SET bot_paused = {{$json.bot_paused}} WHERE sender = '{{$json.contact_id}}'
```

### Μετά από manual reply — n8n πρέπει να κάνει:
1. Στείλε μήνυμα μέσω Meta API
2. INSERT στο `wa_messages` (direction='out', resolved_by='human', ai_used=FALSE)
3. UPDATE `wa_sessions` SET needs_human=FALSE, last_bot_message=..., updated_at=NOW()

---

## Logic: needs_human vs bot_paused
- `needs_human = TRUE` → πορτοκαλί dot στη λίστα, "Needs attention" badge — ο χρήστης ζήτησε άνθρωπο, ΔΕΝ απενεργοποιεί το bot
- `bot_paused = TRUE` → "Bot OFF" κουμπί στο thread header — operator χειροκίνητα έπαυσε το bot για manual reply

---

## Current Client: palm3 waterparks
- Slug: `palm3`
- DB: `client_palm3` @ `ackokwcwk0c80ckgwgkwgwos:5432`
- User: `palm3_user` / `Palm3pass2024`
- ~158 μηνύματα, 3 contacts

---

## Γνωστά θέματα / TODO
1. **SSL** — `msghub.pazarlisapps.com` εμφανίζει "Not secure" — χρειάζεται Let's Encrypt από Coolify
2. **2 ticks** — `wa_statuses` δεν ενημερώνεται από n8n → delivered/read status δεν εμφανίζεται
3. **Unread badge** — μετράει incoming μηνύματα μετά την τελευταία απάντηση (approximation)
4. **Pagination** — inbox φορτώνει max 200 μηνύματα, δεν υπάρχει "load more"
5. **Display names** — εμφανίζει αριθμούς τηλεφώνου αντί για ονόματα
6. **Push notifications** — δεν υπάρχουν — χρειάζεται WebSocket ή polling για real-time
7. **Viber reply** — disabled (Google App Script δεν υποστηρίζει outbound), μόνο read-only
8. **Auto-refresh** — κάθε 30" refresh conversations, όχι real-time
9. **Export** — δεν υπάρχει export CSV/PDF στατιστικών

---

## Προτάσεις για επόμενο chat
1. **Real-time με Server-Sent Events (SSE)** — αντί για polling κάθε 30", push updates όταν έρθει νέο μήνυμα
2. **Webhook endpoint** — n8n → msghub για real-time notification νέων μηνυμάτων
3. **Contact display names** — table `contacts` με phone→name mapping
4. **Pagination** — "Load more" στο inbox
5. **Bulk operations** — mark all as read, archive conversations
6. **CSV export** — στατιστικά και ιστορικό μηνυμάτων
7. **Multi-language UI** — Ελληνικά / English toggle
8. **Dark/Light mode** — τώρα είναι μόνο dark
9. **Notification badge** — browser tab badge όταν υπάρχουν unread
10. **n8n workflow templates** — έτοιμα workflows για νέους πελάτες
