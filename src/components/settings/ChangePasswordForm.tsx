'use client'

import { useState } from 'react'
import { Eye, EyeOff, KeyRound } from 'lucide-react'

export default function ChangePasswordForm() {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  async function handleSave() {
    if (!form.current || !form.next || !form.confirm) {
      setMsg({ type: 'err', text: 'All fields are required' })
      return
    }
    if (form.next !== form.confirm) {
      setMsg({ type: 'err', text: 'New passwords do not match' })
      return
    }
    if (form.next.length < 8) {
      setMsg({ type: 'err', text: 'Password must be at least 8 characters' })
      return
    }
    setSaving(true)
    setMsg(null)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: form.current, newPassword: form.next }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setMsg({ type: 'ok', text: 'Password changed successfully' })
      setForm({ current: '', next: '', confirm: '' })
    } catch (e) {
      setMsg({ type: 'err', text: e instanceof Error ? e.message : 'Error' })
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = {
    width: '100%', background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8,
    padding: '8px 36px 8px 12px', fontSize: 13, color: '#fff',
    outline: 'none', fontFamily: 'inherit',
  }
  const labelStyle = {
    display: 'block', fontSize: 11, fontWeight: 500 as const,
    color: '#8888aa', textTransform: 'uppercase' as const,
    letterSpacing: '0.05em', marginBottom: 6,
  }

  return (
    <div className="card space-y-4">
      <h3 className="text-sm font-semibold text-white" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <KeyRound size={14} style={{ color: '#6c6fff' }} />
        Change password
      </h3>

      {[
        { key: 'current', label: 'Current password' },
        { key: 'next',    label: 'New password' },
        { key: 'confirm', label: 'Confirm new password' },
      ].map(({ key, label }) => (
        <div key={key}>
          <label style={labelStyle}>{label}</label>
          <div style={{ position: 'relative' }}>
            <input
              type={show ? 'text' : 'password'}
              style={inputStyle}
              value={form[key as keyof typeof form]}
              onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              placeholder="••••••••"
              autoComplete={key === 'current' ? 'current-password' : 'new-password'}
            />
            {key === 'current' && (
              <button type="button" onClick={() => setShow(s => !s)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                {show ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            )}
          </div>
        </div>
      ))}

      {msg && (
        <p style={{ fontSize: 12, color: msg.type === 'ok' ? '#4ade80' : '#f87171' }}>
          {msg.type === 'ok' ? '✓ ' : '✗ '}{msg.text}
        </p>
      )}

      <button onClick={handleSave} disabled={saving} className="btn-primary">
        {saving ? 'Saving…' : 'Change password'}
      </button>
    </div>
  )
}
