import type { Milestone, Environment, Gate } from '@/types'

export function isProductionFrozen(): boolean {
  const now = new Date()
  return now.getMonth() === 11
}

export const SMCP_MILESTONES: Milestone[] = [
  { name: 'Scope Lock Design Sprints', date: '2026-06-30', description: 'Périmètre fonctionnel verrouillé', passed: new Date() > new Date('2026-06-30') },
  { name: 'Ouverture UAT', date: '2026-11-01', description: "Accès SMCP à l'environnement de recette", passed: new Date() > new Date('2026-11-01') },
  { name: 'Freeze Production', date: '2026-12-01', description: 'Gel des déploiements en production', passed: new Date() > new Date('2026-12-01') },
  { name: 'Go-live V1', date: '2027-02-01', description: 'Mise en production pour les 750 boutiques', passed: new Date() > new Date('2027-02-01') },
]

export const ENVIRONMENTS: Environment[] = [
  { name: 'dev', branch: 'develop', last_deploy: '', agents_allowed: ['coding', 'qa', 'pm', 'specs'], status: 'healthy', frozen: false },
  { name: 'uat', branch: 'release/uat', last_deploy: '', agents_allowed: ['qa'], status: 'healthy', frozen: false },
  { name: 'prod', branch: 'main', last_deploy: '', agents_allowed: [], status: 'healthy', frozen: isProductionFrozen() },
]

export const PIPELINE_GATES: Gate[] = [
  { id: 'code', name: 'Code', responsible: 'Coding Agent', status: 'validated', description: "PR ouverte par l'agent" },
  { id: 'ci', name: 'Tests CI', responsible: 'GitHub Actions', status: 'validated', description: 'Vitest + Playwright passent' },
  { id: 'dev', name: 'Dev', responsible: 'Auto-deploy', status: 'validated', description: 'Déployé sur Dev' },
  { id: 'lead', name: 'Review Lead', responsible: 'Claire / Sébastien', status: 'pending', description: 'Approbation Lead Tech obligatoire' },
  { id: 'uat', name: 'UAT', responsible: 'QA Agent', status: 'pending', description: 'Recette sur UAT' },
  { id: 'signoff', name: 'Sign-off SMCP', responsible: 'Héloïse / Aurélie', status: 'locked', description: 'Validation SMCP pour features critiques' },
  { id: 'prod', name: 'Production', responsible: 'Lead Tech', status: 'locked', description: 'Double approbation humaine' },
]

export const CURRENT_SPRINT = {
  name: 'Sprint 12',
  start: '2026-05-12',
  end: '2026-05-26',
}
