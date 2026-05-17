'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { SectionLabel } from '@/components/ui/SectionLabel'
import type { Ticket, TicketStatus, TicketPriority } from '@/types'
import type { BadgeVariant } from '@/components/ui/Badge'

const statusConfig: Record<TicketStatus, { variant: BadgeVariant; label: string }> = {
  draft:            { variant: 'muted',    label: 'Draft' },
  pending_approval: { variant: 'warning',  label: 'Pending approval' },
  approved:         { variant: 'info',     label: 'Approved' },
  rejected:         { variant: 'error',    label: 'Rejected' },
  planned:          { variant: 'default',  label: 'Planned' },
  in_progress:      { variant: 'default',  label: 'In progress' },
  review:           { variant: 'warning',  label: 'Review' },
  lead_review:      { variant: 'warning',  label: 'Lead review' },
  ready_for_uat:    { variant: 'success',  label: 'Ready for UAT' },
  ready_for_prod:   { variant: 'success',  label: 'Ready for prod' },
}

const priorityConfig: Record<TicketPriority, { variant: BadgeVariant; label: string }> = {
  low:      { variant: 'muted',    label: 'Low' },
  medium:   { variant: 'info',     label: 'Medium' },
  high:     { variant: 'warning',  label: 'High' },
  critical: { variant: 'error',    label: 'Critical' },
}

const STATUS_FILTERS: { value: TicketStatus | 'all'; label: string }[] = [
  { value: 'all',             label: 'All' },
  { value: 'pending_approval', label: 'Pending approval' },
  { value: 'approved',        label: 'Approved' },
  { value: 'planned',         label: 'Planned' },
  { value: 'in_progress',     label: 'In progress' },
  { value: 'review',          label: 'Review' },
  { value: 'lead_review',     label: 'Lead review' },
  { value: 'ready_for_uat',   label: 'Ready for UAT' },
  { value: 'ready_for_prod',  label: 'Ready for prod' },
  { value: 'rejected',        label: 'Rejected' },
]

interface TicketBoardProps {
  initialTickets: Ticket[]
  filterOverride?: TicketStatus
}

export function TicketBoard({ initialTickets, filterOverride }: TicketBoardProps) {
  const qc = useQueryClient()
  const [filter, setFilter] = useState<TicketStatus | 'all'>(filterOverride ?? 'all')
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectComment, setRejectComment] = useState('')
  const [actioning, setActioning] = useState<string | null>(null)

  const { data: tickets } = useQuery<Ticket[]>({
    queryKey: ['tickets'],
    queryFn: () => fetch('/api/tickets').then((r) => r.json()),
    initialData: initialTickets,
  })

  const visible = filter === 'all' ? tickets : tickets.filter((t) => t.status === filter)

  async function patch(id: string, body: Record<string, unknown>) {
    setActioning(id)
    await fetch(`/api/tickets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    await qc.invalidateQueries({ queryKey: ['tickets'] })
    setActioning(null)
  }

  async function handleApprove(ticket: Ticket) {
    await patch(ticket.id, { status: 'approved' })
  }

  async function handleRejectSubmit(ticket: Ticket) {
    await patch(ticket.id, { status: 'rejected', rejection_comment: rejectComment.trim() || undefined })
    setRejectingId(null)
    setRejectComment('')
  }

  const pendingApprovalCount = tickets.filter((t) => t.status === 'pending_approval').length

  return (
    <div className="space-y-4">
      {/* Approval banner */}
      {pendingApprovalCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#FFF7ED] border border-[#FED7AA] text-sm">
          <span className="text-[#C2410C] font-medium">
            {pendingApprovalCount} ticket{pendingApprovalCount !== 1 ? 's' : ''} awaiting your approval
          </span>
          <button
            onClick={() => setFilter('pending_approval')}
            className="text-xs text-[#C2410C] underline hover:no-underline"
          >
            Review
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-1 flex-wrap">
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

      {visible.length === 0 ? (
        <div className="card py-12 text-center">
          <p className="text-text-muted text-sm">
            {filter === 'all'
              ? 'No tickets yet. Start a conversation with the BA agent.'
              : `No tickets with status "${statusConfig[filter as TicketStatus]?.label}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((ticket) => (
            <div key={ticket.id} className="card space-y-3">
              <div className="flex items-start gap-4">
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
                    {ticket.assignee_agent && (
                      <Badge variant="muted">{ticket.assignee_agent}</Badge>
                    )}
                  </div>
                  <p className="text-sm font-medium text-text-primary">{ticket.name}</p>
                  {ticket.description && (
                    <p className="text-xs text-text-secondary mt-1 line-clamp-2">{ticket.description}</p>
                  )}
                  {ticket.rejection_comment && (
                    <p className="text-xs text-[#DC2626] mt-1">Rejected: {ticket.rejection_comment}</p>
                  )}
                </div>

                {/* Approve / Reject actions for pending_approval tickets */}
                {ticket.status === 'pending_approval' && (
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      loading={actioning === ticket.id}
                      onClick={() => {
                        setRejectingId(ticket.id)
                        setRejectComment('')
                      }}
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      loading={actioning === ticket.id}
                      onClick={() => handleApprove(ticket)}
                    >
                      Approve
                    </Button>
                  </div>
                )}
              </div>

              {/* Inline reject form */}
              {rejectingId === ticket.id && (
                <div className="border-t border-border pt-3 space-y-2">
                  <input
                    autoFocus
                    value={rejectComment}
                    onChange={(e) => setRejectComment(e.target.value)}
                    placeholder="Reason for rejection (optional)"
                    className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-blue-vo2/40 focus:border-blue-vo2 transition-colors"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setRejectingId(null)}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={actioning === ticket.id}
                      onClick={() => handleRejectSubmit(ticket)}
                    >
                      Confirm rejection
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
