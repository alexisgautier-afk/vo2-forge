'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { CURRENT_SPRINT } from '@/lib/constants'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':    'Dashboard',
  '/tickets':      'Tickets',
  '/queue':        'Queue',
  '/environments': 'Environments',
}

interface TopBarProps {
  header?: ReactNode
}

export function TopBar({ header }: TopBarProps) {
  const pathname = usePathname()
  const title = PAGE_TITLES[pathname]

  const sprintStart = new Date(CURRENT_SPRINT.start).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })
  const sprintEnd   = new Date(CURRENT_SPRINT.end).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })

  return (
    <header className="flex items-center justify-between min-h-14 px-6 py-3 bg-white border-b border-border flex-shrink-0 gap-6">
      {header ?? (
        <div>
          {title && <SectionLabel className="mb-0.5">{title}</SectionLabel>}
          <h1 className="text-base font-semibold text-text-primary leading-tight">{title ?? 'VO2 Forge'}</h1>
        </div>
      )}

      <div className="flex items-center gap-4 shrink-0 ml-auto">
        <div className="text-right">
          <p className="text-xs font-medium text-text-primary">{CURRENT_SPRINT.name}</p>
          <p className="text-xs text-text-muted">{sprintStart} – {sprintEnd}</p>
        </div>
      </div>
    </header>
  )
}
