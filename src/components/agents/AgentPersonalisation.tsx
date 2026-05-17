'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { SectionLabel } from '@/components/ui/SectionLabel'
import type { AgentType } from '@/types'

interface PersonalisationRow {
  instructions: string
  files: { name: string; content: string }[]
  updated_at: string
}

function fetchPersonalisation(agentType: string): Promise<PersonalisationRow> {
  return fetch(`/api/personalisation/${agentType}`).then((r) => r.json())
}

function savePersonalisation(agentType: string, body: { instructions: string; files: { name: string; content: string }[] }) {
  return fetch(`/api/personalisation/${agentType}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then((r) => r.json())
}

const AGENT_LABELS: Record<AgentType, string> = {
  ba: 'Business Analyst',
  coding: 'Coding',
  qa: 'QA',
  pm: 'PM',
  specs: 'Specs',
}

interface SectionProps {
  label: string
  queryKey: string
  agentType: string
  placeholder: string
}

function PersonalisationSection({ label, queryKey, agentType, placeholder }: SectionProps) {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery<PersonalisationRow>({
    queryKey: ['personalisation', queryKey],
    queryFn: () => fetchPersonalisation(agentType),
  })

  const [instructions, setInstructions] = useState<string | null>(null)
  const [files, setFiles] = useState<{ name: string; content: string }[] | null>(null)
  const [saved, setSaved] = useState(false)

  const currentInstructions = instructions ?? data?.instructions ?? ''
  const currentFiles = files ?? data?.files ?? []
  const isDirty = instructions !== null || files !== null

  const mutation = useMutation({
    mutationFn: () => savePersonalisation(agentType, { instructions: currentInstructions, files: currentFiles }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['personalisation', queryKey] })
      setInstructions(null)
      setFiles(null)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? [])
    e.target.value = ''
    const read = await Promise.all(
      selected.map((f) => f.text().then((content) => ({ name: f.name, content })))
    )
    setFiles((prev) => [...(prev ?? currentFiles), ...read])
  }, [currentFiles])

  const handleRemoveFile = useCallback((name: string) => {
    setFiles((prev) => (prev ?? currentFiles).filter((f) => f.name !== name))
  }, [currentFiles])

  if (isLoading) {
    return (
      <div className="space-y-3">
        <SectionLabel>{label}</SectionLabel>
        <div className="h-24 rounded-lg bg-subtle-bg animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <SectionLabel>{label}</SectionLabel>

      <textarea
        value={currentInstructions}
        onChange={(e) => setInstructions(e.target.value)}
        placeholder={placeholder}
        rows={6}
        className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-blue-vo2/40 focus:border-blue-vo2 transition-colors resize-none font-mono"
      />

      {/* Uploaded files */}
      {currentFiles.length > 0 && (
        <ul className="space-y-1">
          {currentFiles.map((f) => (
            <li key={f.name} className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-subtle-bg border border-border">
              <span className="text-xs font-mono text-text-secondary truncate">{f.name}</span>
              <button
                onClick={() => handleRemoveFile(f.name)}
                className="text-xs text-text-muted hover:text-[#DC2626] transition-colors shrink-0"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-3">
        <label className="cursor-pointer text-xs text-blue-vo2 hover:underline">
          + Upload file
          <input
            type="file"
            multiple
            accept=".md,.txt,.ts,.tsx,.js,.json,.yaml,.yml,.sql,.py"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
        <span className="text-text-muted text-xs">·</span>
        <span className="text-xs text-text-muted">.md .txt .ts .json .yaml accepted</span>

        {isDirty && (
          <div className="ml-auto flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setInstructions(null); setFiles(null) }}
            >
              Discard
            </Button>
            <Button
              size="sm"
              loading={mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              Save
            </Button>
          </div>
        )}

        {saved && !isDirty && (
          <span className="ml-auto text-xs text-vo2-green">Saved</span>
        )}

        {data?.updated_at && !isDirty && !saved && (
          <span className="ml-auto text-xs text-text-muted">
            Last saved {new Date(data.updated_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    </div>
  )
}

interface AgentPersonalisationProps {
  agentType: AgentType
}

export function AgentPersonalisation({ agentType }: AgentPersonalisationProps) {
  return (
    <div className="space-y-8">
      <div className="card space-y-1">
        <p className="text-xs text-text-muted leading-relaxed">
          Instructions and files here are injected into every agent's system prompt at runtime.
          Use this for project-wide rules, stack conventions, and context that all agents must know.
        </p>
      </div>

      <div className="card space-y-5">
        <div>
          <h3 className="text-sm font-semibold text-text-primary font-jost">Global personalisation</h3>
          <p className="text-xs text-text-muted mt-0.5">Applied to all agents</p>
        </div>
        <PersonalisationSection
          label="Instructions"
          queryKey="global"
          agentType="global"
          placeholder="e.g. Always write in English. Respect RGPD. The client is SMCP — Sandro, Maje, Claudie Pierlot, Fursac."
        />
      </div>

      <div className="card space-y-5">
        <div>
          <h3 className="text-sm font-semibold text-text-primary font-jost">{AGENT_LABELS[agentType]} personalisation</h3>
          <p className="text-xs text-text-muted mt-0.5">Applied to this agent only</p>
        </div>
        <PersonalisationSection
          label="Instructions"
          queryKey={agentType}
          agentType={agentType}
          placeholder={`e.g. Specific rules, best practices, or context for the ${AGENT_LABELS[agentType]} agent.`}
        />
      </div>
    </div>
  )
}
