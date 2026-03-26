'use client'

import { useState } from 'react'
import type { Client } from '@/types'

interface Props {
  client: Client
  isSuperAdmin: boolean
}

export default function ClientSettingsForm({ client, isSuperAdmin }: Props) {
  const [form, setForm] = useState({
    name: client.name,
    database_url: client.database_url,
    wa_webhook: client.wa_webhook ?? '',
    vb_webhook: client.vb_webhook ?? '',
    bot_toggle_webhook: client.bot_toggle_webhook ?? '',
    resolve_attention_webhook: client.resolve_attention_webhook ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/clients/${client.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed')
      // Full page refresh to apply changes everywhere
      window.location.reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error saving')
      setSaving(false)
    }
  }

  const inputStyle = {
    width: '100%', background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8,
    padding: '8px 12px', fontSize: 13, color: '#fff', outline: 'none', fontFamily: 'inherit',
  }
  const labelStyle = {
    display: 'block', fontSize: 11, fontWeight: 500 as const, color: '#8888aa',
    textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 6,
  }

  return (
    <div className="space-y-4">
      {/* General — visible to all */}
      <div className="card space-y-4">
        <h3 className="text-sm font-semibold text-white" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 12 }}>
          General
        </h3>
        <div>
          <label style={labelStyle}>Client name</label>
          <input style={inputStyle} type="text"
            value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Display name shown in the dashboard" />
        </div>
      </div>

      {/* Database — super admin only */}
      {isSuperAdmin && (
        <div className="card space-y-4">
          <h3 className="text-sm font-semibold text-white" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 12 }}>
            Database
            <span style={{ marginLeft: 8, fontSize: 9, background: 'rgba(108,111,255,0.15)', color: '#a8aaff', padding: '2px 7px', borderRadius: 4 }}>Super admin only</span>
          </h3>
          <div>
            <label style={labelStyle}>PostgreSQL connection string</label>
            <input style={inputStyle} type="password"
              value={form.database_url} onChange={e => setForm(f => ({ ...f, database_url: e.target.value }))}
              placeholder="postgresql://user:pass@host:5432/db" />
            <p style={{ fontSize: 10, color: 'rgba(107,114,128,0.6)', marginTop: 4 }}>Internal Coolify URL</p>
          </div>
        </div>
      )}

      {/* Webhooks — super admin only */}
      {isSuperAdmin && (
        <div className="card space-y-4">
          <h3 className="text-sm font-semibold text-white" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 12 }}>
            n8n Webhooks
            <span style={{ marginLeft: 8, fontSize: 9, background: 'rgba(108,111,255,0.15)', color: '#a8aaff', padding: '2px 7px', borderRadius: 4 }}>Super admin only</span>
          </h3>
          {[
            { key: 'wa_webhook', label: 'WhatsApp manual reply', hint: '/webhook/client-wa-reply' },
            { key: 'vb_webhook', label: 'Viber manual reply', hint: '/webhook/client-vb-reply' },
            { key: 'bot_toggle_webhook', label: 'Bot enable/disable toggle', hint: '/webhook/client-bot-toggle' },
            { key: 'resolve_attention_webhook', label: 'Resolve attention (needs human)', hint: '/webhook/client-resolve-attention' },
          ].map(({ key, label, hint }) => (
            <div key={key}>
              <label style={labelStyle}>{label}</label>
              <input style={inputStyle} type="text"
                value={form[key as keyof typeof form]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={hint} />
            </div>
          ))}

          {/* n8n SQL reference */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '12px 14px', marginTop: 8 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#fff', marginBottom: 8 }}>n8n Bot Toggle — SQL template</p>
            <pre style={{ fontSize: 10, color: '#6b7280', lineHeight: 1.6, overflow: 'auto' }}>{`-- Payload: { contact_id, platform, bot_paused }
-- WhatsApp:
UPDATE wa_sessions SET bot_paused = {{$json.bot_paused}}
WHERE sender = '{{$json.contact_id}}'
-- Viber:
UPDATE vb_sessions SET bot_paused = {{$json.bot_paused}}
WHERE sender = '{{$json.contact_id}}'`}</pre>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '12px 14px', marginTop: 8 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#fff', marginBottom: 8 }}>n8n Resolve Attention — SQL template</p>
            <pre style={{ fontSize: 10, color: '#6b7280', lineHeight: 1.6, overflow: 'auto' }}>{`-- Payload: { contact_id, conversation_key, platform, action, needs_human }
-- WhatsApp:
UPDATE wa_sessions SET needs_human = false
WHERE sender = '{{$json.contact_id}}'
-- Viber:
UPDATE vb_sessions SET needs_human = false
WHERE sender = 'viber_dm:{{$json.contact_id}}'`}</pre>
          </div>
        </div>
      )}

      {error && <p style={{ fontSize: 12, color: '#f87171' }}>{error}</p>}

      <button onClick={handleSave} disabled={saving} className="btn-primary">
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </div>
  )
}
