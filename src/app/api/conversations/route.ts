import { NextResponse, NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getClient } from '@/lib/clients'
import { getWaConversations, getVbConversations, getFbConversations } from '@/lib/queries'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clientSlug = req.nextUrl.searchParams.get('client')
  const platform   = req.nextUrl.searchParams.get('platform') ?? 'whatsapp'

  if (!clientSlug) return NextResponse.json({ error: 'client required' }, { status: 400 })

  const client = await getClient(clientSlug)
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  try {
    const conversations = platform === 'viber'
      ? await getVbConversations(client.database_url)
      : platform === 'messenger'
      ? await getFbConversations(client.database_url)
      : await getWaConversations(client.database_url)
    return NextResponse.json({ conversations })
  } catch (err) {
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}
