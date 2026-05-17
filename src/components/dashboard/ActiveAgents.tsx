'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { Badge } from '@/components/ui/Badge'
import type { AgentRun, AgentType } from '@/types'

const agentLabels: Record<AgentType, string> = {
  coding: 'Coding',
  qa: 'QA',
  pm: 'PM',
  specs: 'Specs',
}

interface ActiveAgentsProps {
  initialRuns: AgentRun[]
}

export function ActiveAgents({ initialRuns }: ActiveAgentsProps) {
  const [runs, setRuns] = useState<AgentRun[]>(initialRuns)

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('agent_runs_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'agent_runs' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const run = payload.new as AgentRun
            if (run.status === 'running') {
              setRuns((prev) => [run, ...prev])
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as AgentRun
            setRuns((prev) => {
              if (updated.status !== 'running') {
                return prev.filter((r) => r.id !== updated.id)
              }
              return prev.map((r) => (r.id === updated.id ? updated : r))
            })
          } else if (payload.eventType === 'DELETE') {
            const deleted = payload.old as { id: string }
            setRuns((prev) => prev.filter((r) => r.id !== deleted.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div className="card space-y-3">
      <SectionLabel>Active agents</SectionLabel>

      {runs.length === 0 ? (
        <p className="text-sm text-text-muted py-4 text-center">
          No agents running
        </p>
      ) : (
        <ul className="space-y-2">
          {runs.map((run) => (
            <li key={run.id} className="flex items-start gap-3 py-2">
              <span className="mt-1.5 h-2 w-2 rounded-full bg-vo2-green animate-pulse shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <Badge variant="default">{agentLabels[run.agent_type]}</Badge>
                  {run.ticket_name && (
                    <span className="text-xs text-text-muted truncate">
                      {run.ticket_name}
                    </span>
                  )}
                </div>
                <p className="text-sm text-text-secondary truncate">
                  {run.prompt.slice(0, 80)}{run.prompt.length > 80 ? '…' : ''}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
