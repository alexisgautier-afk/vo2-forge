'use client'

import { usePathname } from 'next/navigation'
import { SectionLabel } from '@/components/ui/SectionLabel'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/agents/coding': 'Coding Agent',
  '/agents/qa': 'QA Agent',
  '/agents/pm': 'PM Agent',
  '/agents/specs': 'Specs Agent',
  '/tickets': 'Tickets Jira',
  '/queue': 'File d\'attente',
  '/environments': 'Environnements',
}

interface TopBarProps {
  userEmail?: string
}

export function TopBar({ userEmail }: TopBarProps) {
  const pathname = usePathname()
  const title = PAGE_TITLES[pathname] ?? 'VO2 Forge'

  return (
    <header className="flex items-center justify-between h-14 px-6 bg-white border-b border-border flex-shrink-0">
      <div>
        <SectionLabel>VO2 Forge</SectionLabel>
        <h1 className="text-base font-semibold text-text-primary leading-tight">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {userEmail && (
          <span className="text-xs text-text-muted">{userEmail}</span>
        )}
        <div className="size-8 rounded-full bg-blue-vo2-50 border border-blue-vo2-100 flex items-center justify-center text-blue-vo2 text-xs font-semibold">
          {userEmail ? userEmail[0].toUpperCase() : 'V'}
        </div>
      </div>
    </header>
  )
}
