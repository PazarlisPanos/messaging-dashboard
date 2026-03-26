import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/auth/login')
  if ((session.user as any).role !== 'super_admin') redirect('/dashboard')

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#0a0a0f' }}>
      <aside style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.06)', background: '#111118', padding: '16px 10px' }}>
        <a href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 10px', borderRadius: 8, fontSize: 13, color: '#8888aa', textDecoration: 'none', marginBottom: 4 }}>← All clients</a>
        <a href="/dashboard/admin" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 10px', borderRadius: 8, fontSize: 13, color: '#a8aaff', background: 'rgba(108,111,255,0.12)', textDecoration: 'none' }}>Manage</a>
      </aside>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{ height: 56, display: 'flex', alignItems: 'center', padding: '0 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(17,17,24,0.5)' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Admin Panel</span>
        </header>
        <main style={{ flex: 1, overflow: 'auto', padding: 24 }}>{children}</main>
      </div>
    </div>
  )
}
