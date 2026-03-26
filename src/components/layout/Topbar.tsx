'use client'

import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'

interface Props {
  clientName?: string
}

export default function Topbar({ clientName }: Props) {
  const router = useRouter()

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-border bg-surface-1/50 backdrop-blur-sm flex-shrink-0">
      <div className="flex items-center gap-2">
        {clientName && (
          <span className="text-xs text-muted bg-white/5 border border-border px-2 py-1 rounded-lg font-mono">
            {clientName}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => router.refresh()}
          className="btn-ghost py-1.5 px-2"
          title="Refresh data"
        >
          <RefreshCw size={14} />
        </button>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/4 border border-border">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-[#8888aa]">Live</span>
        </div>
      </div>
    </header>
  )
}
