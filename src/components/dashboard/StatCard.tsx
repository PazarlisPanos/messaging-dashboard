import clsx from 'clsx'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  icon: LucideIcon
  iconColor?: string
  trend?: { value: number; label: string }
}

export default function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  iconColor = 'text-accent',
  trend,
}: StatCardProps) {
  return (
    <div className="card flex flex-col gap-4 hover:border-white/10 transition-colors duration-200">
      <div className="flex items-start justify-between">
        <div
          className={clsx(
            'w-9 h-9 rounded-xl flex items-center justify-center',
            'bg-white/5 border border-white/8'
          )}
        >
          <Icon size={16} className={iconColor} />
        </div>
        {trend && (
          <span
            className={clsx(
              'text-xs font-medium px-2 py-0.5 rounded-full',
              trend.value >= 0
                ? 'text-green-400 bg-green-400/10'
                : 'text-red-400 bg-red-400/10'
            )}
          >
            {trend.value >= 0 ? '+' : ''}{trend.value}%
          </span>
        )}
      </div>

      <div>
        <p className="text-2xl font-bold text-white tracking-tight">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        <p className="text-xs text-muted mt-0.5">{label}</p>
        {sub && <p className="text-xs text-[#555566] mt-1">{sub}</p>}
      </div>
    </div>
  )
}
