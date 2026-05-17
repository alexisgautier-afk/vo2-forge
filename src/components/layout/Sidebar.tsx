'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TOP_NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: '⬡' },
]

const AGENTS = [
  { href: '/agents/ba',     label: 'BA',        icon: '◎' },
  { href: '/agents/pm',     label: 'PM',         icon: '◈' },
  { href: '/agents/coding', label: 'Developer',  icon: '⟨/⟩' },
  { href: '/agents/specs',  label: 'Specs',      icon: '✦' },
  { href: '/agents/qa',     label: 'QA',         icon: '✓' },
]

const BOTTOM_NAV = [
  { href: '/tickets',      label: 'Tickets',     icon: '▤' },
  { href: '/queue',        label: 'Queue',        icon: '≡' },
  { href: '/environments', label: 'Environments', icon: '◎' },
]

const linkCls = (active: boolean) => [
  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
  active
    ? 'bg-blue-vo2 text-white font-medium'
    : 'text-white/60 hover:text-white hover:bg-white/10',
].join(' ')

interface SidebarProps {
  userEmail?: string
}

export function Sidebar({ userEmail }: SidebarProps) {
  const pathname = usePathname()
  const onAgentPage = pathname.startsWith('/agents/')
  const [open, setOpen] = useState(onAgentPage)

  return (
    <aside className="flex flex-col w-56 flex-shrink-0 bg-blue-deep h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-14 border-b border-white/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://ygdrbuifqrcdwstwniay.supabase.co/storage/v1/object/sign/Assets/VO2%20Group%20Logo_White.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zMjgyMTAwNi1hMWFmLTQ0MzktYTIwNS1mNmI2YTc4MzNkZjgiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJBc3NldHMvVk8yIEdyb3VwIExvZ29fV2hpdGUucG5nIiwiaWF0IjoxNzc5MDQ3ODU4LCJleHAiOjE4MTA1ODM4NTh9.TuxKpqG84oAIp0piYee3BXEEaVEA8ZxrNjusBmP4CnY"
          alt="VO2 Group"
          className="h-7 w-auto object-contain"
        />
        <span className="text-white/40 text-sm">|</span>
        <span className="text-white/70 font-dm-sans text-sm">Forge</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        <p className="label-mono px-2 mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>nav</p>

        {TOP_NAV.map(({ href, label, icon }) => (
          <Link key={href} href={href} className={linkCls(pathname === href)}>
            <span className="w-4 text-center text-xs opacity-70">{icon}</span>
            {label}
          </Link>
        ))}

        {/* Agents dropdown */}
        <button
          onClick={() => setOpen((v) => !v)}
          className={linkCls(onAgentPage && !open) + ' w-full text-left'}
        >
          <span className="w-4 text-center text-xs opacity-70">⚙</span>
          <span className="flex-1">Agents</span>
          <span className="text-xs opacity-50">{open ? '▲' : '▼'}</span>
        </button>

        {open && (
          <div className="ml-3 pl-3 border-l border-white/10 flex flex-col gap-0.5 mt-0.5">
            {AGENTS.map(({ href, label, icon }) => (
              <Link key={href} href={href} className={linkCls(pathname.startsWith(href))}>
                <span className="w-4 text-center text-xs opacity-70">{icon}</span>
                {label}
              </Link>
            ))}
          </div>
        )}

        <div className="mt-2 flex flex-col gap-0.5">
          {BOTTOM_NAV.map(({ href, label, icon }) => (
            <Link key={href} href={href} className={linkCls(pathname === href)}>
              <span className="w-4 text-center text-xs opacity-70">{icon}</span>
              {label}
            </Link>
          ))}
        </div>
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-white/10 flex items-center gap-3">
        <div className="size-8 rounded-full bg-blue-vo2/30 border border-blue-vo2/50 flex items-center justify-center text-white text-xs font-semibold shrink-0">
          {userEmail ? userEmail[0].toUpperCase() : 'V'}
        </div>
        <p className="text-white/60 text-xs truncate">{userEmail ?? '—'}</p>
      </div>
    </aside>
  )
}
