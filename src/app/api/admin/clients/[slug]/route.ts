import { NextResponse, NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { updateClient } from '@/lib/clients'

export async function DELETE(req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const { rowCount } = await query(`DELETE FROM clients WHERE slug = $1`, [params.slug]) as any
    if (!rowCount) return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await req.json()
  try {
    const client = await updateClient(params.slug, body)
    return NextResponse.json({ client })
  } catch {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
