'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, UserX, UserCheck, Key } from 'lucide-react'

interface User {
  id: number
  username: string
  role: string
  client_slug: string | null
  active: boolean
  last_login: string | null
}

interface Client {
  slug: string
  name: string
}

export default function AdminUsersPanel({ initialClients }: { initialClients: Client[] }) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ username: '', password: '', role: 'operator', client_slug: '' })
  const [resetId, setResetId] = useState<number | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState({ type: '', text: '' })

  useEffect(() => {
    fetch('/api/admin/users').then(r => r.json()).then(d => {
      setUsers(d.users ?? [])
      setLoading(false)
    })
  }, [])

  function notify(type: string, text: string) {
    setMsg({ type, text })
    setTimeout(() => setMsg({ type: '', text: '' }), 3000)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setUsers(u => [...u, data.user])
      setForm({ username: '', password: '', role: 'operator', client_slug: '' })
      setShowAdd(false)
      notify('success', `User "${data.user.username}" created`)
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Error')
    } finally { setSaving(false) }
  }

  async function toggleActive(user: User) {
    try {
      await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !user.active }),
      })
      setUsers(u => u.map(x => x.id === user.id ? { ...x, active: !x.active } : x))
      notify('success', `${user.username} ${!user.active ? 'activated' : 'deactivated'}`)
    } catch { notify('error', 'Failed') }
  }

  async function handleResetPassword(id: number) {
    if (!newPassword.trim()) return
    setSaving(true)
    try {
      await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      })
      setResetId(null)
      setNewPassword('')
      notify('success', 'Password updated')
    } catch { notify('error', 'Failed') }
    finally { setSaving(false) }
  }

  async function handleDelete(user: User) {
    if (!confirm(`Delete user "${user.username}"?`)) return
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setUsers(u => u.filter(x => x.id !== user.id))
      notify('success', `"${user.username}" deleted`)
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Error')
    }
  }

  return (
    <div className="space-y-4">
      {msg.text && (
        <div className="px-4 py-3 rounded-lg text-sm" style={{
          background: msg.type === 'success' ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${msg.type === 'success' ? 'rgba(74,222,128,0.2)' : 'rgba(239,68,68,0.2)'}`,
          color: msg.type === 'success' ? '#4ade80' : '#f87171',
        }}>
          {msg.text}
        </div>
      )}

      {/* User list */}
      <div className="card space-y-2">
        <h3 className="text-sm font-semibold text-white mb-3">
          Users {loading ? '…' : `(${users.length})`}
        </h3>
        {loading ? (
          <p className="text-xs" style={{ color: '#6b7280' }}>Loading…</p>
        ) : users.length === 0 ? (
          <p className="text-xs" style={{ color: '#6b7280' }}>No users yet</p>
        ) : users.map(user => (
          <div key={user.id}>
            <div className="flex items-center justify-between py-3"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-white">{user.username}</p>
                  <span style={{
                    fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 600,
                    background: user.role === 'super_admin' ? 'rgba(108,111,255,0.2)' : 'rgba(255,255,255,0.08)',
                    color: user.role === 'super_admin' ? '#a8aaff' : '#9ca3af',
                  }}>
                    {user.role}
                  </span>
                  {!user.active && (
                    <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
                      inactive
                    </span>
                  )}
                </div>
                <p className="text-xs" style={{ color: '#6b7280', marginTop: 2 }}>
                  {user.client_slug ? `→ ${user.client_slug}` : 'all clients'}
                  {user.last_login && ` · Last login: ${new Date(user.last_login).toLocaleDateString('el-GR')}`}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => { setResetId(resetId === user.id ? null : user.id); setNewPassword('') }}
                  title="Reset password"
                  style={{ padding: '6px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex' }}>
                  <Key size={13} />
                </button>
                <button onClick={() => toggleActive(user)}
                  title={user.active ? 'Deactivate' : 'Activate'}
                  style={{ padding: '6px', borderRadius: 6, background: user.active ? 'rgba(251,146,60,0.1)' : 'rgba(74,222,128,0.1)', border: 'none', cursor: 'pointer', color: user.active ? '#fb923c' : '#4ade80', display: 'flex' }}>
                  {user.active ? <UserX size={13} /> : <UserCheck size={13} />}
                </button>
                <button onClick={() => handleDelete(user)}
                  title="Delete"
                  style={{ padding: '6px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', border: 'none', cursor: 'pointer', color: '#f87171', display: 'flex' }}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            {resetId === user.id && (
              <div className="flex gap-2 pb-3">
                <input type="password" className="input flex-1" style={{ fontSize: 12, padding: '6px 10px' }}
                  placeholder="New password" value={newPassword}
                  onChange={e => setNewPassword(e.target.value)} />
                <button onClick={() => handleResetPassword(user.id)} disabled={saving}
                  className="btn-primary" style={{ fontSize: 12, padding: '6px 12px' }}>
                  Save
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add user form */}
      <div className="card">
        <button onClick={() => setShowAdd(s => !s)}
          className="w-full flex items-center justify-between text-sm font-semibold text-white">
          <span className="flex items-center gap-2">
            <Plus size={16} style={{ color: '#6c6fff' }} />
            Add new user
          </span>
        </button>

        {showAdd && (
          <form onSubmit={handleAdd} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: '#8888aa' }}>
                Username <span style={{ color: '#f87171' }}>*</span>
              </label>
              <input type="text" className="input" value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: '#8888aa' }}>
                Password <span style={{ color: '#f87171' }}>*</span>
              </label>
              <input type="password" className="input" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: '#8888aa' }}>Role</label>
              <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                <option value="operator">Operator</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
            {form.role === 'operator' && (
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: '#8888aa' }}>
                  Client <span style={{ color: '#f87171' }}>*</span>
                </label>
                <select className="input" value={form.client_slug}
                  onChange={e => setForm(f => ({ ...f, client_slug: e.target.value }))} required>
                  <option value="">— Select client —</option>
                  {initialClients.map(c => (
                    <option key={c.slug} value={c.slug}>{c.name} ({c.slug})</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Creating…' : 'Create user'}
              </button>
              <button type="button" onClick={() => setShowAdd(false)} className="btn-ghost">Cancel</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
