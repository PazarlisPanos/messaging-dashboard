import { NextResponse, NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getClient } from '@/lib/clients'
import { triggerN8nReply } from '@/lib/n8n'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { client_slug, platform, contact_id, message, session_id } = body

  if (!client_slug || !platform || !contact_id || !message?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const client = await getClient(client_slug)
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const webhookPath = platform === 'whatsapp' ? client.wa_webhook : client.vb_webhook
  if (!webhookPath) {
    return NextResponse.json({ error: `No ${platform} webhook configured for this client` }, { status: 400 })
  }

  try {
    await triggerN8nReply({ platform, contact_id, message, session_id }, webhookPath)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 502 })
  }
}
