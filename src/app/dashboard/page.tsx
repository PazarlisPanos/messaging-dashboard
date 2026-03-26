import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getAllClients } from '@/lib/clients'
import Link from 'next/link'
import { Building2, MessageSquare, Smartphone, ArrowRight, Plus, ShieldCheck } from 'lucide-react'

export const revalidate = 0

export default async function SuperAdminPage() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (role !== 'super_admin') redirect('/auth/login')

  const clients = await getAllClients()

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', padding: 24 }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0 }}>All Clients</h2>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
              {clients.length} active client{clients.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Link href="/dashboard/admin"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600, background: '#6c6fff', color: '#fff', textDecoration: 'none' }}>
            <ShieldCheck size={14} /> Manage clients & users
          </Link>
        </div>

        {clients.length === 0 ? (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', textAlign: 'center' }}>
            <Building2 size={36} style={{ color: '#6b7280', opacity: 0.3, marginBottom: 16 }} />
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>No clients yet</p>
            <Link href="/dashboard/admin"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6c6fff', textDecoration: 'none', padding: '8px 16px', borderRadius: 8, background: 'rgba(108,111,255,0.1)', border: '1px solid rgba(108,111,255,0.2)' }}>
              <Plus size={13} /> Add your first client
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {clients.map((client) => (
              <Link key={client.slug} href={`/dashboard/${client.slug}`}
                style={{ textDecoration: 'none' }} className="card block">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(108,111,255,0.15)', border: '1px solid rgba(108,111,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Building2 size={16} color="#6c6fff" />
                  </div>
                  <ArrowRight size={13} style={{ color: '#6b7280', marginTop: 4 }} />
                </div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{client.name}</p>
                <p style={{ fontSize: 11, color: '#6b7280', fontFamily: 'monospace', marginBottom: 14 }}>/{client.slug}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: client.wa_webhook ? '#25d366' : 'rgba(107,114,128,0.4)' }}>
                    <MessageSquare size={11} /> WhatsApp
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: client.vb_webhook ? '#9b8fff' : 'rgba(107,114,128,0.4)' }}>
                    <Smartphone size={11} /> Viber
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
