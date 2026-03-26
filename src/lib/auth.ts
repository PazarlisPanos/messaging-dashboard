import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { scrypt, timingSafeEqual } from 'crypto'
import { promisify } from 'util'
import centralPool from './db'

const scryptAsync = promisify(scrypt)

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [salt, hash] = stored.split(':')
    const hashBuffer = Buffer.from(hash, 'hex')
    const candidate = (await scryptAsync(password, salt, 64)) as Buffer
    return timingSafeEqual(hashBuffer, candidate)
  } catch {
    return false
  }
}

async function findUser(username: string) {
  try {
    const result = await centralPool.query(
      `SELECT id, username, password, role, client_slug, active
       FROM dashboard_users
       WHERE username = $1 AND active = TRUE LIMIT 1`,
      [username]
    )
    return result.rows[0] ?? null
  } catch {
    return null
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null
        const username = credentials.username
        const password = credentials.password

        // Try DB users first
        const user = await findUser(username)
        if (user) {
          const valid = await verifyPassword(password, user.password)
          if (!valid) return null
          centralPool.query(
            `UPDATE dashboard_users SET last_login = NOW() WHERE id = $1`,
            [user.id]
          ).catch(() => {})
          return {
            id: String(user.id),
            name: user.username,
            email: `${user.username}@dashboard`,
            role: user.role,
            clientSlug: user.client_slug ?? null,
          }
        }

        // Fallback: env vars
        const envUser = process.env.DASHBOARD_USERNAME
        const envPass = process.env.DASHBOARD_PASSWORD
        if (envUser && envPass && username === envUser && password === envPass) {
          return {
            id: '0',
            name: envUser,
            email: `${envUser}@dashboard`,
            role: 'super_admin',
            clientSlug: null,
          }
        }

        return null
      },
    }),
  ],
  pages: { signIn: '/auth/login' },
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.clientSlug = (user as any).clientSlug
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).role = token.role
        ;(session.user as any).clientSlug = token.clientSlug
      }
      return session
    },
  },
}

export default NextAuth(authOptions)
