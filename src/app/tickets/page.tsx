import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/AppShell'
import { TicketBoard } from '@/components/tickets/TicketBoard'
import type { Ticket } from '@/types'

export default async function TicketsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: tickets } = await supabase
    .from('tickets')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <AppShell userEmail={user?.email}>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-text-primary font-jost">Tickets</h2>
          <p className="text-sm text-text-muted mt-0.5">
            Gestion des tickets du projet SMCP
          </p>
        </div>
        <TicketBoard initialTickets={(tickets as Ticket[]) ?? []} />
      </div>
    </AppShell>
  )
}
