'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LogStream } from '@/components/agents/LogStream'
import { SectionLabel } from '@/components/ui/SectionLabel'
import type { AgentType } from '@/types'

interface AgentChatProps {
  agentType: AgentType
}

const PLACEHOLDER: Record<AgentType, string> = {
  ba: 'e.g. We need a feature that lets store associates see a client\'s purchase history',
  coding: 'e.g. Implement the client list with pagination — SMCP-42',
  qa: 'e.g. Review PR #87 and generate test cases for the messaging flow',
  pm: 'e.g. Break down SMCP-51 into sub-tasks and estimate complexity',
  specs: 'e.g. Write the technical spec for the push notifications module',
}

const SUGGESTED: Record<AgentType, string[]> = {
  ba: [
    'Store associates need to send personalised messages to VIP clients',
    'The app should surface product recommendations based on past purchases',
    'We need a way to track client visit frequency per store',
  ],
  coding: [
    'Create a ClientCard component with avatar, name, last visit',
    'Add a useClientSearch hook with 300ms debounce',
    'Implement infinite scroll on the client list',
  ],
  qa: [
    'Generate E2E test cases for client creation',
    'Review the latest open PR on the SMCP repo',
    'List edge cases for the Twilio messaging flow',
  ],
  pm: [
    'Summarise the current sprint status',
    'Identify blocking dependencies on open tickets',
    'Prepare the sprint review agenda',
  ],
  specs: [
    'Write the spec for the push notifications module',
    'Produce a sequence diagram for the Azure AD auth flow',
    'Document the Heroku API layer architecture',
  ],
}

interface BaTicketProposal {
  id: string
  name: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  assignee_agent: string
}

interface BaOutput {
  analysis: string
  tickets: BaTicketProposal[]
}

interface RunResult {
  runId: string
  output?: string
}

const PRIORITY_VARIANT: Record<string, string> = {
  low: 'muted',
  medium: 'info',
  high: 'warning',
  critical: 'error',
}

function parseBaOutput(raw: string): BaOutput | null {
  try {
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) return null
    const parsed = JSON.parse(match[0]) as BaOutput
    if (!parsed.analysis || !Array.isArray(parsed.tickets)) return null
    return parsed
  } catch {
    return null
  }
}

export function AgentChat({ agentType }: AgentChatProps) {
  const [prompt, setPrompt] = useState('')
  const [run, setRun] = useState<RunResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [output, setOutput] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = useCallback(async () => {
    if (!prompt.trim() || loading) return
    setLoading(true)
    setError(null)
    setOutput(null)
    setRun(null)

    try {
      const res = await fetch('/api/agents/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_type: agentType,
          prompt: prompt.trim(),
        }),
      })

      if (!res.ok || !res.body) {
        throw new Error(`Server error: ${res.status}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let runId: string | null = null

      while (!runId) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value)
        for (const line of text.split('\n')) {
          if (!line.startsWith('data:')) continue
          const data = JSON.parse(line.slice(5).trim()) as Record<string, unknown>
          if (data.type === 'run_start' && data.run_id) {
            runId = data.run_id as string
          }
        }
      }
      reader.cancel()

      if (!runId) throw new Error('Failed to start run')
      setRun({ runId })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setLoading(false)
    }
  }, [prompt, agentType, loading])

  const handleDone = useCallback((out?: string) => {
    setLoading(false)
    setOutput(out ?? null)
  }, [])

  const handleError = useCallback((msg: string) => {
    setLoading(false)
    setError(msg)
  }, [])

  const handleReset = useCallback(() => {
    setRun(null)
    setOutput(null)
    setError(null)
    setPrompt('')
    setTimeout(() => textareaRef.current?.focus(), 50)
  }, [])

  const baOutput = agentType === 'ba' && output ? parseBaOutput(output) : null

  return (
    <div className="space-y-5">
      {!run && (
        <div className="card space-y-4">
          <div>
            <SectionLabel className="mb-1.5">Prompt</SectionLabel>
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
              }}
              placeholder={PLACEHOLDER[agentType]}
              rows={4}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-blue-vo2/40 focus:border-blue-vo2 transition-colors resize-none"
            />
          </div>

          <div>
            <SectionLabel className="mb-2">Suggested prompts</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED[agentType].map((s) => (
                <button
                  key={s}
                  onClick={() => setPrompt(s)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-subtle-bg border border-border text-text-secondary hover:bg-border hover:text-text-primary transition-colors text-left"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-text-muted">⌘ + Enter to run</p>
            <Button onClick={handleSubmit} loading={loading} disabled={!prompt.trim()}>
              Run agent
            </Button>
          </div>

          {error && (
            <p className="text-xs text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>
      )}

      {run && (
        <div className="space-y-4">
          <LogStream runId={run.runId} onDone={handleDone} onError={handleError} />

          {/* BA structured output */}
          {baOutput && (
            <div className="card space-y-4">
              <SectionLabel>Analysis</SectionLabel>
              <p className="text-sm text-text-secondary leading-relaxed">{baOutput.analysis}</p>

              <SectionLabel>Ticket proposals — {baOutput.tickets.length} ticket{baOutput.tickets.length !== 1 ? 's' : ''}</SectionLabel>
              <ul className="space-y-2">
                {baOutput.tickets.map((t) => (
                  <li key={t.id} className="border border-border rounded-lg px-4 py-3 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="label-mono text-text-muted">{t.id}</span>
                      <Badge variant={PRIORITY_VARIANT[t.priority] as never}>{t.priority}</Badge>
                      <Badge variant="muted">{t.assignee_agent}</Badge>
                    </div>
                    <p className="text-sm font-medium text-text-primary">{t.name}</p>
                    <p className="text-xs text-text-secondary">{t.description}</p>
                  </li>
                ))}
              </ul>

              <div className="flex items-center gap-3 pt-1">
                <Link
                  href="/tickets?filter=pending_approval"
                  className="text-xs font-medium text-blue-vo2 hover:underline"
                >
                  Review and approve on the Tickets page →
                </Link>
              </div>
            </div>
          )}

          {/* Generic output for non-BA agents */}
          {!baOutput && output && (
            <div className="card space-y-3">
              <SectionLabel>Agent output</SectionLabel>
              <pre className="text-xs text-text-secondary whitespace-pre-wrap leading-relaxed font-mono overflow-x-auto">
                {output}
              </pre>
            </div>
          )}

          {error && (
            <p className="text-xs text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {!loading && (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleReset}>
                New run
              </Button>
              {output && !baOutput && (
                <Button variant="ghost" onClick={() => navigator.clipboard.writeText(output)}>
                  Copy output
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
