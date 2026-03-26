'use client'

import { useState } from 'react'
import type { Client } from '@/types'
import { Plus, Trash2, ChevronDown, ChevronUp, Users, Building2, Eye, EyeOff } from 'lucide-react'

interface DashUser {
  id: number
  username: string
  role: string
  client_slug: string | null
  active: boolean
  last_login: string | null
}

interface Props {
  initialClients: Client[]
  initialUsers: DashUser[]
}

const EMPTY_CLIENT = { slug: '', name: '', database_url: '', wa_webhook: '', vb_webhook: '', bot_toggle_webhook: '' }
const EMPTY_USER = { username: '', password: '', role: 'operator', client_slug: '' }

export default function AdminPanel({ initialClients, initialUsers }: Props) {
  const [clients, setClients] = useState<Client[]>(initialClients)
  const [users, setUsers] = useState<DashUser[]>(initialUsers)
  const [activeTab, setActiveTab] = useState<'clients' | 'users'>('clients')

  // Client form state
  const [showAddClient, setShowAddClient] = useState(false)
  const [clientForm, setClientForm] = useState(EMPTY_CLIENT)
  const [savingClient, setSavingClient] = useState(false)
  const [deletingClient, setDeletingClient] = useState<string | null>(null)

  // User form state
  const [showAddUser, setShowAddUser] = useState(false)
  const [userForm, setUserForm] = useState(EMPTY_USER)
  const [savingUser, setSavingUser] = useState(false)
  const [deletingUser, setDeletingUser] = useState<number | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  function flash(type: 'ok' | 'err', text: string) {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 3000)
  }

  // ── Clients ──────────────────────────────────────────────────────────────────

  async function handleAddClient(e: React.FormEvent) {
    e.preventDefault()
    setSavingClient(true)
    try {
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setClients(c => [...c, data.client])
      setClientForm(EMPTY_CLIENT)
      setShowAddClient(false)
      flash('ok', `Client "${data.client.name}" created`)
    } catch (err) {
      flash('err', err instanceof Error ? err.message : 'Error')
    } finally { setSavingClient(false) }
  }

  async function handleDeleteClient(slug: string, name: string) {
    if (!confirm(`Delete client "${name}"? This cannot be undone.`)) return
    setDeletingClient(slug)
    try {
      const res = await fetch(`/api/admin/clients/${slug}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed')
      setClients(c => c.filter(cl => cl.slug !== slug))
      flash('ok', `Client "${name}" deleted`)
    } catch (err) {
      flash('err', err instanceof Error ? err.message : 'Error')
    } finally { setDeletingClient(null) }
  }

  // ── Users ─────────────────────────────────────────────────────────────────────

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault()
    setSavingUser(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setUsers(u => [...u, data.user])
      setUserForm(EMPTY_USER)
      setShowAddUser(false)
      flash('ok', `User "${data.user.username}" created`)
    } catch (err) {
      flash('err', err instanceof Error ? err.message : 'Error')
    } finally { setSavingUser(false) }
  }

  async function handleDeleteUser(id: number, username: string) {
    if (!confirm(`Delete user "${username}"?`)) return
    setDeletingUser(id)
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed')
      setUsers(u => u.filter(usr => usr.id !== id))
      flash('ok', `User "${username}" deleted`)
    } catch (err) {
      flash('err', err instanceof Error ? err.message : 'Error')
    } finally { setDeletingUser(null) }
  }

  async function handleToggleUser(id: number, active: boolean) {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !active }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed')
      setUsers(u => u.map(usr => usr.id === id ? { ...usr, active: !active } : usr))
    } catch (err) {
      flash('err', err instanceof Error ? err.message : 'Error')
    }
  }

  const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#fff', outline: 'none', fontFamily: 'inherit' }
  const labelStyle = { display: 'block', fontSize: 11, fontWeight: 500, color: '#8888aa', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 6 }

  return (
    <div className="space-y-4">
      {msg && (
        <div style={{ padding: '10px 14px', borderRadius: 8, fontSize: 13, background: msg.type === 'ok' ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${msg.type === 'ok' ? 'rgba(74,222,128,0.2)' : 'rgba(239,68,68,0.2)'}`, color: msg.type === 'ok' ? '#4ade80' : '#f87171' }}>
          {msg.text}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', padding: 4, borderRadius: 10, width: 'fit-content' }}>
        {(['clients', 'users'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer', background: activeTab === tab ? '#6c6fff' : 'transparent', color: activeTab === tab ? '#fff' : '#8888aa' }}>
            {tab === 'clients' ? <Building2 size={14} /> : <Users size={14} />}
            {tab === 'clients' ? `Clients (${clients.length})` : `Users (${users.length})`}
          </button>
        ))}
      </div>

      {/* ── CLIENTS TAB ─────────────────────────────────────────────────────── */}
      {activeTab === 'clients' && (
        <div className="space-y-4">
          {/* Existing clients */}
          {clients.length > 0 && (
            <div className="card space-y-0">
              <h3 className="text-sm font-semibold text-white mb-4">Active clients</h3>
              {clients.map(client => (
                <div key={client.slug} className="flex items-center justify-between py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div>
                    <p className="text-sm font-semibold text-white">{client.name}</p>
                    <p className="text-xs" style={{ color: '#6b7280', fontFamily: 'monospace' }}>/{client.slug}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <a href={`/dashboard/${client.slug}`} style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8, background: 'rgba(108,111,255,0.15)', color: '#a8aaff', textDecoration: 'none' }}>Open</a>
                    <button onClick={() => handleDeleteClient(client.slug, client.name)} disabled={deletingClient === client.slug}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, padding: '6px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer' }}>
                      <Trash2 size={11} /> {deletingClient === client.slug ? '…' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add client form */}
          <div className="card">
            <button onClick={() => setShowAddClient(s => !s)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 13, fontWeight: 600 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Plus size={15} color="#6c6fff" /> Add new client</span>
              {showAddClient ? <ChevronUp size={14} color="#6b7280" /> : <ChevronDown size={14} color="#6b7280" />}
            </button>
            {showAddClient && (
              <form onSubmit={handleAddClient} style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div><label style={labelStyle}>Slug <span style={{ color: '#f87171' }}>*</span></label><input style={inputStyle} placeholder="e.g. acme → /dashboard/acme" value={clientForm.slug} onChange={e => setClientForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))} required /></div>
                <div><label style={labelStyle}>Display name <span style={{ color: '#f87171' }}>*</span></label><input style={inputStyle} placeholder="e.g. Acme Corp" value={clientForm.name} onChange={e => setClientForm(f => ({ ...f, name: e.target.value }))} required /></div>
                <div><label style={labelStyle}>PostgreSQL URL <span style={{ color: '#f87171' }}>*</span></label><input style={inputStyle} type="password" placeholder="postgresql://user:pass@host:5432/db" value={clientForm.database_url} onChange={e => setClientForm(f => ({ ...f, database_url: e.target.value }))} required /></div>
                <div style={{ paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <p style={{ fontSize: 11, color: '#8888aa', marginBottom: 12 }}>n8n Webhooks (optional)</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div><label style={labelStyle}>WhatsApp reply webhook</label><input style={inputStyle} placeholder="/webhook/acme-wa-reply" value={clientForm.wa_webhook} onChange={e => setClientForm(f => ({ ...f, wa_webhook: e.target.value }))} /></div>
                    <div><label style={labelStyle}>Viber reply webhook</label><input style={inputStyle} placeholder="/webhook/acme-vb-reply" value={clientForm.vb_webhook} onChange={e => setClientForm(f => ({ ...f, vb_webhook: e.target.value }))} /></div>
                    <div><label style={labelStyle}>Bot toggle webhook</label><input style={inputStyle} placeholder="/webhook/acme-bot-toggle" value={clientForm.bot_toggle_webhook} onChange={e => setClientForm(f => ({ ...f, bot_toggle_webhook: e.target.value }))} /></div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="submit" disabled={savingClient} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: '#6c6fff', color: '#fff', border: 'none', cursor: 'pointer' }}>
                    {savingClient ? 'Creating…' : 'Create client'}
                  </button>
                  <button type="button" onClick={() => { setShowAddClient(false); setClientForm(EMPTY_CLIENT) }} style={{ padding: '8px 14px', borderRadius: 8, fontSize: 13, background: 'transparent', color: '#8888aa', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}>Cancel</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── USERS TAB ───────────────────────────────────────────────────────── */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {users.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-semibold text-white mb-4">Dashboard users</h3>
              {users.map(user => (
                <div key={user.id} className="flex items-center justify-between py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <p className="text-sm font-semibold text-white">{user.username}</p>
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: user.role === 'super_admin' ? 'rgba(108,111,255,0.2)' : 'rgba(255,255,255,0.07)', color: user.role === 'super_admin' ? '#a8aaff' : '#9ca3af' }}>
                        {user.role === 'super_admin' ? 'Super Admin' : 'Operator'}
                      </span>
                      {!user.active && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>Inactive</span>}
                    </div>
                    <p className="text-xs" style={{ color: '#6b7280', marginTop: 2 }}>
                      {user.client_slug ? `/${user.client_slug}` : 'All clients'}
                      {user.last_login && ` · Last login: ${new Date(user.last_login).toLocaleDateString('el-GR')}`}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => handleToggleUser(user.id, user.active)}
                      style={{ fontSize: 12, padding: '5px 10px', borderRadius: 8, background: user.active ? 'rgba(255,255,255,0.06)' : 'rgba(74,222,128,0.1)', color: user.active ? '#9ca3af' : '#4ade80', border: 'none', cursor: 'pointer' }}>
                      {user.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => handleDeleteUser(user.id, user.username)} disabled={deletingUser === user.id}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, padding: '5px 10px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer' }}>
                      <Trash2 size={10} /> {deletingUser === user.id ? '…' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="card">
            <button onClick={() => setShowAddUser(s => !s)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 13, fontWeight: 600 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Plus size={15} color="#6c6fff" /> Add new user</span>
              {showAddUser ? <ChevronUp size={14} color="#6b7280" /> : <ChevronDown size={14} color="#6b7280" />}
            </button>
            {showAddUser && (
              <form onSubmit={handleAddUser} style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div><label style={labelStyle}>Username <span style={{ color: '#f87171' }}>*</span></label><input style={inputStyle} placeholder="e.g. nikos" value={userForm.username} onChange={e => setUserForm(f => ({ ...f, username: e.target.value }))} required /></div>
                <div>
                  <label style={labelStyle}>Password <span style={{ color: '#f87171' }}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <input style={{ ...inputStyle, paddingRight: 40 }} type={showPassword ? 'text' : 'password'} placeholder="Strong password" value={userForm.password} onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))} required />
                    <button type="button" onClick={() => setShowPassword(s => !s)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Role <span style={{ color: '#f87171' }}>*</span></label>
                  <select style={{ ...inputStyle }} value={userForm.role} onChange={e => setUserForm(f => ({ ...f, role: e.target.value }))}>
                    <option value="operator">Operator (client-specific)</option>
                    <option value="super_admin">Super Admin (all clients)</option>
                  </select>
                </div>
                {userForm.role === 'operator' && (
                  <div>
                    <label style={labelStyle}>Client <span style={{ color: '#f87171' }}>*</span></label>
                    <select style={{ ...inputStyle }} value={userForm.client_slug} onChange={e => setUserForm(f => ({ ...f, client_slug: e.target.value }))} required>
                      <option value="">— Select client —</option>
                      {clients.map(c => <option key={c.slug} value={c.slug}>{c.name} (/{c.slug})</option>)}
                    </select>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="submit" disabled={savingUser} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: '#6c6fff', color: '#fff', border: 'none', cursor: 'pointer' }}>
                    {savingUser ? 'Creating…' : 'Create user'}
                  </button>
                  <button type="button" onClick={() => { setShowAddUser(false); setUserForm(EMPTY_USER) }} style={{ padding: '8px 14px', borderRadius: 8, fontSize: 13, background: 'transparent', color: '#8888aa', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}>Cancel</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
