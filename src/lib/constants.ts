import type { Milestone, Environment, Gate } from '@/types'

export function isProductionFrozen(): boolean {
  const now = new Date()
  return now.getMonth() === 11
}

export const SMCP_MILESTONES: Milestone[] = [
  { name: 'Scope Lock Design Sprints', date: '2026-06-30', description: 'Functional scope locked', passed: new Date() > new Date('2026-06-30') },
  { name: 'UAT Open', date: '2026-11-01', description: 'SMCP access to the UAT environment', passed: new Date() > new Date('2026-11-01') },
  { name: 'Production Freeze', date: '2026-12-01', description: 'Deployments frozen until go-live', passed: new Date() > new Date('2026-12-01') },
  { name: 'Go-live V1', date: '2027-02-01', description: 'Production rollout across 750 stores', passed: new Date() > new Date('2027-02-01') },
]

export const ENVIRONMENTS: Environment[] = [
  { name: 'dev', branch: 'develop', last_deploy: '', agents_allowed: ['coding', 'qa', 'pm', 'specs', 'ba'], status: 'healthy', frozen: false },
  { name: 'uat', branch: 'release/uat', last_deploy: '', agents_allowed: ['qa'], status: 'healthy', frozen: false },
  { name: 'prod', branch: 'main', last_deploy: '', agents_allowed: [], status: 'healthy', frozen: isProductionFrozen() },
]

export const PIPELINE_GATES: Gate[] = [
  { id: 'code', name: 'Code', responsible: 'Coding Agent', status: 'validated', description: 'PR opened by the agent' },
  { id: 'ci', name: 'CI Tests', responsible: 'GitHub Actions', status: 'validated', description: 'Vitest + Playwright passing' },
  { id: 'dev', name: 'Dev', responsible: 'Auto-deploy', status: 'validated', description: 'Deployed to Dev' },
  { id: 'lead', name: 'Lead Review', responsible: 'Claire / Sébastien', status: 'pending', description: 'Lead Tech approval required' },
  { id: 'uat', name: 'UAT', responsible: 'QA Agent', status: 'pending', description: 'QA on UAT environment' },
  { id: 'signoff', name: 'SMCP Sign-off', responsible: 'Héloïse / Aurélie', status: 'locked', description: 'SMCP sign-off for critical features' },
  { id: 'prod', name: 'Production', responsible: 'Lead Tech', status: 'locked', description: 'Dual human approval required' },
]

export const CURRENT_SPRINT = {
  name: 'Sprint 12',
  start: '2026-05-12',
  end: '2026-05-26',
}
