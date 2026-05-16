import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/AppShell'
import { AgentSelector } from '@/components/agents/AgentSelector'
import { AgentChat } from '@/components/agents/AgentChat'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { Badge } from '@/components/ui/Badge'
import type { AgentType } from '@/types'

const VALID_TYPES: AgentType[] = ['coding', 'qa', 'pm', 'specs']

const AGENT_META: Record<AgentType, { label: string; rules: string[] }> = {
  coding: {
    label: 'Coding Agent',
    rules: [
      'Ouvre une PR — ne merge jamais directement',
      'TypeScript strict, aucun any',
      'React Query pour tous les appels API',
      'Branches : feature/smcp-{id}-{slug}',
    ],
  },
  qa: {
    label: 'QA Agent',
    rules: [
      'Commente les PRs, ne merge pas',
      'En UAT : lecture seule uniquement',
      'Happy path + edge cases systématiquement',
      'Priorité aux flows critiques E2E',
    ],
  },
  pm: {
    label: 'PM Agent',
    rules: [
      'Propose des découpages en sous-tâches',
      'Identifie risques et dépendances',
      'Respecte les jalons critiques du projet',
      'Produit des synthèses pour SMCP',
    ],
  },
  specs: {
    label: 'Specs Agent',
    rules: [
      'Specs techniques à partir des besoins métier',
      'Diagrammes de séquence en Mermaid',
      "Valide la cohérence avec la stack cible",
      "Documente les choix d'architecture",
    ],
  },
}

interface AgentPageProps {
  params: Promise<{ type: string }>
}

export default async function AgentPage({ params }: AgentPageProps) {
  const { type } = await params

  if (!VALID_TYPES.includes(type as AgentType)) notFound()

  const agentType = type as AgentType
  const meta = AGENT_META[agentType]

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: recentRuns } = await supabase
    .from('agent_runs')
    .select('id, created_at, status, ticket_id, prompt, tokens_used')
    .eq('agent_type', agentType)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <AppShell userEmail={user?.email}>
      <div className="space-y-6">
        <AgentSelector />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat — left 2/3 */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <SectionLabel className="mb-0.5">Agent actif</SectionLabel>
              <h2 className="text-xl font-semibold font-jost text-text-primary">{meta.label}</h2>
            </div>
            <AgentChat agentType={agentType} />
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            <div className="card space-y-3">
              <SectionLabel>Règles absolues</SectionLabel>
              <ul className="space-y-2">
                {meta.rules.map((rule) => (
                  <li key={rule} className="flex gap-2 text-xs text-text-secondary">
                    <span className="text-blue-vo2 flex-shrink-0 mt-0.5">·</span>
                    {rule}
                  </li>
                ))}
              </ul>
            </div>

            <div className="card space-y-3">
              <SectionLabel>Runs récents</SectionLabel>
              {!recentRuns?.length ? (
                <p className="text-xs text-text-muted">Aucun run pour cet agent.</p>
              ) : (
                <ul className="space-y-2">
                  {recentRuns.map((run) => (
                    <li key={run.id} className="flex items-start gap-2">
                      <Badge
                        variant={
                          run.status === 'done' ? 'success'
                          : run.status === 'error' ? 'error'
                          : run.status === 'running' ? 'default'
                          : 'muted'
                        }
                        className="flex-shrink-0 mt-0.5"
                      >
                        {run.status}
                      </Badge>
                      <div className="min-w-0">
                        <p className="text-xs text-text-primary truncate">
                          {run.ticket_id ? `${run.ticket_id} · ` : ''}{run.prompt}
                        </p>
                        <p className="text-xs text-text-muted">
                          {run.tokens_used ? `${run.tokens_used} tokens · ` : ''}
                          {new Date(run.created_at).toLocaleDateString('fr-FR', {
                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
