import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/AppShell'
import { AgentChat } from '@/components/agents/AgentChat'
import { AgentPersonalisation } from '@/components/agents/AgentPersonalisation'
import { AgentTabs } from '@/components/agents/AgentTabs'
import { SectionLabel } from '@/components/ui/SectionLabel'
import type { AgentType } from '@/types'

const VALID_TYPES: AgentType[] = ['coding', 'qa', 'pm', 'specs', 'ba']

const AGENT_META: Record<AgentType, { label: string; rules: string[] }> = {
  ba: {
    label: 'Business Analyst',
    rules: [
      'Challenges requirements before accepting them',
      'Outputs structured JSON — analysis + ticket proposals',
      'Each ticket must have testable acceptance criteria',
      'Tickets require human approval before any agent acts',
    ],
  },
  coding: {
    label: 'Coding Agent',
    rules: [
      'Opens a PR — never merges directly',
      'Strict TypeScript, no any',
      'React Query for all API calls',
      'Branches: feature/smcp-{id}-{slug}',
    ],
  },
  qa: {
    label: 'QA Agent',
    rules: [
      'Comments on PRs, never merges',
      'In UAT: read-only access only',
      'Happy path + edge cases systematically',
      'Priority on critical E2E flows',
    ],
  },
  pm: {
    label: 'PM Agent',
    rules: [
      'Plans sprints after ticket approval',
      'Identifies risks and dependencies',
      'Respects critical project milestones',
      'Runs automatically — no manual trigger needed',
    ],
  },
  specs: {
    label: 'Specs Agent',
    rules: [
      'Technical specs from business requirements',
      'Sequence diagrams in Mermaid',
      'Validates consistency with the target stack',
      'Documents architecture decisions',
    ],
  },
}

interface AgentPageProps {
  params: Promise<{ type: string }>
  searchParams: Promise<{ tab?: string }>
}

export default async function AgentPage({ params, searchParams }: AgentPageProps) {
  const { type } = await params
  const { tab } = await searchParams

  if (!VALID_TYPES.includes(type as AgentType)) notFound()

  const agentType = type as AgentType
  const meta = AGENT_META[agentType]
  const activeTab = tab === 'personalisation' ? 'personalisation' : 'chat'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const header = (
    <div className="flex items-center justify-between gap-6 flex-1 min-w-0">
      <div className="shrink-0">
        <SectionLabel className="mb-0.5">Active agent</SectionLabel>
        <h1 className="text-base font-semibold font-jost text-text-primary leading-tight">{meta.label}</h1>
      </div>
      <ul className="hidden lg:flex gap-x-5 gap-y-1 flex-wrap flex-1 min-w-0">
        {meta.rules.map((rule) => (
          <li key={rule} className="flex gap-1.5 text-xs text-text-secondary whitespace-nowrap">
            <span className="text-blue-vo2 flex-shrink-0">·</span>
            {rule}
          </li>
        ))}
      </ul>
      <AgentTabs agentType={agentType} active={activeTab} />
    </div>
  )

  return (
    <AppShell userEmail={user?.email} header={header}>
      {activeTab === 'chat' && <AgentChat agentType={agentType} />}
      {activeTab === 'personalisation' && <AgentPersonalisation agentType={agentType} />}
    </AppShell>
  )
}
