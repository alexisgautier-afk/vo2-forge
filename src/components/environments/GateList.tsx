import { StatusDot } from '@/components/ui/StatusDot'
import type { Gate } from '@/types'

interface GateListProps {
  gates: Gate[]
}

const gateStatusLabel: Record<string, string> = {
  validated: 'Validated',
  pending: 'Pending',
  locked: 'Locked',
}

export function GateList({ gates }: GateListProps) {
  return (
    <div className="card space-y-1">
      {gates.map((gate, i) => (
        <div key={gate.id}>
          <div className="flex items-start gap-3 py-2.5">
            <div className="flex flex-col items-center gap-1 pt-1 shrink-0">
              <StatusDot status={gate.status} />
              {i < gates.length - 1 && (
                <div className="w-px h-5 bg-border" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-text-primary">{gate.name}</p>
                <p className={`text-xs shrink-0 ${
                  gate.status === 'validated' ? 'text-vo2-green'
                  : gate.status === 'locked' ? 'text-text-muted'
                  : 'text-vo2-gold'
                }`}>
                  {gateStatusLabel[gate.status]}
                </p>
              </div>
              <p className="text-xs text-text-muted mt-0.5">{gate.description}</p>
              <p className="text-xs text-text-muted font-mono mt-0.5">{gate.responsible}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
