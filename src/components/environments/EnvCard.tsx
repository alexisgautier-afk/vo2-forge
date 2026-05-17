import { StatusDot } from '@/components/ui/StatusDot'
import { Badge } from '@/components/ui/Badge'
import type { Environment, AgentType } from '@/types'

const agentLabels: Record<AgentType, string> = {
  coding: 'Coding', qa: 'QA', pm: 'PM', specs: 'Specs',
}

const envLabels: Record<string, string> = {
  dev: 'Développement', uat: 'UAT', prod: 'Production',
}

interface EnvCardProps {
  env: Environment
}

export function EnvCard({ env }: EnvCardProps) {
  return (
    <div className={`card space-y-4 ${env.frozen ? 'border-[#FDE68A]' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="label-mono mb-1">{env.name.toUpperCase()}</p>
          <h3 className="text-base font-semibold font-jost text-text-primary">
            {envLabels[env.name]}
          </h3>
          <p className="text-xs text-text-muted mt-0.5 font-mono">{env.branch}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <StatusDot status={env.frozen ? 'locked' : env.status === 'healthy' ? 'validated' : 'pending'} />
          {env.frozen && (
            <Badge variant="warning">Gelé</Badge>
          )}
        </div>
      </div>

      <div>
        <p className="label-mono mb-1.5">Agents autorisés</p>
        {env.agents_allowed.length === 0 ? (
          <p className="text-xs text-text-muted">Aucun agent autorisé</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {env.agents_allowed.map((a) => (
              <Badge key={a} variant="info">{agentLabels[a]}</Badge>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="label-mono mb-0.5">Dernier déploiement</p>
        <p className="text-xs text-text-secondary">
          {env.last_deploy
            ? new Date(env.last_deploy).toLocaleDateString('fr-FR', {
                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
              })
            : '—'}
        </p>
      </div>
    </div>
  )
}
