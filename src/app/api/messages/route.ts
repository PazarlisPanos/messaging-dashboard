import { NextResponse, NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getClient } from '@/lib/clients'
import { getWaMessages, getVbMessages, getFbMessages } from '@/lib/queries'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const clientSlug = searchParams.get('client')
  const contactId = searchParams.get('contact_id')
  const platform = searchParams.get('platform') ?? 'whatsapp'

  if (!clientSlug || !contactId) {
    return NextResponse.json({ error: 'client and contact_id required' }, { status: 400 })
  }

  const client = await getClient(clientSlug)
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const messages = platform === 'viber'
    ? await getVbMessages(client.database_url, contactId)
    : platform === 'messenger'
    ? await getFbMessages(client.database_url, contactId)
    : await getWaMessages(client.database_url, contactId)

  return NextResponse.json({ messages })
}
