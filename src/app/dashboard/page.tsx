import { AppShell } from '@/components/layout/AppShell'
import { MetricCards } from '@/components/dashboard/MetricCards'
import { ActiveAgents } from '@/components/dashboard/ActiveAgents'
import { TicketQueue } from '@/components/dashboard/TicketQueue'
import { TriggerPanel } from '@/components/dashboard/TriggerPanel'
import { createClient } from '@/lib/supabase/server'
import { CURRENT_SPRINT } from '@/lib/constants'
import type { AgentRun, Ticket } from '@/types'

function formatSprintRange(start: string, end: string): string {
  const s = new Date(start)
  const e = new Date(end)
  const fmt = (d: Date) =>
    d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
  return `${fmt(s)} – ${fmt(e)} ${e.getFullYear()}`
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayIso = today.toISOString()

  const [
    { data: { user } },
    { data: activeRuns },
    { count: runsToday },
    { count: openTickets },
    { data: recentTickets },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('agent_runs')
      .select('*')
      .eq('status', 'running'),
    supabase
      .from('agent_runs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayIso),
    supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true }),
    supabase
      .from('tickets')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(5),
  ])

  return (
    <AppShell userEmail={user?.email}>
      <div className="space-y-6">
        <header>
          <h2 className="text-xl font-semibold text-text-primary font-jost">
            {CURRENT_SPRINT.name}
          </h2>
          <p className="text-sm text-text-muted mt-0.5">
            {formatSprintRange(CURRENT_SPRINT.start, CURRENT_SPRINT.end)}
          </p>
        </header>

        <MetricCards
          activeAgents={activeRuns?.length ?? 0}
          runsToday={runsToday ?? 0}
          openTickets={openTickets ?? 0}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TicketQueue initialTickets={(recentTickets as Ticket[]) ?? []} />
          <div className="space-y-4">
            <ActiveAgents initialRuns={(activeRuns as AgentRun[]) ?? []} />
            <TriggerPanel />
          </div>
        </div>
      </div>
    </AppShell>
  )
}
