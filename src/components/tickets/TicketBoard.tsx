'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { TicketForm } from '@/components/tickets/TicketForm'
import type { Ticket, TicketStatus, TicketPriority } from '@/types'
import type { BadgeVariant } from '@/components/ui/Badge'

const statusConfig: Record<TicketStatus, { variant: BadgeVariant; label: string }> = {
  ready: { variant: 'muted', label: 'Ready' },
  in_progress: { variant: 'default', label: 'In progress' },
  review: { variant: 'warning', label: 'Review' },
  blocked: { variant: 'error', label: 'Blocked' },
}

const priorityConfig: Record<TicketPriority, { variant: BadgeVariant; label: string }> = {
  low: { variant: 'muted', label: 'Low' },
  medium: { variant: 'info', label: 'Medium' },
  high: { variant: 'warning', label: 'High' },
  critical: { variant: 'error', label: 'Critical' },
}

const STATUS_FILTERS: { value: TicketStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'ready', label: 'Ready' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'review', label: 'Review' },
  { value: 'blocked', label: 'Blocked' },
]

interface TicketBoardProps {
  initialTickets: Ticket[]
}

export function TicketBoard({ initialTickets }: TicketBoardProps) {
  const qc = useQueryClient()
  const [filter, setFilter] = useState<TicketStatus | 'all'>('all')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Ticket | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const { data: tickets } = useQuery<Ticket[]>({
    queryKey: ['tickets'],
    queryFn: () => fetch('/api/tickets').then((r) => r.json()),
    initialData: initialTickets,
  })

  const visible = filter === 'all' ? tickets : tickets.filter((t) => t.status === filter)

  async function handleDelete(id: string) {
    setDeleting(id)
    await fetch(`/api/tickets/${id}`, { method: 'DELETE' })
    await qc.invalidateQueries({ queryKey: ['tickets'] })
    setDeleting(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-1">
          {STATUS_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={[
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                filter === value
                  ? 'bg-blue-vo2 text-white'
                  : 'text-text-secondary hover:bg-subtle-bg hover:text-text-primary',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={() => { setShowForm(true); setEditing(null) }}>
          + New ticket
        </Button>
      </div>

      {(showForm && !editing) && (
        <TicketForm onClose={() => setShowForm(false)} />
      )}

      {visible.length === 0 && !showForm ? (
        <div className="card py-12 text-center">
          <p className="text-text-muted text-sm">
            {filter === 'all' ? 'No tickets this sprint.' : `No tickets with status "${statusConfig[filter as TicketStatus]?.label}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((ticket) => (
            <div key={ticket.id}>
              {editing?.id === ticket.id ? (
                <TicketForm initial={ticket} onClose={() => setEditing(null)} />
              ) : (
                <div className="card flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="label-mono text-text-muted">{ticket.id}</span>
                      <Badge variant={statusConfig[ticket.status].variant}>
                        {statusConfig[ticket.status].label}
                      </Badge>
                      <Badge variant={priorityConfig[ticket.priority].variant}>
                        {priorityConfig[ticket.priority].label}
                      </Badge>
                      {ticket.sprint && (
                        <span className="text-xs text-text-muted">{ticket.sprint}</span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-text-primary">{ticket.name}</p>
                    {ticket.description && (
                      <p className="text-xs text-text-secondary mt-1 line-clamp-2">{ticket.description}</p>
                    )}
                    {ticket.assignee && (
                      <p className="text-xs text-text-muted mt-1">→ {ticket.assignee}</p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => setEditing(ticket)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      loading={deleting === ticket.id}
                      onClick={() => handleDelete(ticket.id)}
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="pt-1">
        <SectionLabel>{visible.length} ticket{visible.length !== 1 ? 's' : ''} total</SectionLabel>
      </div>
    </div>
  )
}
