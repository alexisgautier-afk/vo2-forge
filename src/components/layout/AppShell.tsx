import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { FreezeBanner } from './FreezeBanner'

interface AppShellProps {
  children: ReactNode
  userEmail?: string
  header?: ReactNode
}

export function AppShell({ children, userEmail, header }: AppShellProps) {
  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      <Sidebar userEmail={userEmail} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <FreezeBanner />
        <TopBar header={header} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
