import clsx from 'clsx'
import { format } from 'date-fns'
import type { WaMessage } from '@/types'

type Message = Pick<WaMessage, 'direction' | 'text' | 'created_at' | 'message_type' | 'status' | 'intent' | 'ai_used' | 'media_url'>

export default function MessageBubble({ msg }: { msg: Message }) {
  const isOut = msg.direction === 'out'

  return (
    <div className={clsx('flex mb-2', isOut ? 'justify-end' : 'justify-start')}>
      <div className={clsx(
        'max-w-[72%] rounded-2xl px-3.5 py-2.5',
        isOut ? 'bg-accent/80 text-white rounded-br-sm' : 'bg-white/8 text-[#e2e2ea] rounded-bl-sm'
      )}>
        {msg.message_type === 'image' && msg.media_url && (
          <img
            src={msg.media_url}
            alt="image"
            onClick={() => window.open(msg.media_url!, '_blank')}
            style={{ maxWidth: 200, borderRadius: 8, cursor: 'pointer', display: 'block', marginBottom: 4 }}
          />
        )}
        {msg.message_type === 'audio' && msg.media_url && (
          <audio controls src={msg.media_url} style={{ display: 'block', marginBottom: 4 }} />
        )}
        {msg.message_type === 'video' && msg.media_url && (
          <a href={msg.media_url} target="_blank" rel="noreferrer"
            className="text-xs underline opacity-70 block mb-1">
            Open video
          </a>
        )}

        <p className="text-sm leading-relaxed break-words">
          {msg.text ?? <em className="opacity-40">[no content]</em>}
        </p>

        <div className={clsx('flex items-center gap-2 mt-1', isOut ? 'justify-end' : 'justify-start')}>
          {/* AI indicator */}
          {msg.ai_used && !isOut && (
            <span className="text-[9px] opacity-40">✦ AI</span>
          )}
          {msg.intent && !isOut && (
            <span className="text-[9px] opacity-35 truncate max-w-[80px]">{msg.intent}</span>
          )}
          <span className="text-[10px] opacity-40">
            {format(new Date(msg.created_at), 'HH:mm')}
          </span>
          {isOut && msg.status && (
            <span className="text-[10px] opacity-40">{statusIcon(msg.status)}</span>
          )}
        </div>
      </div>
    </div>
  )
}

function statusIcon(status: string) {
  switch (status) {
    case 'read':      return '✓✓'
    case 'delivered': return '✓✓'
    case 'sent':      return '✓'
    default:          return ''
  }
}
