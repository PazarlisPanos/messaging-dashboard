import { getClient } from '@/lib/clients'
import {
  getDashboardStats, getDailyMessages, getPeakHours,
  getLanguageStats, getDailyAiCost, getBotPausedCount, getAiCostByPlatform,
  getTopIntent, getFallbackRate, getResolvedToday, getAvgResponseTime,
} from '@/lib/queries'
import { notFound } from 'next/navigation'
import StatCard from '@/components/dashboard/StatCard'
import MessagesChart from '@/components/dashboard/MessagesChart'
import { PlatformBreakdown, PeakHoursChart } from '@/components/dashboard/PlatformBreakdown'
import { AiCostChart, AiVsManualChart, LanguageChart, AiCostByPlatformCard } from '@/components/dashboard/AiStatsCharts'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  MessageCircle, ArrowDownLeft, ArrowUpRight,
  Users, MessageSquare, Smartphone, CalendarDays, AlertTriangle, BotOff,
  CheckCircle, Clock,
} from 'lucide-react'

export const revalidate = 60

const EMPTY_STATS = {
  total_messages: 0, incoming_messages: 0, outgoing_messages: 0,
  unique_contacts: 0, total_conversations: 0, wa_messages: 0,
  vb_messages: 0, messages_today: 0, needs_human_count: 0,
  ai_used_count: 0, manual_count: 0, avg_confidence: null,
  conversations_answered: 0,
}

function formatResponseTime(seconds: number | null): string {
  if (!seconds) return '—'
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

export default async function ClientDashboardPage({ params }: { params: { client: string } }) {
  const client = await getClient(params.client)
  if (!client) notFound()

  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role ?? 'operator'
  const isSuperAdmin = role === 'super_admin'

  const db = client.database_url

  const [stats, daily, peaks, langs, botPausedCount, topIntent, resolvedToday, fallbackRate, avgResponseTime] = await Promise.all([
    getDashboardStats(db).catch(() => EMPTY_STATS),
    getDailyMessages(db).catch(() => []),
    getPeakHours(db).catch(() => []),
    getLanguageStats(db).catch(() => []),
    getBotPausedCount(db).catch(() => 0),
    getTopIntent(db).catch(() => null),
    getResolvedToday(db).catch(() => 0),
    getFallbackRate(db).catch(() => ({ with_fallback: 0, total: 0 })),
    getAvgResponseTime(db).catch(() => null),
  ])

  const [aiCost, aiCostByPlatform] = isSuperAdmin
    ? await Promise.all([
        getDailyAiCost(db).catch(() => []),
        getAiCostByPlatform(db).catch(() => []),
      ])
    : [[], []]

  const conversationsAnsweredPct = stats.unique_contacts > 0
    ? Math.round((stats.conversations_answered / stats.unique_contacts) * 100)
    : 0

  const fallbackPct = fallbackRate.total > 0
    ? `${((fallbackRate.with_fallback / fallbackRate.total) * 100).toFixed(1)}%`
    : '—'

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Overview</h2>
          <p className="text-sm mt-0.5" style={{ color: '#6b7280' }}>Real-time messaging analytics</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {stats.needs_human_count > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)' }}>
              <AlertTriangle size={14} style={{ color: '#fb923c' }} />
              <span className="text-xs font-semibold" style={{ color: '#fb923c' }}>
                {stats.needs_human_count} conversation{stats.needs_human_count !== 1 ? 's' : ''} need attention
              </span>
            </div>
          )}
          {botPausedCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)' }}>
              <BotOff size={14} style={{ color: '#a78bfa' }} />
              <span className="text-xs font-semibold" style={{ color: '#a78bfa' }}>
                {botPausedCount} bot{botPausedCount !== 1 ? 's' : ''} paused
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total messages"    value={stats.total_messages}     icon={MessageCircle} iconColor="text-accent" />
        <StatCard label="Incoming"          value={stats.incoming_messages}  icon={ArrowDownLeft} iconColor="text-blue-400" />
        <StatCard label="Outgoing"          value={stats.outgoing_messages}  icon={ArrowUpRight}  iconColor="text-green-400" />
        <StatCard label="Unique contacts"   value={stats.unique_contacts}    icon={Users}         iconColor="text-purple-400" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="WhatsApp messages" value={stats.wa_messages}        icon={MessageSquare} iconColor="text-wa" />
        <StatCard label="Viber messages"    value={stats.vb_messages}        icon={Smartphone}    iconColor="text-vb" />
        <StatCard label="Messages today"    value={stats.messages_today}     icon={CalendarDays}  iconColor="text-cyan-400" />
        <StatCard
          label="Need attention"
          value={stats.needs_human_count}
          icon={AlertTriangle}
          iconColor={stats.needs_human_count > 0 ? 'text-orange-400' : 'text-muted'}
        />
        <StatCard
          label="Bot paused"
          value={botPausedCount}
          icon={BotOff}
          iconColor={botPausedCount > 0 ? 'text-purple-400' : 'text-muted'}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Top intent"
          value={topIntent?.intent ?? '—'}
          icon={MessageCircle}
          iconColor="text-cyan-400"
        />
        <StatCard
          label="Resolved today"
          value={resolvedToday}
          icon={CheckCircle}
          iconColor="text-green-400"
        />
        <StatCard
          label="Fallback rate"
          value={fallbackPct}
          icon={AlertTriangle}
          iconColor="text-amber-400"
        />
        <StatCard
          label="Avg response time"
          value={formatResponseTime(avgResponseTime)}
          icon={Clock}
          iconColor="text-blue-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2"><MessagesChart data={daily} /></div>
        <PlatformBreakdown stats={stats} />
      </div>

      {isSuperAdmin && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <AiCostChart data={aiCost} />
            <AiVsManualChart stats={stats} />
            <LanguageChart data={langs} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <AiCostByPlatformCard data={aiCostByPlatform} />
          </div>
        </>
      )}

      {!isSuperAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <LanguageChart data={langs} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PeakHoursChart data={peaks} />
        <div className="card">
          <h3 className="text-sm font-semibold text-white mb-4">Quick stats</h3>
          <div className="space-y-0">
            {[
              {
                label: 'Avg messages / day',
                value: daily.length > 0
                  ? Math.round(daily.reduce((a, d) => a + d.incoming + d.outgoing, 0) / daily.length).toLocaleString()
                  : '—',
              },
              {
                label: 'Conversations answered',
                value: stats.unique_contacts > 0 ? `${conversationsAnsweredPct}%` : '—',
              },
              {
                label: 'Peak hour',
                value: peaks.length > 0
                  ? `${String(peaks.reduce((a, b) => a.count > b.count ? a : b).hour).padStart(2, '0')}:00`
                  : '—',
              },
              ...(isSuperAdmin ? [
                {
                  label: 'AI automation rate',
                  value: stats.total_messages > 0
                    ? `${Math.round((stats.ai_used_count / stats.total_messages) * 100)}%`
                    : '—',
                },
                {
                  label: 'Total AI cost (30d)',
                  value: aiCost.length > 0
                    ? `$${aiCost.reduce((s, d) => s + d.cost_usd, 0).toFixed(4)}`
                    : '—',
                },
              ] : []),
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-3"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-xs" style={{ color: '#6b7280' }}>{label}</span>
                <span className="text-sm font-semibold text-white">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
