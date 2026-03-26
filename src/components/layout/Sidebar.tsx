'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { LayoutDashboard, MessageSquare, Smartphone, Settings, LogOut, Zap, LayoutGrid, ShieldCheck } from 'lucide-react'

interface Props {
  clientSlug: string
  clientName: string
  role: string
}

export default function Sidebar({ clientSlug, clientName, role }: Props) {
  const pathname = usePathname()
  const base = `/dashboard/${clientSlug}`

  const navItems = [
    { href: base,               label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: `${base}/whatsapp`, label: 'WhatsApp',  icon: MessageSquare,   dot: '#25d366' },
    { href: `${base}/viber`,    label: 'Viber',     icon: Smartphone,      dot: '#7360f2' },
    { href: `${base}/settings`, label: 'Settings',  icon: Settings },
  ]

  function isActive(href: string, exact = false) {
    return exact ? pathname === href : pathname.startsWith(href)
  }

  const linkStyle = (active: boolean) => ({
    display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 8,
    fontSize: 13, fontWeight: 500, color: active ? '#a8aaff' : '#8888aa',
    background: active ? 'rgba(108,111,255,0.12)' : 'transparent',
    textDecoration: 'none', marginBottom: 2,
  })

  return (
    <aside style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', height: '100%', borderRight: '1px solid rgba(255,255,255,0.06)', background: '#111118' }}>
      <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 12, background: 'rgba(108,111,255,0.15)', border: '1px solid rgba(108,111,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Zap size={14} color="#6c6fff" />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{clientName}</p>
            <p style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>MsgHub</p>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
        <p style={{ fontSize: 9, fontWeight: 600, color: '#555566', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 10px', marginBottom: 6 }}>Navigation</p>
        {navItems.map(({ href, label, icon: Icon, exact, dot }) => (
          <Link key={href} href={href} style={linkStyle(isActive(href, exact))}>
            <Icon size={16} />
            {label}
            {dot && <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: dot, opacity: 0.7 }} />}
          </Link>
        ))}

        {role === 'super_admin' && (
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 9, fontWeight: 600, color: '#555566', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 10px', marginBottom: 6 }}>Admin</p>
            <Link href="/dashboard" style={linkStyle(pathname === '/dashboard')}>
              <LayoutGrid size={16} /> All clients
            </Link>
            <Link href="/dashboard/admin" style={linkStyle(pathname === '/dashboard/admin')}>
              <ShieldCheck size={16} /> Manage
            </Link>
          </div>
        )}
      </nav>

      <div style={{ padding: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={() => signOut({ callbackUrl: '/auth/login' })}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 8, fontSize: 13, fontWeight: 500, color: '#8888aa', background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </aside>
  )
}
