'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import type { AgentType, AgentRun } from '@/types'

interface AgentChatProps {
  agentType: AgentType
}

interface Message {
  id: string
  role: 'user' | 'agent'
  content: string
  streaming?: boolean
  timestamp: string
}

interface BaOutput {
  analysis: string
  tickets: { id: string; name: string; description: string; priority: string; assignee_agent: string }[]
}

const PLACEHOLDER: Record<AgentType, string> = {
  ba:     'Describe a business need or feature request…',
  coding: 'e.g. Implement the client list with pagination — SMCP-42',
  qa:     'e.g. Review PR #87 and generate test cases for the messaging flow',
  pm:     'e.g. Break down SMCP-51 into sub-tasks and estimate complexity',
  specs:  'e.g. Write the technical spec for the push notifications module',
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

const PRIORITY_VARIANT: Record<string, string> = {
  low: 'muted', medium: 'info', high: 'warning', critical: 'error',
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

function AgentBubble({ content, agentType, streaming }: { content: string; agentType: AgentType; streaming?: boolean }) {
  const ba = agentType === 'ba' ? parseBaOutput(content) : null

  if (ba) {
    return (
      <div className="space-y-4 max-w-2xl">
        <div className="bg-surface border border-border rounded-2xl rounded-tl-sm px-4 py-3 space-y-3">
          <p className="text-sm text-text-primary leading-relaxed">{ba.analysis}</p>
          {streaming && <span className="inline-block w-1.5 h-4 bg-blue-vo2 rounded animate-pulse" />}
        </div>
        {ba.tickets.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-text-muted px-1">{ba.tickets.length} ticket{ba.tickets.length !== 1 ? 's' : ''} proposed</p>
            {ba.tickets.map((t) => (
              <div key={t.id} className="bg-surface border border-border rounded-xl px-4 py-3 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="label-mono text-text-muted">{t.id}</span>
                  <Badge variant={PRIORITY_VARIANT[t.priority] as never}>{t.priority}</Badge>
                  <Badge variant="muted">{t.assignee_agent}</Badge>
                </div>
                <p className="text-sm font-medium text-text-primary">{t.name}</p>
                <p className="text-xs text-text-secondary">{t.description}</p>
              </div>
            ))}
            <Link href="/tickets?filter=pending_approval" className="text-xs text-blue-vo2 hover:underline px-1">
              Review and approve on the Tickets page →
            </Link>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-surface border border-border rounded-2xl rounded-tl-sm px-4 py-3 max-w-2xl">
      <pre className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed font-sans">
        {content}
        {streaming && <span className="inline-block w-1.5 h-4 bg-blue-vo2 rounded animate-pulse ml-0.5 align-middle" />}
      </pre>
    </div>
  )
}

function runsToMessages(runs: AgentRun[]): Message[] {
  return [...runs].reverse().flatMap((run) => {
    const msgs: Message[] = [
      { id: `${run.id}-user`, role: 'user', content: run.prompt, timestamp: run.created_at },
    ]
    if (run.output) {
      msgs.push({ id: `${run.id}-agent`, role: 'agent', content: run.output, timestamp: run.created_at })
    }
    return msgs
  })
}

export function AgentChat({ agentType }: AgentChatProps) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const historyLoaded = useRef(false)

  const { data: runs } = useQuery<AgentRun[]>({
    queryKey: ['agent_runs', agentType],
    queryFn: () => fetch(`/api/agents/runs?agent_type=${agentType}`).then((r) => r.json()),
  })

  // Load history once
  useEffect(() => {
    if (runs && !historyLoaded.current) {
      historyLoaded.current = true
      setMessages(runsToMessages(runs))
    }
  }, [runs])

  // Auto-scroll on new content
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = useCallback(async () => {
    const prompt = input.trim()
    if (!prompt || streaming) return

    setInput('')
    setError(null)
    setStreaming(true)

    const userMsg: Message = {
      id: `pending-user-${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: new Date().toISOString(),
    }
    const agentMsg: Message = {
      id: `pending-agent-${Date.now()}`,
      role: 'agent',
      content: '',
      streaming: true,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMsg, agentMsg])

    try {
      const res = await fetch('/api/agents/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_type: agentType, prompt }),
      })

      if (!res.ok || !res.body) throw new Error(`Server error: ${res.status}`)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value)

        for (const line of text.split('\n')) {
          if (!line.startsWith('data:')) continue
          try {
            const data = JSON.parse(line.slice(5).trim()) as Record<string, unknown>

            if (data.type === 'chunk' && typeof data.text === 'string') {
              setMessages((prev) => prev.map((m) =>
                m.id === agentMsg.id ? { ...m, content: data.text as string } : m
              ))
            }

            if (data.type === 'run_done') {
              const finalOutput = (data.output as string | undefined) ?? agentMsg.content
              setMessages((prev) => prev.map((m) =>
                m.id === agentMsg.id ? { ...m, content: finalOutput, streaming: false } : m
              ))
            }

            if (data.type === 'run_error') {
              setError((data.message as string | undefined) ?? 'Unknown error')
              setMessages((prev) => prev.filter((m) => m.id !== agentMsg.id))
            }
          } catch {
            // non-JSON line
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setMessages((prev) => prev.filter((m) => m.id === agentMsg.id ? false : true))
    } finally {
      setStreaming(false)
    }
  }, [input, agentType, streaming])

  const isEmpty = messages.length === 0

  return (
    <div className="flex flex-col h-[calc(100vh-11rem)]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-6">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full gap-6 pb-8">
            <p className="text-sm text-text-muted">Start a conversation</p>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {SUGGESTED[agentType].map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-subtle-bg border border-border text-text-secondary hover:bg-border hover:text-text-primary transition-colors text-left"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'user' ? (
                <div className="bg-blue-vo2 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-xl">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              ) : (
                <AgentBubble
                  content={msg.content}
                  agentType={agentType}
                  streaming={msg.streaming}
                />
              )}
            </div>
          ))
        )}

        {error && (
          <p className="text-xs text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] rounded-lg px-3 py-2 mx-auto max-w-sm text-center">
            {error}
          </p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="border-t border-border pt-4">
        <div className="flex gap-3 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
            }}
            placeholder={PLACEHOLDER[agentType]}
            rows={2}
            disabled={streaming}
            className="flex-1 px-3 py-2 text-sm rounded-xl border border-border bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-blue-vo2/40 focus:border-blue-vo2 transition-colors resize-none disabled:opacity-50"
          />
          <Button onClick={handleSubmit} loading={streaming} disabled={!input.trim()}>
            Send
          </Button>
        </div>
        <p className="text-xs text-text-muted mt-1.5">⌘ + Enter to send</p>
      </div>
    </div>
  )
}
