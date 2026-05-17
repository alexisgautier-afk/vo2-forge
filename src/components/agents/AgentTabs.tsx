'use client'

import Link from 'next/link'
import type { AgentType } from '@/types'

interface AgentTabsProps {
  agentType: AgentType
  active: 'chat' | 'personalisation'
}

export function AgentTabs({ agentType, active }: AgentTabsProps) {
  const base = `/agents/${agentType}`

  return (
    <div className="flex gap-1 border border-border rounded-lg p-0.5 bg-subtle-bg">
      <Link
        href={base}
        className={[
          'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
          active === 'chat'
            ? 'bg-surface text-text-primary shadow-sm'
            : 'text-text-secondary hover:text-text-primary',
        ].join(' ')}
      >
        Chat
      </Link>
      <Link
        href={`${base}?tab=personalisation`}
        className={[
          'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
          active === 'personalisation'
            ? 'bg-surface text-text-primary shadow-sm'
            : 'text-text-secondary hover:text-text-primary',
        ].join(' ')}
      >
        Personalisation
      </Link>
    </div>
  )
}
