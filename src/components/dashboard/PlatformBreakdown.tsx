'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { PeakHour, DashboardStats } from '@/types'

export function PlatformBreakdown({ stats }: { stats: DashboardStats }) {
  const wa = stats?.wa_messages || 0
  const vb = stats?.vb_messages || 0
  const total = wa + vb || 1
  const waPercent = Math.round((wa / total) * 100)
  const vbPercent = 100 - waPercent

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-white mb-4">Platform split</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 11 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#ccc' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#25d366', display: 'inline-block' }} />
              WhatsApp
            </span>
            <span style={{ fontWeight: 600, color: '#fff' }}>
              {wa.toLocaleString()} <span style={{ color: '#6b7280', fontWeight: 400 }}>({waPercent}%)</span>
            </span>
          </div>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: '#25d366', borderRadius: 99, width: `${waPercent}%`, transition: 'width 0.7s' }} />
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 11 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#ccc' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#7360f2', display: 'inline-block' }} />
              Viber
            </span>
            <span style={{ fontWeight: 600, color: '#fff' }}>
              {vb.toLocaleString()} <span style={{ color: '#6b7280', fontWeight: 400 }}>({vbPercent}%)</span>
            </span>
          </div>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: '#7360f2', borderRadius: 99, width: `${vbPercent}%`, transition: 'width 0.7s' }} />
          </div>
        </div>
        <div style={{ paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 6 }}>
            <span style={{ color: '#6b7280' }}>Response rate</span>
            <span style={{ fontWeight: 600, color: '#fff' }}>
              {stats?.incoming_messages > 0
                ? `${Math.round((stats.outgoing_messages / stats.incoming_messages) * 100)}%`
                : '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function PeakHoursChart({ data }: { data: PeakHour[] }) {
  const safeData = (data || []).filter(d => d && typeof d.hour === 'number')
  const max = safeData.length > 0 ? Math.max(...safeData.map(d => d.count), 1) : 1

  const formatted = safeData.map(d => ({
    ...d,
    label: `${String(d.hour).padStart(2, '0')}:00`,
  }))

  return (
    <div className="card">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">Peak activity</h3>
        <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>Messages by hour (last 30 days)</p>
      </div>
      {formatted.length === 0 ? (
        <p className="text-xs" style={{ color: '#6b7280' }}>No data yet</p>
      ) : (
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={formatted} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} interval={3} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: '#18181f', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, fontSize: 12, color: '#e2e2ea' }}
              formatter={(v: number) => [v.toLocaleString(), 'Messages']}
            />
            <Bar dataKey="count" radius={[3, 3, 0, 0]}>
              {formatted.map((entry, i) => (
                <Cell key={i} fill={entry.count === max ? '#6c6fff' : 'rgba(255,255,255,0.1)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
