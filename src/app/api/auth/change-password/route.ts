import { NextResponse, NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { scrypt, randomBytes, timingSafeEqual } from 'crypto'
import { promisify } from 'util'

const scryptAsync = promisify(scrypt)

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const hash = (await scryptAsync(password, salt, 64)) as Buffer
  return `${salt}:${hash.toString('hex')}`
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [salt, hash] = stored.split(':')
    const hashBuffer = Buffer.from(hash, 'hex')
    const candidate = (await scryptAsync(password, salt, 64)) as Buffer
    return timingSafeEqual(hashBuffer, candidate)
  } catch { return false }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id
  // Env-var fallback user (id=0) cannot change password here
  if (userId === '0') {
    return NextResponse.json({ error: 'Change password via environment variables for this account' }, { status: 400 })
  }

  const { currentPassword, newPassword } = await req.json()
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Both passwords required' }, { status: 400 })
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  try {
    const rows = await query<{ password: string }>(`SELECT password FROM dashboard_users WHERE id = $1`, [userId])
    if (!rows.length) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const valid = await verifyPassword(currentPassword, rows[0].password)
    if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })

    const hashed = await hashPassword(newPassword)
    await query(`UPDATE dashboard_users SET password = $1 WHERE id = $2`, [hashed, userId])

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[change-password]', err)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
