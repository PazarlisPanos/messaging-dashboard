import { NextResponse, NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { scrypt, randomBytes } from 'crypto'
import { promisify } from 'util'

const scryptAsync = promisify(scrypt)

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const hash = (await scryptAsync(password, salt, 64)) as Buffer
  return `${salt}:${hash.toString('hex')}`
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { username, password, role, client_slug } = await req.json()

  if (!username || !password || !role) {
    return NextResponse.json({ error: 'username, password and role are required' }, { status: 400 })
  }
  if (!['super_admin', 'operator'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }
  if (role === 'operator' && !client_slug) {
    return NextResponse.json({ error: 'Operators must have a client' }, { status: 400 })
  }

  try {
    const hashed = await hashPassword(password)
    const rows = await query<any>(
      `INSERT INTO dashboard_users (username, password, role, client_slug)
       VALUES ($1, $2, $3, $4) RETURNING id, username, role, client_slug, active`,
      [username, hashed, role, role === 'super_admin' ? null : client_slug]
    )
    return NextResponse.json({ user: rows[0] }, { status: 201 })
  } catch (err: any) {
    if (err.code === '23505') return NextResponse.json({ error: `Username "${username}" already exists` }, { status: 409 })
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
