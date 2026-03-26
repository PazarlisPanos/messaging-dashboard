'use client'

import { format, isToday, isYesterday } from 'date-fns'
import clsx from 'clsx'
import type { Conversation } from '@/types'

interface Props {
  conversations: Conversation[]
  selectedId: string | null
  onSelect: (id: string) => void
  loading?: boolean
  platform: 'whatsapp' | 'viber'
}

function formatTime(date: Date) {
  try {
    if (isNaN(date.getTime())) return ''
    if (isToday(date)) return format(date, 'HH:mm')
    if (isYesterday(date)) return 'Yesterday'
    return format(date, 'MMM d')
  } catch { return '' }
}

function getInitials(id: string) {
  return id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() || '?'
}

function avatarColor(id: string) {
  const colors = [
    'bg-blue-500/20 text-blue-300',
    'bg-purple-500/20 text-purple-300',
    'bg-green-500/20 text-green-300',
    'bg-amber-500/20 text-amber-300',
    'bg-rose-500/20 text-rose-300',
    'bg-cyan-500/20 text-cyan-300',
  ]
  let h = 0
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h)
  return colors[Math.abs(h) % colors.length]
}

export default function ConversationList({ conversations, selectedId, onSelect, loading, platform }: Props) {
  if (loading) {
    return (
      <div className="flex-1 p-4 space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-3 p-3 rounded-xl">
            <div className="w-9 h-9 rounded-full bg-white/6 animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-3 bg-white/6 rounded animate-pulse w-3/4" />
              <div className="h-2.5 bg-white/4 rounded animate-pulse w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ color: '#6b7280', marginBottom: 8, opacity: 0.5 }}>
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>No conversations yet</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.map((conv) => {
        const isSelected = conv.contact_id === selectedId
        const needsHuman = conv.needs_human
        const hasUnread = conv.unread_count > 0

        return (
          <button
            key={conv.contact_id}
            onClick={() => onSelect(conv.contact_id)}
            className={clsx(
              'w-full flex items-start gap-3 px-4 py-3 text-left transition-colors duration-100',
              'border-b',
              isSelected
                ? 'border-l-2 border-l-accent'
                : needsHuman
                ? 'border-l-2 border-l-orange-500'
                : 'border-l-transparent',
              isSelected ? 'bg-accent/8' : 'hover:bg-white/4',
            )}
            style={{ borderBottomColor: 'rgba(255,255,255,0.04)' }}
          >
            <div className={clsx(
              'w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
              avatarColor(conv.contact_id)
            )}>
              {getInitials(conv.contact_id)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {conv.display_name ?? conv.contact_id}
                  </p>
                  {needsHuman && (
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fb923c', flexShrink: 0, display: 'inline-block' }} />
                  )}
                </div>
                <span className="text-[10px] whitespace-nowrap flex-shrink-0" style={{ color: '#555566' }}>
                  {formatTime(new Date(conv.last_message_at))}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <p className="text-xs truncate" style={{ color: '#6b7280' }}>
                  {conv.last_message ?? 'No messages'}
                </p>
                {/* Only show badge if there are unread messages since last reply */}
                {hasUnread && (
                  <span style={{
                    flexShrink: 0, minWidth: 18, height: 18, borderRadius: 9, background: '#6c6fff',
                    color: '#fff', fontSize: 9, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px'
                  }}>
                    {conv.unread_count > 99 ? '99+' : conv.unread_count}
                  </span>
                )}
              </div>

              {conv.last_intent && (
                <span style={{
                  display: 'inline-block', marginTop: 3, fontSize: 9,
                  background: 'rgba(255,255,255,0.06)', color: '#6b7280',
                  padding: '1px 6px', borderRadius: 4,
                  maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                }}>
                  {conv.last_intent}
                </span>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
