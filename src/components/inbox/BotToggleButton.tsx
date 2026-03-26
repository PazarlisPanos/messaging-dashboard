'use client'

import { useState } from 'react'
import { Bot, BotOff } from 'lucide-react'
import clsx from 'clsx'

interface Props {
  contactId: string
  conversationKey: string | null | undefined
  clientSlug: string
  platform: 'whatsapp' | 'viber'
  initialBotPaused: boolean  // bot_paused field (not needs_human)
  hasBotWebhook: boolean
  onToggled?: () => void     // callback to refresh conversations
}

export default function BotToggleButton({
  contactId, conversationKey, clientSlug, platform,
  initialBotPaused, hasBotWebhook, onToggled,
}: Props) {
  const [botPaused, setBotPaused] = useState(initialBotPaused)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const botActive = !botPaused

  async function toggle() {
    if (loading || !hasBotWebhook) return
    setLoading(true)
    setError('')

    const action = botActive ? 'disable' : 'enable'

    try {
      const res = await fetch('/api/bot-toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_slug: clientSlug,
          contact_id: contactId,
          conversation_key: conversationKey,
          platform,                    // whatsapp | viber
          action,
          bot_paused: action === 'disable',
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed')
      }

      setBotPaused(action === 'disable')
      // Refresh conversations list to update orange dot
      setTimeout(() => onToggled?.(), 500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
      setTimeout(() => setError(''), 3000)
    } finally {
      setLoading(false)
    }
  }

  if (!hasBotWebhook) {
    return (
      <div title="Add bot toggle webhook in Settings"
        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 9px', borderRadius: 8, fontSize: 11, color: '#6b7280', border: '1px solid rgba(255,255,255,0.08)', opacity: 0.5, cursor: 'not-allowed' }}>
        <BotOff size={12} /> Bot
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
      <button
        onClick={toggle}
        disabled={loading}
        title={botActive ? 'Bot ON — click to pause for manual reply' : 'Bot PAUSED — click to resume AI'}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '5px 9px', borderRadius: 8, fontSize: 11, fontWeight: 500,
          border: `1px solid ${botActive ? 'rgba(74,222,128,0.25)' : 'rgba(249,115,22,0.25)'}`,
          background: botActive ? 'rgba(74,222,128,0.08)' : 'rgba(249,115,22,0.08)',
          color: botActive ? '#4ade80' : '#fb923c',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.5 : 1,
          transition: 'all 0.15s',
        }}
      >
        {loading ? (
          <svg className="animate-spin" style={{ width: 12, height: 12 }} viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
            <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
          </svg>
        ) : botActive ? <Bot size={12} /> : <BotOff size={12} />}
        {botActive ? 'Bot ON' : 'Bot OFF'}
      </button>
      {error && <span style={{ fontSize: 9, color: '#f87171' }}>{error}</span>}
    </div>
  )
}
