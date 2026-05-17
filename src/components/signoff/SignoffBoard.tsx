'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { SectionLabel } from '@/components/ui/SectionLabel'
import type { SignoffRequest } from '@/types'

const inputCls = 'w-full h-9 px-3 text-sm rounded-lg border border-border bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-blue-vo2/40 focus:border-blue-vo2 transition-colors'

interface ReviewFormState {
  id: string
  decision: 'approved' | 'rejected'
}

interface SignoffBoardProps {
  initialRequests: SignoffRequest[]
}

export function SignoffBoard({ initialRequests }: SignoffBoardProps) {
  const qc = useQueryClient()
  const [reviewing, setReviewing] = useState<ReviewFormState | null>(null)
  const [reviewerName, setReviewerName] = useState('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { data: requests } = useQuery<SignoffRequest[]>({
    queryKey: ['signoff'],
    queryFn: () => fetch('/api/signoff').then((r) => r.json()),
    initialData: initialRequests,
    refetchInterval: 15000,
  })

  const pending = requests.filter((r) => r.status === 'pending')
  const completed = requests.filter((r) => r.status !== 'pending')

  async function handleReview(e: React.FormEvent) {
    e.preventDefault()
    if (!reviewing || !reviewerName.trim()) return
    setSubmitting(true)

    await fetch(`/api/signoff/${reviewing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: reviewing.decision,
        reviewed_by: reviewerName.trim(),
        comment: comment.trim() || undefined,
      }),
    })

    await qc.invalidateQueries({ queryKey: ['signoff'] })
    setReviewing(null)
    setReviewerName('')
    setComment('')
    setSubmitting(false)
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <SectionLabel>Awaiting sign-off ({pending.length})</SectionLabel>

        {pending.length === 0 ? (
          <div className="card py-10 text-center">
            <p className="text-text-muted text-sm">No pending requests.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map((req) => (
              <div key={req.id} className="card space-y-4 border-l-4 border-l-blue-vo2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-base font-semibold font-jost text-text-primary">
                        {req.feature_name}
                      </h3>
                      {req.ticket_id && (
                        <span className="label-mono text-text-muted">{req.ticket_id}</span>
                      )}
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed">{req.description}</p>
                    <p className="text-xs text-text-muted mt-2">
                      Submitted {new Date(req.created_at).toLocaleDateString('en-US', {
                        day: '2-digit', month: 'long', year: 'numeric',
                      })}
                    </p>
                  </div>
                  {reviewing?.id !== req.id && (
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        onClick={() => setReviewing({ id: req.id, decision: 'approved' })}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => setReviewing({ id: req.id, decision: 'rejected' })}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>

                {reviewing?.id === req.id && (
                  <form onSubmit={handleReview} className="border-t border-border pt-4 space-y-3">
                    <p className={`text-sm font-medium ${reviewing.decision === 'approved' ? 'text-vo2-green' : 'text-[#DC2626]'}`}>
                      {reviewing.decision === 'approved' ? '✓ Approval' : '✕ Rejection'} — enter your name
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label-mono block mb-1.5">Your name *</label>
                        <input
                          value={reviewerName}
                          onChange={(e) => setReviewerName(e.target.value)}
                          placeholder="Héloïse / Aurélie"
                          className={inputCls}
                          required
                        />
                      </div>
                      <div>
                        <label className="label-mono block mb-1.5">Comment</label>
                        <input
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="Optional"
                          className={inputCls}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" loading={submitting}
                        variant={reviewing.decision === 'approved' ? 'primary' : 'danger'}
                      >
                        Confirm
                      </Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => setReviewing(null)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {completed.length > 0 && (
        <section className="space-y-3">
          <SectionLabel>History ({completed.length})</SectionLabel>
          <div className="space-y-2">
            {completed.map((req) => (
              <div key={req.id} className="card flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="text-sm font-medium text-text-primary">{req.feature_name}</p>
                    {req.ticket_id && <span className="label-mono text-text-muted">{req.ticket_id}</span>}
                    <Badge variant={req.status === 'approved' ? 'success' : 'error'}>
                      {req.status === 'approved' ? 'Approved' : 'Rejected'}
                    </Badge>
                  </div>
                  {req.comment && (
                    <p className="text-xs text-text-secondary mt-1">« {req.comment} »</p>
                  )}
                  <p className="text-xs text-text-muted mt-1">
                    {req.reviewed_by && `By ${req.reviewed_by} · `}
                    {req.reviewed_at && new Date(req.reviewed_at).toLocaleDateString('en-US', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
