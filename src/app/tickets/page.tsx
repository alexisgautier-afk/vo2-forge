import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/AppShell'
import { TicketBoard } from '@/components/tickets/TicketBoard'
import type { Ticket, TicketStatus } from '@/types'

interface TicketsPageProps {
  searchParams: Promise<{ filter?: string }>
}

export default async function TicketsPage({ searchParams }: TicketsPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { filter } = await searchParams

  const { data: tickets } = await supabase
    .from('tickets')
    .select('*')
    .order('created_at', { ascending: false })

  const validStatuses: TicketStatus[] = [
    'draft', 'pending_approval', 'approved', 'rejected',
    'planned', 'in_progress', 'review', 'lead_review',
    'ready_for_uat', 'ready_for_prod',
  ]
  const filterOverride = validStatuses.includes(filter as TicketStatus)
    ? (filter as TicketStatus)
    : undefined

  return (
    <AppShell userEmail={user?.email}>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-text-primary font-jost">Tickets</h2>
          <p className="text-sm text-text-muted mt-0.5">
            Proposals from the BA agent — approve to queue for development
          </p>
        </div>
        <TicketBoard initialTickets={(tickets as Ticket[]) ?? []} filterOverride={filterOverride} />
      </div>
    </AppShell>
  )
}
