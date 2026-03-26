import { NextResponse, NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getClient } from '@/lib/clients'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { client_slug, contact_id, conversation_key, platform } = body

  if (!client_slug || !contact_id || !platform) {
    return NextResponse.json({ error: 'client_slug, contact_id and platform required' }, { status: 400 })
  }

  const client = await getClient(client_slug)
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  if (!client.resolve_attention_webhook) {
    return NextResponse.json({ error: 'Resolve attention webhook not configured.' }, { status: 400 })
  }

  const base = process.env.N8N_BASE_URL
  if (!base) return NextResponse.json({ error: 'N8N_BASE_URL not set' }, { status: 500 })

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (process.env.N8N_WEBHOOK_SECRET) {
    headers['x-webhook-secret'] = process.env.N8N_WEBHOOK_SECRET
  }

  try {
    const res = await fetch(`${base}${client.resolve_attention_webhook}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        contact_id,
        conversation_key: conversation_key ?? null,
        platform,
        action: 'resolve',
        needs_human: false,
      }),
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`n8n responded ${res.status}: ${text}`)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[resolve-attention]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Webhook failed' },
      { status: 502 }
    )
  }
}
