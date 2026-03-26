import { NextResponse, NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient, getAllClients } from '@/lib/clients'

export async function GET() {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const clients = await getAllClients()
  return NextResponse.json({ clients })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { slug, name, database_url, wa_webhook, vb_webhook, bot_toggle_webhook } = body

  if (!slug || !name || !database_url) return NextResponse.json({ error: 'slug, name and database_url are required' }, { status: 400 })
  if (!/^[a-z0-9-]+$/.test(slug)) return NextResponse.json({ error: 'Slug: lowercase letters, numbers and hyphens only' }, { status: 400 })

  try {
    const client = await createClient({ slug, name, database_url, wa_webhook: wa_webhook || undefined, vb_webhook: vb_webhook || undefined, bot_toggle_webhook: bot_toggle_webhook || undefined })
    return NextResponse.json({ client }, { status: 201 })
  } catch (err: any) {
    if (err.code === '23505') return NextResponse.json({ error: `Slug "${slug}" already exists` }, { status: 409 })
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
