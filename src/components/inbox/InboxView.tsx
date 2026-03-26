'use client'

import { useState, useCallback, useEffect } from 'react'
import ConversationList from './ConversationList'
import MessageThread from './MessageThread'
import ReplyBox from './ReplyBox'
import BotToggleButton from './BotToggleButton'
import type { Conversation, WaMessage, Platform } from '@/types'
import { Search, AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react'

interface Props {
  platform: Platform
  initialConversations: Conversation[]
  clientSlug: string
  waWebhook?: string | null
  vbWebhook?: string | null
  botToggleWebhook?: string | null
}

export default function InboxView({
  platform, initialConversations, clientSlug,
  waWebhook, vbWebhook, botToggleWebhook,
}: Props) {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<WaMessage[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [loadingConvs, setLoadingConvs] = useState(false)
  const [search, setSearch] = useState('')
  const [lastRefresh, setLastRefresh] = useState(new Date())
  // Mobile: show thread when conversation selected
  const [mobileView, setMobileView] = useState<'list' | 'thread'>('list')

  const selectedConv = conversations.find(c => c.contact_id === selectedId)
  const hasReply = platform === 'whatsapp' ? !!waWebhook : !!vbWebhook
  const hasBotWebhook = !!botToggleWebhook

  const refreshConversations = useCallback(async (silent = false) => {
    if (!silent) setLoadingConvs(true)
    try {
      const res = await fetch(`/api/conversations?client=${encodeURIComponent(clientSlug)}&platform=${platform}`)
      const data = await res.json()
      if (data.conversations) {
        setConversations(data.conversations)
        setLastRefresh(new Date())
      }
    } catch { }
    finally { if (!silent) setLoadingConvs(false) }
  }, [clientSlug, platform])

  useEffect(() => {
    const interval = setInterval(() => refreshConversations(true), 30000)
    return () => clearInterval(interval)
  }, [refreshConversations])

  const loadMessages = useCallback(async (contactId: string) => {
    setLoadingMessages(true)
    try {
      const res = await fetch(`/api/messages?client=${encodeURIComponent(clientSlug)}&contact_id=${encodeURIComponent(contactId)}&platform=${platform}`)
      const data = await res.json()
      setMessages(data.messages ?? [])
    } catch { setMessages([]) }
    finally { setLoadingMessages(false) }
  }, [clientSlug, platform])

  function handleSelect(id: string) {
    setSelectedId(id)
    loadMessages(id)
    setMobileView('thread') // switch to thread on mobile
  }

  function handleBack() {
    setMobileView('list')
    setSelectedId(null)
  }

  const filtered = search.trim()
    ? conversations.filter(c =>
        c.contact_id.toLowerCase().includes(search.toLowerCase()) ||
        c.display_name?.toLowerCase().includes(search.toLowerCase())
      )
    : conversations

  const needsHumanCount = conversations.filter(c => c.needs_human).length
  const platformLabel = platform === 'whatsapp' ? 'WhatsApp' : 'Viber'

  // ── Shared panels ──────────────────────────────────────────────────────────

  const listPanel = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{platformLabel}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {needsHumanCount > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 600, color: '#fb923c', background: 'rgba(249,115,22,0.1)', padding: '2px 7px', borderRadius: 99 }}>
                <AlertTriangle size={9} /> {needsHumanCount}
              </span>
            )}
            <span style={{ fontSize: 11, fontWeight: 600, color: platform === 'whatsapp' ? '#25d366' : '#9b8fff' }}>
              {conversations.length} chats
            </span>
            <button onClick={() => refreshConversations(false)} disabled={loadingConvs}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 2, display: 'flex' }}>
              <RefreshCw size={12} style={{ animation: loadingConvs ? 'spin 1s linear infinite' : 'none' }} />
            </button>
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
          <input type="text" className="input"
            style={{ paddingLeft: 30, paddingTop: 7, paddingBottom: 7, fontSize: 12 }}
            placeholder="Search conversations…" value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>
        <p style={{ fontSize: 9, color: '#555566', marginTop: 5, textAlign: 'right' }}>
          Updated {lastRefresh.toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <ConversationList conversations={filtered} selectedId={selectedId} onSelect={handleSelect} platform={platform} />
      </div>
    </div>
  )

  const threadPanel = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {selectedConv ? (
        <>
          {/* Thread header */}
          <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            {/* Back button (mobile only) */}
            <button onClick={handleBack} className="block md:hidden"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a8aaff', padding: '4px 2px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <ArrowLeft size={20} />
            </button>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(108,111,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#6c6fff', flexShrink: 0 }}>
              {selectedConv.contact_id.slice(0, 2).toUpperCase()}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selectedConv.display_name ?? selectedConv.contact_id}
              </p>
              <p style={{ fontSize: 10, color: '#6b7280' }}>{selectedConv.contact_id}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              {selectedConv.needs_human && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9, fontWeight: 600, color: '#fb923c', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)', padding: '3px 6px', borderRadius: 6 }}>
                  <AlertTriangle size={9} /> Attention
                </span>
              )}
              {selectedConv.lang && (
                <span style={{ fontSize: 9, color: '#6b7280', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)', padding: '3px 6px', borderRadius: 6, textTransform: 'uppercase' }}>
                  {selectedConv.lang}
                </span>
              )}
              <span className={platform === 'whatsapp' ? 'tag-wa' : 'tag-vb'} style={{ fontSize: 9 }}>{platformLabel}</span>
                <BotToggleButton
                  contactId={selectedConv.contact_id}
                  conversationKey={selectedConv.conversation_key}
                  clientSlug={clientSlug}
                  platform={platform}
                  initialBotPaused={selectedConv.bot_paused ?? false}
                  hasBotWebhook={hasBotWebhook}
                  onToggled={() => refreshConversations(true)}
                />
            </div>
          </div>

          <MessageThread messages={messages} loading={loadingMessages} />

          {hasReply ? (
            <ReplyBox contactId={selectedConv.contact_id} platform={platform} clientSlug={clientSlug} onMessageSent={() => loadMessages(selectedConv.contact_id)} />
          ) : (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '10px 14px', textAlign: 'center' }}>
              <p style={{ fontSize: 11, color: '#6b7280' }}>No {platformLabel} webhook — add in Settings</p>
            </div>
          )}
        </>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 32 }}>
          <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ color: '#6b7280', marginBottom: 12 }}>
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Select a conversation</p>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Desktop: side by side */}
      <div className="hidden md:flex" style={{ height: '100%', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', background: '#111118' }}>
        <div style={{ width: 300, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          {listPanel}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {threadPanel}
        </div>
      </div>

      {/* Mobile: toggle between list and thread */}
      <div className="block md:hidden" style={{ height: '100%', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', background: '#111118' }}>
        {mobileView === 'list' ? listPanel : threadPanel}
      </div>

      <style>{`@keyframes spin { from{transform:rotate(0deg)}to{transform:rotate(360deg)} }`}</style>
    </>
  )
}
