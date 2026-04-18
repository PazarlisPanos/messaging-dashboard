'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard, MessageSquare, Smartphone,
  Settings, LogOut, Zap, Menu, X, LayoutGrid, ShieldCheck, MessageCircle,
} from 'lucide-react'

interface Props {
  children: React.ReactNode
  clientSlug: string
  clientName: string
  role: string
}

export default function MobileLayout({ children, clientSlug, clientName, role }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const base = `/dashboard/${clientSlug}`

  const navItems = [
    { href: base,               label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: `${base}/whatsapp`, label: 'WhatsApp',  icon: MessageSquare,   dot: '#25d366' },
    { href: `${base}/viber`,      label: 'Viber',     icon: Smartphone,     dot: '#7360f2' },
    { href: `${base}/messenger`,  label: 'Messenger', icon: MessageCircle,  dot: '#0084ff' },
    { href: `${base}/settings`,   label: 'Settings',  icon: Settings },
  ]

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname.startsWith(href)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0a0a0f' }}>
      {/* Top header */}
      <header style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', background: '#111118', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 10, background: 'rgba(108,111,255,0.15)', border: '1px solid rgba(108,111,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={13} color="#6c6fff" />
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{clientName}</span>
        </div>
        <button onClick={() => setMenuOpen(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', padding: 4 }}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* Slide-down menu */}
      {menuOpen && (
        <div style={{ position: 'fixed', top: 56, left: 0, right: 0, bottom: 0, background: '#111118', zIndex: 40, padding: '16px 12px', display: 'flex', flexDirection: 'column' }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: '#555566', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 10px', marginBottom: 8 }}>Navigation</p>
          {navItems.map(({ href, label, icon: Icon, exact, dot }) => (
            <Link key={href} href={href} onClick={() => setMenuOpen(false)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, fontSize: 15, fontWeight: 500, color: isActive(href, exact) ? '#a8aaff' : '#8888aa', background: isActive(href, exact) ? 'rgba(108,111,255,0.12)' : 'transparent', textDecoration: 'none', marginBottom: 4 }}>
              <Icon size={18} />
              {label}
              {dot && <span style={{ marginLeft: 'auto', width: 7, height: 7, borderRadius: '50%', background: dot }} />}
            </Link>
          ))}

          {role === 'super_admin' && (
            <>
              <p style={{ fontSize: 10, fontWeight: 600, color: '#555566', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '16px 10px 8px' }}>Admin</p>
              <Link href="/dashboard" onClick={() => setMenuOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, fontSize: 15, fontWeight: 500, color: '#8888aa', textDecoration: 'none', marginBottom: 4 }}>
                <LayoutGrid size={18} /> All clients
              </Link>
              <Link href="/dashboard/admin" onClick={() => setMenuOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, fontSize: 15, fontWeight: 500, color: '#8888aa', textDecoration: 'none', marginBottom: 4 }}>
                <ShieldCheck size={18} /> Manage
              </Link>
            </>
          )}

          <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button onClick={() => signOut({ callbackUrl: '/auth/login' })}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, fontSize: 15, fontWeight: 500, color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', width: '100%' }}>
              <LogOut size={18} /> Sign out
            </button>
          </div>
        </div>
      )}

      {/* Page content */}
      <main style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: 16, paddingBottom: 80 }}>
        {children}
      </main>

      {/* Bottom nav */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 64, background: '#111118', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-around', zIndex: 40 }}>
        {navItems.map(({ href, label, icon: Icon, exact, dot }) => {
          const active = isActive(href, exact)
          return (
            <Link key={href} href={href}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, textDecoration: 'none', padding: '6px 12px', borderRadius: 10, minWidth: 56 }}>
              <div style={{ position: 'relative' }}>
                <Icon size={22} color={active ? '#a8aaff' : '#6b7280'} />
                {dot && <span style={{ position: 'absolute', top: -1, right: -2, width: 6, height: 6, borderRadius: '50%', background: dot }} />}
              </div>
              <span style={{ fontSize: 10, color: active ? '#a8aaff' : '#6b7280', fontWeight: active ? 600 : 400 }}>{label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
