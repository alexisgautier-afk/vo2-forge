type DotStatus = 'healthy' | 'degraded' | 'offline' | 'pending' | 'running' | 'done' | 'error'

const dotClasses: Record<DotStatus, string> = {
  healthy: 'bg-vo2-green',
  done: 'bg-vo2-green',
  degraded: 'bg-vo2-gold',
  pending: 'bg-vo2-gold',
  offline: 'bg-[#DC2626]',
  error: 'bg-[#DC2626]',
  running: 'bg-blue-vo2 animate-pulse',
}

interface StatusDotProps {
  status: DotStatus
  label?: string
  className?: string
}

export function StatusDot({ status, label, className = '' }: StatusDotProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className={`size-2 rounded-full flex-shrink-0 ${dotClasses[status]}`} />
      {label && <span className="text-xs text-text-secondary">{label}</span>}
    </span>
  )
}
