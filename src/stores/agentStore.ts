import { create } from 'zustand'
import type { AgentType, AgentStatus, LogLevel } from '@/types'

export interface ActiveAgent {
  runId: string
  type: AgentType
  status: AgentStatus
  ticketId?: string
  ticketName?: string
  currentTask: string
  tokensUsed: number
  startedAt: string
}

export interface LogLine {
  id: number
  runId: string
  level: LogLevel
  message: string
  timestamp: string
}

interface AgentStore {
  activeAgents: ActiveAgent[]
  logLines: LogLine[]
  addAgent: (agent: ActiveAgent) => void
  updateAgent: (runId: string, updates: Partial<ActiveAgent>) => void
  removeAgent: (runId: string) => void
  addLogLine: (line: LogLine) => void
  clearLogs: (runId: string) => void
}

export const useAgentStore = create<AgentStore>((set) => ({
  activeAgents: [],
  logLines: [],
  addAgent: (agent) => set((state) => ({ activeAgents: [...state.activeAgents, agent] })),
  updateAgent: (runId, updates) =>
    set((state) => ({
      activeAgents: state.activeAgents.map((a) => a.runId === runId ? { ...a, ...updates } : a),
    })),
  removeAgent: (runId) =>
    set((state) => ({ activeAgents: state.activeAgents.filter((a) => a.runId !== runId) })),
  addLogLine: (line) =>
    set((state) => ({ logLines: [...state.logLines.slice(-500), line] })),
  clearLogs: (runId) =>
    set((state) => ({ logLines: state.logLines.filter((l) => l.runId !== runId) })),
}))
