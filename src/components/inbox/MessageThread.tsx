'use client'

import { useEffect, useRef } from 'react'
import { format, isToday, isYesterday } from 'date-fns'
import MessageBubble from './MessageBubble'
import type { WaMessage } from '@/types'

interface Props {
  messages: WaMessage[]
  loading?: boolean
}

function DateDivider({ date }: { date: Date }) {
  let label = format(date, 'MMMM d, yyyy')
  if (isToday(date)) label = 'Today'
  else if (isYesterday(date)) label = 'Yesterday'
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-border" />
      <span className="text-[10px] text-muted px-2">{label}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  )
}

export default function MessageThread({ messages, loading }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="space-y-3 w-full max-w-xs px-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
              <div className="h-9 bg-white/6 rounded-2xl animate-pulse" style={{ width: `${40 + (i * 11) % 30}%` }} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-center p-8">
        <div>
          <div className="w-12 h-12 rounded-2xl bg-white/4 flex items-center justify-center mx-auto mb-3">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="text-muted">
              <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className="text-sm text-white/50">No messages yet</p>
        </div>
      </div>
    )
  }

  // Group by date using created_at
  const groups: { date: string; messages: WaMessage[] }[] = []
  for (const msg of messages) {
    const dateKey = format(new Date(msg.created_at), 'yyyy-MM-dd')
    const last = groups[groups.length - 1]
    if (last?.date === dateKey) last.messages.push(msg)
    else groups.push({ date: dateKey, messages: [msg] })
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      {groups.map(({ date, messages: msgs }) => (
        <div key={date}>
          <DateDivider date={new Date(date)} />
          {msgs.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
