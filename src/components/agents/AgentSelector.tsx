'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { AgentType } from '@/types'

interface AgentMeta {
  type: AgentType
  label: string
  description: string
  icon: string
  color: string
}

const AGENTS: AgentMeta[] = [
  {
    type: 'coding',
    label: 'Coding',
    description: 'Ouvre des PRs, implémente des features',
    icon: '⟨/⟩',
    color: 'text-blue-vo2',
  },
  {
    type: 'qa',
    label: 'QA',
    description: 'Revue de PRs, génère des tests',
    icon: '✓',
    color: 'text-vo2-green',
  },
  {
    type: 'pm',
    label: 'PM',
    description: 'Découpe les tickets, prépare les sprints',
    icon: '◈',
    color: 'text-vo2-gold',
  },
  {
    type: 'specs',
    label: 'Specs',
    description: 'Rédige des specs techniques, diagrammes',
    icon: '✦',
    color: 'text-[#C084FC]',
  },
]

export function AgentSelector() {
  const pathname = usePathname()

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {AGENTS.map(({ type, label, description, icon, color }) => {
        const active = pathname === `/agents/${type}`
        return (
          <Link
            key={type}
            href={`/agents/${type}`}
            className={[
              'card flex flex-col gap-2 transition-all hover:shadow-sm hover:border-border-accent',
              active ? 'border-blue-vo2 bg-blue-vo2-50' : '',
            ].join(' ')}
          >
            <span className={`text-xl ${color}`}>{icon}</span>
            <div>
              <p className={`text-sm font-semibold ${active ? 'text-blue-vo2' : 'text-text-primary'}`}>
                {label}
              </p>
              <p className="text-xs text-text-muted mt-0.5 leading-snug">{description}</p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
