'use client'

import { useRouter } from 'next/navigation'
import { SectionLabel } from '@/components/ui/SectionLabel'
import type { AgentType } from '@/types'

interface AgentConfig {
  type: AgentType
  label: string
  icon: string
  colorClass: string
}

const agents: AgentConfig[] = [
  { type: 'coding', label: 'Coding', icon: '⟨/⟩', colorClass: 'text-blue-vo2' },
  { type: 'qa', label: 'QA', icon: '✓', colorClass: 'text-vo2-green' },
  { type: 'pm', label: 'PM', icon: '◈', colorClass: 'text-vo2-gold' },
  { type: 'specs', label: 'Specs', icon: '✦', colorClass: 'text-[#C084FC]' },
]

export function TriggerPanel() {
  const router = useRouter()

  return (
    <div className="card space-y-3">
      <SectionLabel>Lancer un agent</SectionLabel>
      <div className="grid grid-cols-2 gap-2">
        {agents.map(({ type, label, icon, colorClass }) => (
          <button
            key={type}
            onClick={() => router.push(`/agents/${type}`)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-surface hover:bg-subtle-bg transition-colors text-left"
          >
            <span className={`text-base leading-none ${colorClass}`}>{icon}</span>
            <span className="text-sm font-medium text-text-primary font-dm-sans">{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
