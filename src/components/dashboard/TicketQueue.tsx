'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/Badge'
import { SectionLabel } from '@/components/ui/SectionLabel'
import type { Ticket, TicketStatus } from '@/types'
import type { BadgeVariant } from '@/components/ui/Badge'

const statusConfig: Record<TicketStatus, { variant: BadgeVariant; label: string }> = {
  ready: { variant: 'muted', label: 'prêt' },
  in_progress: { variant: 'default', label: 'en cours' },
  review: { variant: 'warning', label: 'review' },
  blocked: { variant: 'error', label: 'bloqué' },
}

interface TicketQueueProps {
  initialTickets: Ticket[]
}

export function TicketQueue({ initialTickets }: TicketQueueProps) {
  const { data: tickets } = useQuery<Ticket[]>({
    queryKey: ['tickets', 'recent'],
    queryFn: () => fetch('/api/tickets').then((r) => r.json()),
    initialData: initialTickets,
  })

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <SectionLabel>Tickets récents</SectionLabel>
        <Link
          href="/tickets"
          className="text-xs text-blue-vo2 hover:underline font-dm-sans"
        >
          Voir tous les tickets →
        </Link>
      </div>

      {tickets.length === 0 ? (
        <p className="text-sm text-text-muted py-4 text-center">
          Aucun ticket pour ce sprint
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {tickets.slice(0, 5).map((ticket) => {
            const { variant, label } = statusConfig[ticket.status]
            return (
              <li key={ticket.id} className="flex items-center justify-between py-2.5 gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-text-primary font-medium truncate">
                    {ticket.name}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">{ticket.id}</p>
                </div>
                <Badge variant={variant}>{label}</Badge>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
