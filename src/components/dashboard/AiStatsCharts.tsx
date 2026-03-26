'use client'

import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import { format } from 'date-fns'
import type { DailyAiCost, LanguageStat, DashboardStats } from '@/types'

function safeFormat(dateStr: string) {
  try {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return format(d, 'MMM d')
  } catch { return dateStr }
}

export function AiCostChart({ data }: { data: DailyAiCost[] }) {
  const totalCost = (data || []).reduce((s, d) => s + (d.cost_usd || 0), 0)
  const totalTokens = (data || []).reduce((s, d) => s + (d.total_tokens || 0), 0)
  const formatted = (data || []).map(d => ({
    ...d,
    display: safeFormat(d.date),
    cost_usd: parseFloat((d.cost_usd || 0).toFixed(4)),
  }))

  if (!data || data.length === 0) {
    return (
      <div className="card flex flex-col">
        <h3 className="text-sm font-semibold text-white mb-1">AI Cost</h3>
        <p className="text-xs mb-4" style={{ color: '#6b7280' }}>Last 30 days · gpt-4.1-mini</p>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 0' }}>
          <p className="text-xs" style={{ color: '#6b7280' }}>No AI usage data yet</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">AI Cost</h3>
          <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>Last 30 days · gpt-4.1-mini</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p className="text-sm font-bold text-white">${totalCost.toFixed(4)}</p>
          <p className="text-xs" style={{ color: '#6b7280' }}>{totalTokens.toLocaleString()} tokens</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={formatted} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="display" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
          <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
          <Tooltip
            contentStyle={{ background: '#18181f', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, fontSize: 12 }}
            formatter={(v: number) => [`$${v.toFixed(4)}`, 'Cost']}
          />
          <Area type="monotone" dataKey="cost_usd" stroke="#f59e0b" strokeWidth={2} fill="url(#costGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function AiVsManualChart({ stats }: { stats: DashboardStats }) {
  const aiOut = stats?.ai_used_count || 0
  const manualOut = stats?.manual_count || 0
  const totalOut = aiOut + manualOut || 1
  const aiPct = Math.round((aiOut / totalOut) * 100)

  // Confidence: stored as 0-1, display as %
  const confPct = stats?.avg_confidence != null
    ? stats.avg_confidence <= 1
      ? Math.round(stats.avg_confidence * 100)
      : Math.round(stats.avg_confidence)
    : null

  const data = [
    { name: 'AI auto-reply', value: aiOut, color: '#6c6fff' },
    { name: 'Manual reply', value: manualOut, color: 'rgba(255,255,255,0.12)' },
  ]

  return (
    <div className="card flex flex-col">
      <h3 className="text-sm font-semibold text-white mb-1">AI vs Manual</h3>
      <p className="text-xs mb-3" style={{ color: '#6b7280' }}>Outgoing replies</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ position: 'relative', width: 90, height: 90, flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={28} outerRadius={42} dataKey="value" strokeWidth={0}>
                {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="text-lg font-bold text-white">{aiPct}%</span>
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {data.map(d => (
            <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6b7280' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color === 'rgba(255,255,255,0.12)' ? '#444455' : d.color, display: 'inline-block' }} />
                {d.name}
              </span>
              <span className="font-semibold text-white">{d.value.toLocaleString()}</span>
            </div>
          ))}
          {confPct !== null && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ color: '#6b7280' }}>Avg AI confidence</span>
              <span className="font-semibold" style={{ color: confPct >= 80 ? '#4ade80' : confPct >= 60 ? '#fbbf24' : '#f87171' }}>
                {confPct}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const LANG_LABELS: Record<string, string> = {
  el: 'Greek', en: 'English', de: 'German', fr: 'French',
  it: 'Italian', es: 'Spanish', ru: 'Russian', unknown: 'Unknown',
}

export function LanguageChart({ data }: { data: LanguageStat[] }) {
  const formatted = (data || []).map(d => ({
    lang: d.lang,
    count: typeof d.count === 'string' ? parseInt(d.count) : (d.count || 0),
    label: LANG_LABELS[d.lang] ?? d.lang,
  }))

  if (!formatted.length) {
    return (
      <div className="card">
        <h3 className="text-sm font-semibold text-white mb-1">Languages</h3>
        <p className="text-xs mb-4" style={{ color: '#6b7280' }}>User messages · last 30 days</p>
        <p className="text-xs" style={{ color: '#6b7280' }}>No data yet</p>
      </div>
    )
  }

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-white mb-1">Languages</h3>
      <p className="text-xs mb-4" style={{ color: '#6b7280' }}>User messages · last 30 days</p>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={formatted} layout="vertical" margin={{ top: 0, right: 8, left: 8, bottom: 0 }}>
          <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="label" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} width={56} />
          <Tooltip
            contentStyle={{ background: '#18181f', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, fontSize: 12 }}
            formatter={(v: number) => [v.toLocaleString(), 'Messages']}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} fill="#6c6fff" opacity={0.8} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
