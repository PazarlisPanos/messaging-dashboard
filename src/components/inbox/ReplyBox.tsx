'use client'

import { useState, useRef } from 'react'
import { Send } from 'lucide-react'
import clsx from 'clsx'
import type { Platform } from '@/types'

interface Props {
  contactId: string
  platform: Platform
  clientSlug: string
  sessionId?: string
  onMessageSent?: () => void  // callback to reload messages
}

export default function ReplyBox({ contactId, platform, clientSlug, sessionId, onMessageSent }: Props) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  async function handleSend() {
    if (!message.trim() || sending) return
    setSending(true)
    setError('')

    try {
      const res = await fetch('/api/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_slug: clientSlug,
          platform,
          contact_id: contactId,
          message: message.trim(),
          session_id: sessionId,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to send')
      }
      setMessage('')
      setSent(true)
      setTimeout(() => setSent(false), 2000)
      textareaRef.current?.focus()
      // Reload messages after 1 second (give n8n time to write to DB)
      setTimeout(() => onMessageSent?.(), 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Send failed')
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '10px 14px', background: 'rgba(17,17,24,0.6)', flexShrink: 0 }}>
      {error && (
        <div style={{ marginBottom: 8, fontSize: 11, color: '#f87171', display: 'flex', alignItems: 'center', gap: 5 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
        <textarea
          ref={textareaRef}
          rows={1}
          className="input flex-1 resize-none"
          style={{ maxHeight: 128, lineHeight: 1.5 }}
          placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
          value={message}
          onChange={e => {
            setMessage(e.target.value)
            e.target.style.height = 'auto'
            e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px'
          }}
          onKeyDown={handleKeyDown}
          disabled={sending}
        />
        <button
          onClick={handleSend}
          disabled={!message.trim() || sending}
          style={{
            flexShrink: 0, width: 36, height: 36, borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: 'none', cursor: 'pointer', transition: 'all 0.15s',
            background: sent ? 'rgba(74,222,128,0.2)' : '#6c6fff',
            opacity: (!message.trim() || sending) ? 0.3 : 1,
          }}
        >
          {sending ? (
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" style={{ width: 14, height: 14 }}>
              <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.2"/>
              <path d="M12 2a10 10 0 0110 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          ) : sent ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          ) : (
            <Send size={14} color="white" />
          )}
        </button>
      </div>
    </div>
  )
}
