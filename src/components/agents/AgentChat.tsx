'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { LogStream } from '@/components/agents/LogStream'
import { SectionLabel } from '@/components/ui/SectionLabel'
import type { AgentType } from '@/types'

interface AgentChatProps {
  agentType: AgentType
}

const PLACEHOLDER: Record<AgentType, string> = {
  coding: 'Ex : Implémente la liste des clients avec pagination — SMCP-42',
  qa: 'Ex : Revue la PR #87 et génère les cas de test pour le flow messagerie',
  pm: 'Ex : Découpe SMCP-51 en sous-tâches et estime la complexité',
  specs: 'Ex : Rédige la spec technique pour le module de notifications push',
}

const SUGGESTED: Record<AgentType, string[]> = {
  coding: [
    'Crée un composant ClientCard avec avatar, nom, dernière visite',
    'Ajoute un hook useClientSearch avec debounce 300ms',
    'Implémente la pagination infinie sur la liste clients',
  ],
  qa: [
    'Génère les cas de test E2E pour la création de client',
    'Revue la dernière PR ouverte sur le repo SMCP',
    'Liste les edge cases du flow messagerie Twilio',
  ],
  pm: [
    'Résume l\'état du sprint en cours',
    'Identifie les dépendances bloquantes sur les tickets ouverts',
    'Prépare l\'ordre du jour de la sprint review',
  ],
  specs: [
    'Rédige la spec du module de notifications push',
    'Produit un diagramme de séquence pour le flow auth Azure AD',
    'Documente l\'architecture de la couche API Heroku',
  ],
}

interface RunResult {
  runId: string
  output?: string
}

export function AgentChat({ agentType }: AgentChatProps) {
  const [prompt, setPrompt] = useState('')
  const [ticketId, setTicketId] = useState('')
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
          ticket_id: ticketId.trim() || undefined,
        }),
      })

      if (!res.ok || !res.body) {
        throw new Error(`Erreur serveur : ${res.status}`)
      }

      // Read the first SSE event to get the run_id, then hand off to LogStream
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

      if (!runId) throw new Error('Impossible de démarrer le run')
      setRun({ runId })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      setLoading(false)
    }
  }, [prompt, ticketId, agentType, loading])

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
    setTicketId('')
    setTimeout(() => textareaRef.current?.focus(), 50)
  }, [])

  return (
    <div className="space-y-5">
      {/* Input form — hidden once running */}
      {!run && (
        <div className="card space-y-4">
          <div className="flex gap-3">
            {/* Ticket ID */}
            <div className="w-36 flex-shrink-0">
              <SectionLabel className="mb-1.5">Ticket (optionnel)</SectionLabel>
              <input
                type="text"
                value={ticketId}
                onChange={(e) => setTicketId(e.target.value)}
                placeholder="SMCP-42"
                className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-blue-vo2/40 focus:border-blue-vo2 transition-colors"
              />
            </div>

            {/* Prompt */}
            <div className="flex-1">
              <SectionLabel className="mb-1.5">Instruction</SectionLabel>
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
                }}
                placeholder={PLACEHOLDER[agentType]}
                rows={3}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-blue-vo2/40 focus:border-blue-vo2 transition-colors resize-none"
              />
            </div>
          </div>

          {/* Suggested prompts */}
          <div>
            <SectionLabel className="mb-2">Suggestions</SectionLabel>
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
            <p className="text-xs text-text-muted">⌘ + Entrée pour lancer</p>
            <Button
              onClick={handleSubmit}
              loading={loading}
              disabled={!prompt.trim()}
            >
              Lancer l'agent
            </Button>
          </div>

          {error && (
            <p className="text-xs text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>
      )}

      {/* Log stream */}
      {run && (
        <div className="space-y-4">
          <LogStream
            runId={run.runId}
            onDone={handleDone}
            onError={handleError}
          />

          {/* Output */}
          {output && (
            <div className="card space-y-3">
              <SectionLabel>Sortie de l'agent</SectionLabel>
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

          {/* Actions */}
          {!loading && (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleReset}>
                Nouveau run
              </Button>
              {output && (
                <Button
                  variant="ghost"
                  onClick={() => navigator.clipboard.writeText(output)}
                >
                  Copier la sortie
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
