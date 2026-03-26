import { NextResponse, NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getClient } from '@/lib/clients'
import { getDashboardStats, getDailyMessages, getPeakHours } from '@/lib/queries'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clientSlug = req.nextUrl.searchParams.get('client')
  if (!clientSlug) return NextResponse.json({ error: 'client required' }, { status: 400 })

  const client = await getClient(clientSlug)
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  try {
    const [stats, daily, peaks] = await Promise.all([
      getDashboardStats(client.database_url),
      getDailyMessages(client.database_url),
      getPeakHours(client.database_url),
    ])
    return NextResponse.json({ stats, daily, peaks })
  } catch (err) {
    console.error('[stats]', err)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}
