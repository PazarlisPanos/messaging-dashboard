'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { format } from 'date-fns'
import type { DailyMessageCount } from '@/types'

interface Props { data: DailyMessageCount[] }

function safeFormat(dateStr: string) {
  try {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return format(d, 'MMM d')
  } catch { return dateStr }
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#18181f', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '10px 12px', fontSize: 12 }}>
      <p style={{ color: '#6b7280', marginBottom: 6 }}>{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <span style={{ color: p.color }}>●</span>
          <span style={{ color: '#fff' }}>{p.name}:</span>
          <span style={{ color: p.color, fontWeight: 600 }}>{p.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

export default function MessagesChart({ data }: Props) {
  const formatted = (data || []).map(d => ({
    ...d,
    displayDate: safeFormat(d.date),
  }))

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-white">Messages over time</h3>
          <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>Last 14 days</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: '#6b7280' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6c6fff', display: 'inline-block' }} />
            Incoming
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#25d366', display: 'inline-block' }} />
            Outgoing
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={formatted} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="incoming" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6c6fff" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#6c6fff" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="outgoing" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#25d366" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#25d366" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="displayDate" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="incoming" name="Incoming" stroke="#6c6fff" strokeWidth={2} fill="url(#incoming)" />
          <Area type="monotone" dataKey="outgoing" name="Outgoing" stroke="#25d366" strokeWidth={2} fill="url(#outgoing)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
