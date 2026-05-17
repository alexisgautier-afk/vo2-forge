import type { Milestone } from '@/types'

interface PipelineProps {
  milestones: Milestone[]
}

export function Pipeline({ milestones }: PipelineProps) {
  return (
    <div className="card space-y-4">
      <p className="label-mono">Jalons projet</p>
      <div className="space-y-3">
        {milestones.map((m) => {
          const date = new Date(m.date)
          const now = new Date()
          const daysLeft = Math.ceil((date.getTime() - now.getTime()) / 86400000)
          const isPast = m.passed
          const isNear = !isPast && daysLeft <= 30

          return (
            <div key={m.name} className="flex items-start gap-3">
              <div className={`mt-1 size-2 rounded-full shrink-0 ${
                isPast ? 'bg-vo2-green'
                : isNear ? 'bg-vo2-gold animate-pulse'
                : 'bg-border-accent'
              }`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <p className={`text-sm font-medium ${
                    isPast ? 'text-text-muted line-through' : 'text-text-primary'
                  }`}>
                    {m.name}
                  </p>
                  <p className={`text-xs shrink-0 font-mono ${
                    isPast ? 'text-text-muted'
                    : isNear ? 'text-vo2-gold font-semibold'
                    : 'text-text-muted'
                  }`}>
                    {isPast
                      ? 'Passé'
                      : daysLeft === 0 ? "Aujourd'hui"
                      : `J−${daysLeft}`}
                  </p>
                </div>
                <p className="text-xs text-text-muted mt-0.5">{m.description}</p>
                <p className="text-xs text-text-muted font-mono mt-0.5">
                  {date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
