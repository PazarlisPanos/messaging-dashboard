import { NextResponse, NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { updateClient, getClient } from '@/lib/clients'

export async function PATCH(req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as any).role
  const userSlug = (session.user as any).clientSlug

  if (role === 'operator' && userSlug !== params.slug) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()

  // super_admin can update everything, operators cannot change database_url
  const allowed = role === 'super_admin'
    ? ['name', 'database_url', 'wa_webhook', 'vb_webhook', 'bot_toggle_webhook']
    : ['name', 'wa_webhook', 'vb_webhook', 'bot_toggle_webhook']

  const updates: Record<string, string | null> = {}
  for (const key of allowed) {
    if (body[key] !== undefined) {
      // Store empty string as null
      updates[key] = body[key] === '' ? null : body[key]
    }
  }

  try {
    const updated = await updateClient(params.slug, updates)
    if (!updated) return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    return NextResponse.json({ ok: true, client: updated })
  } catch (err) {
    console.error('[client update]', err)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const client = await getClient(params.slug)
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const role = (session.user as any).role
  const safe = role === 'super_admin' ? client : { ...client, database_url: '***' }
  return NextResponse.json(safe)
}
