import { NextResponse, NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getClient } from '@/lib/clients'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { client_slug, contact_id, conversation_key, platform, action, bot_paused } = body

  if (!client_slug || !contact_id || !action || !platform) {
    return NextResponse.json({ error: 'client_slug, contact_id, platform and action required' }, { status: 400 })
  }
  if (!['enable', 'disable'].includes(action)) {
    return NextResponse.json({ error: 'action must be enable or disable' }, { status: 400 })
  }
  if (!['whatsapp', 'viber'].includes(platform)) {
    return NextResponse.json({ error: 'platform must be whatsapp or viber' }, { status: 400 })
  }

  const client = await getClient(client_slug)
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  if (!client.bot_toggle_webhook) {
    return NextResponse.json({ error: 'Bot toggle webhook not configured. Add it in Settings.' }, { status: 400 })
  }

  const base = process.env.N8N_BASE_URL
  if (!base) return NextResponse.json({ error: 'N8N_BASE_URL not set' }, { status: 500 })

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (process.env.N8N_WEBHOOK_SECRET) {
    headers['x-webhook-secret'] = process.env.N8N_WEBHOOK_SECRET
  }

  try {
    const res = await fetch(`${base}${client.bot_toggle_webhook}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        contact_id,
        conversation_key: conversation_key ?? null,
        platform,                    // 'whatsapp' | 'viber' — n8n uses this to pick the right table
        action,                      // 'enable' | 'disable'
        bot_paused: action === 'disable',  // true = bot paused, false = bot active
        // n8n SQL:
        // UPDATE wa_sessions SET bot_paused = {{$json.bot_paused}} WHERE sender = '{{$json.contact_id}}'
        // UPDATE vb_sessions SET bot_paused = {{$json.bot_paused}} WHERE sender = '{{$json.contact_id}}'
      }),
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`n8n responded ${res.status}: ${text}`)
    }

    return NextResponse.json({ ok: true, action, platform })
  } catch (err) {
    console.error('[bot-toggle]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Webhook failed' },
      { status: 502 }
    )
  }
}
