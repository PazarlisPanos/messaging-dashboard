'use client'

import { useState } from 'react'
import type { Client } from '@/types'
import { Plus, Trash2, ChevronDown, ChevronUp, Save } from 'lucide-react'

const EMPTY_FORM = {
  slug: '', name: '', database_url: '',
  wa_webhook: '', vb_webhook: '', bot_toggle_webhook: '',
}

export default function AdminClientsPanel({ initialClients }: { initialClients: Client[] }) {
  const [clients, setClients] = useState<Client[]>(initialClients)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null)

  function field(key: keyof typeof form, label: string, hint: string, required = false) {
    return (
      <div>
        <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: '#8888aa' }}>
          {label} {required && <span style={{ color: '#f87171' }}>*</span>}
        </label>
        <input
          type={key === 'database_url' ? 'password' : 'text'}
          className="input"
          placeholder={hint}
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          required={required}
        />
      </div>
    )
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setClients(c => [...c, data.client])
      setForm(EMPTY_FORM)
      setShowAdd(false)
      setSuccess(`Client "${data.client.name}" created!`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(slug: string, name: string) {
    if (!confirm(`Delete client "${name}"? This cannot be undone.`)) return
    setDeletingSlug(slug)
    try {
      const res = await fetch(`/api/admin/clients/${slug}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setClients(c => c.filter(cl => cl.slug !== slug))
      setSuccess(`Client "${name}" deleted.`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting')
    } finally {
      setDeletingSlug(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Feedback */}
      {success && (
        <div className="px-4 py-3 rounded-lg text-sm" style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', color: '#4ade80' }}>
          {success}
        </div>
      )}
      {error && (
        <div className="px-4 py-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
          {error}
        </div>
      )}

      {/* Existing clients */}
      {clients.length > 0 && (
        <div className="card space-y-3">
          <h3 className="text-sm font-semibold text-white">Active clients ({clients.length})</h3>
          {clients.map(client => (
            <div key={client.slug} className="flex items-center justify-between py-3"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <p className="text-sm font-semibold text-white">{client.name}</p>
                <p className="text-xs" style={{ color: '#6b7280', fontFamily: 'monospace' }}>/{client.slug}</p>
              </div>
              <div className="flex items-center gap-2">
                <a href={`/dashboard/${client.slug}`}
                  className="text-xs px-3 py-1.5 rounded-lg"
                  style={{ background: 'rgba(108,111,255,0.15)', color: '#a8aaff', textDecoration: 'none' }}>
                  Open
                </a>
                <button
                  onClick={() => handleDelete(client.slug, client.name)}
                  disabled={deletingSlug === client.slug}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
                  style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
                >
                  <Trash2 size={12} />
                  {deletingSlug === client.slug ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add new client */}
      <div className="card">
        <button
          onClick={() => setShowAdd(s => !s)}
          className="w-full flex items-center justify-between text-sm font-semibold text-white"
        >
          <span className="flex items-center gap-2">
            <Plus size={16} style={{ color: '#6c6fff' }} />
            Add new client
          </span>
          {showAdd ? <ChevronUp size={14} style={{ color: '#6b7280' }} /> : <ChevronDown size={14} style={{ color: '#6b7280' }} />}
        </button>

        {showAdd && (
          <form onSubmit={handleAdd} className="mt-5 space-y-4">
            {field('slug', 'Slug (URL identifier)', 'e.g. acme  →  /dashboard/acme', true)}
            {field('name', 'Display name', 'e.g. Acme Corp', true)}
            {field('database_url', 'PostgreSQL connection string', 'postgresql://user:pass@host:5432/dbname', true)}

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem' }}>
              <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: '#8888aa' }}>
                n8n Webhooks (optional — can add later in Settings)
              </p>
              {field('wa_webhook', 'WhatsApp reply webhook', '/webhook/acme-wa-reply')}
              {field('vb_webhook', 'Viber reply webhook', '/webhook/acme-vb-reply')}
              {field('bot_toggle_webhook', 'Bot toggle webhook', '/webhook/acme-bot-toggle')}
            </div>

            {error && (
              <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>
            )}

            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary">
                <Save size={14} />
                {saving ? 'Creating…' : 'Create client'}
              </button>
              <button type="button" onClick={() => { setShowAdd(false); setForm(EMPTY_FORM); setError('') }}
                className="btn-ghost">
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
