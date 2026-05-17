'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: '⬡' },
  { href: '/agents/coding', label: 'Coding Agent', icon: '⟨/⟩' },
  { href: '/agents/qa', label: 'QA Agent', icon: '✓' },
  { href: '/agents/pm', label: 'PM Agent', icon: '◈' },
  { href: '/agents/specs', label: 'Specs Agent', icon: '✦' },
  { href: '/tickets', label: 'Tickets', icon: '▤' },
  { href: '/queue', label: 'Queue', icon: '≡' },
  { href: '/environments', label: 'Environments', icon: '◎' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex flex-col w-56 flex-shrink-0 bg-blue-deep h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 h-14 border-b border-white/10">
        <span className="text-white font-jost font-bold text-base tracking-tight">VO2</span>
        <span className="text-white/40 text-sm">|</span>
        <span className="text-white/70 font-dm-sans text-sm">Forge</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        <p className="label-mono px-2 mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
          nav
        </p>
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={[
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                active
                  ? 'bg-blue-vo2 text-white font-medium'
                  : 'text-white/60 hover:text-white hover:bg-white/10',
              ].join(' ')}
            >
              <span className="w-4 text-center text-xs opacity-70">{icon}</span>
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Sprint badge */}
      <div className="px-5 py-4 border-t border-white/10">
        <p className="label-mono mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Current sprint</p>
        <p className="text-white/80 text-xs font-medium">Sprint 12</p>
        <p className="text-white/40 text-xs">May 12 – 26, 2026</p>
      </div>
    </aside>
  )
}
