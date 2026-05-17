'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/Badge'
import { SectionLabel } from '@/components/ui/SectionLabel'
import type { AgentRun, AgentType, AgentStatus } from '@/types'
import type { BadgeVariant } from '@/components/ui/Badge'

const agentLabels: Record<AgentType, string> = {
  ba: 'BA', coding: 'Coding', qa: 'QA', pm: 'PM', specs: 'Specs',
}

const statusConfig: Record<AgentStatus, { variant: BadgeVariant; label: string }> = {
  pending: { variant: 'muted', label: 'Pending' },
  running: { variant: 'default', label: 'Running' },
  done: { variant: 'success', label: 'Done' },
  error: { variant: 'error', label: 'Error' },
}

const TYPE_FILTERS: { value: AgentType | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'ba', label: 'BA' },
  { value: 'coding', label: 'Coding' },
  { value: 'qa', label: 'QA' },
  { value: 'pm', label: 'PM' },
  { value: 'specs', label: 'Specs' },
]

interface RunListProps {
  initialRuns: AgentRun[]
}

export function RunList({ initialRuns }: RunListProps) {
  const [typeFilter, setTypeFilter] = useState<AgentType | 'all'>('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  const { data: runs } = useQuery<AgentRun[]>({
    queryKey: ['agent_runs'],
    queryFn: () => fetch('/api/agents/runs').then((r) => r.json()),
    initialData: initialRuns,
    refetchInterval: 5000,
  })

  const visible = typeFilter === 'all' ? runs : runs.filter((r) => r.agent_type === typeFilter)

  return (
    <div className="space-y-4">
      <div className="flex gap-1 flex-wrap">
        {TYPE_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setTypeFilter(value)}
            className={[
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              typeFilter === value
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
          <p className="text-text-muted text-sm">No runs found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((run) => {
            const isExpanded = expanded === run.id
            const { variant, label } = statusConfig[run.status]

            return (
              <div key={run.id} className="card space-y-3">
                <div
                  className="flex items-start gap-3 cursor-pointer"
                  onClick={() => setExpanded(isExpanded ? null : run.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge variant="info">{agentLabels[run.agent_type]}</Badge>
                      <Badge variant={variant}>{label}</Badge>
                      {run.ticket_id && (
                        <span className="label-mono text-text-muted">{run.ticket_id}</span>
                      )}
                    </div>
                    <p className="text-sm text-text-primary truncate">
                      {run.prompt.slice(0, 100)}{run.prompt.length > 100 ? '…' : ''}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-xs text-text-muted">
                        {new Date(run.created_at).toLocaleDateString('en-US', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                      {run.tokens_used > 0 && (
                        <p className="text-xs text-text-muted">{run.tokens_used.toLocaleString()} tokens</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {run.status === 'running' && (
                      <Link
                        href={`/agents/${run.agent_type}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-blue-vo2 hover:underline"
                      >
                        View →
                      </Link>
                    )}
                    <span className="text-text-muted text-xs">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border pt-3">
                    {run.error ? (
                      <p className="text-xs text-[#DC2626] font-mono">{run.error}</p>
                    ) : run.output ? (
                      <pre className="text-xs text-text-secondary whitespace-pre-wrap leading-relaxed font-mono overflow-x-auto max-h-60 overflow-y-auto">
                        {run.output}
                      </pre>
                    ) : (
                      <p className="text-xs text-text-muted">No output available.</p>
                    )}
                    <div className="mt-2">
                      <SectionLabel>Run ID</SectionLabel>
                      <p className="text-xs font-mono text-text-muted mt-0.5">{run.id}</p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <SectionLabel>{visible.length} run{visible.length !== 1 ? 's' : ''}</SectionLabel>
    </div>
  )
}
