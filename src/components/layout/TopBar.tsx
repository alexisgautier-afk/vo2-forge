'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { SectionLabel } from '@/components/ui/SectionLabel'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':      'Dashboard',
  '/tickets':        'Tickets',
  '/queue':          'Queue',
  '/environments':   'Environments',
}

interface TopBarProps {
  userEmail?: string
  header?: ReactNode
}

export function TopBar({ userEmail, header }: TopBarProps) {
  const pathname = usePathname()
  const title = PAGE_TITLES[pathname]

  return (
    <header className="flex items-center justify-between min-h-14 px-6 py-3 bg-white border-b border-border flex-shrink-0 gap-6">
      {header ?? (
        <div>
          {title && <SectionLabel className="mb-0.5">{title}</SectionLabel>}
          <h1 className="text-base font-semibold text-text-primary leading-tight">{title ?? 'VO2 Forge'}</h1>
        </div>
      )}

      <div className="flex items-center gap-3 shrink-0 ml-auto">
        {userEmail && (
          <span className="text-xs text-text-muted hidden sm:block">{userEmail}</span>
        )}
        <div className="size-8 rounded-full bg-blue-vo2-50 border border-blue-vo2-100 flex items-center justify-center text-blue-vo2 text-xs font-semibold">
          {userEmail ? userEmail[0].toUpperCase() : 'V'}
        </div>
      </div>
    </header>
  )
}
