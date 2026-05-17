export type AgentType = 'coding' | 'qa' | 'pm' | 'specs'
export type AgentStatus = 'pending' | 'running' | 'done' | 'error'
export type TicketStatus = 'ready' | 'in_progress' | 'review' | 'blocked'
export type EnvName = 'dev' | 'uat' | 'prod'
export type GateStatus = 'validated' | 'pending' | 'locked'
export type LogLevel = 'info' | 'warn' | 'error' | 'success'

export interface AgentRun {
  id: string
  created_at: string
  agent_type: AgentType
  status: AgentStatus
  ticket_id?: string
  ticket_name?: string
  prompt: string
  output?: string
  tokens_used: number
  triggered_by?: string
  error?: string
}

export interface AgentLog {
  id: number
  run_id: string
  created_at: string
  level: LogLevel
  message: string
}

export type TicketPriority = 'low' | 'medium' | 'high' | 'critical'

export interface Ticket {
  id: string
  name: string
  description?: string
  status: TicketStatus
  priority: 'low' | 'medium' | 'high' | 'critical'
  assignee?: string
  sprint?: string
  updated_at: string
  created_at: string
  created_by?: string
}

export interface SignoffRequest {
  id: string
  created_at: string
  feature_name: string
  description: string
  status: 'pending' | 'approved' | 'rejected'
  reviewed_by?: string
  comment?: string
  reviewed_at?: string
  ticket_id?: string
}

export interface GitHubPR {
  number: number
  title: string
  url: string
  state: 'open' | 'closed' | 'merged'
  author: string
  branch: string
  created_at: string
}

export interface Environment {
  name: EnvName
  branch: string
  last_deploy: string
  agents_allowed: AgentType[]
  status: 'healthy' | 'degraded' | 'offline'
  frozen: boolean
}

export interface Gate {
  id: string
  name: string
  responsible: string
  status: GateStatus
  description: string
}

export interface Milestone {
  name: string
  date: string
  description: string
  passed: boolean
}
