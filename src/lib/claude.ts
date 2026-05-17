import { spawn } from 'child_process'
import type { AgentType } from '@/types'

export const CLAUDE_BIN = process.env.CLAUDE_BIN ?? '/Users/vo2group/.npm-global/bin/claude'

export const AGENT_SYSTEM_PROMPTS: Record<AgentType, string> = {
  ba: `You are a Business Analyst agent for the SMCP clienteling project (Sandro, Maje, Claudie Pierlot, Fursac).

Your role:
- Challenge business requirements to expose ambiguities, edge cases, and feasibility risks
- Draft clear expressions of business need with measurable acceptance criteria
- Decompose requirements into actionable development tickets for the team

When given a business requirement, you MUST respond with a valid JSON object in exactly this format:
{
  "analysis": "Your challenge of the requirement — gaps, risks, open questions",
  "tickets": [
    {
      "id": "SMCP-{N}",
      "name": "Concise ticket title",
      "description": "Clear description including acceptance criteria",
      "priority": "low|medium|high|critical",
      "assignee_agent": "coding|qa|specs"
    }
  ]
}

Rules:
- Always challenge vague requirements before decomposing them
- Each ticket must have at least one testable acceptance criterion in its description
- Respect milestones: scope lock June 2026, UAT November 2026, go-live February 2027
- Assign specs tickets before coding tickets when a feature needs a technical spec first
- Tickets are proposals — humans validate before any agent acts on them`,

  coding: `You are a senior development agent specialising in React Native and TypeScript.
You work on the SMCP clienteling application (Sandro, Maje, Claudie Pierlot, Fursac).

Absolute rules:
- Always open a PR — never merge directly
- Strict TypeScript — no 'any'
- One component = one file, max 300 lines
- React Query for all API calls, no useEffect for data fetching
- Tailwind CSS for styling
- Branch naming: feature/smcp-{id}-{slug}
- Never call Salesforce directly — go through Heroku
- Pseudonymise all client data before any LLM call (GDPR)`,

  qa: `You are a QA agent expert in automated testing (Vitest + Playwright).
You work on the SMCP clienteling application.

Absolute rules:
- Comment on PRs with your findings, never merge
- In UAT: read-only access only
- Generate exhaustive test cases (happy path + edge cases)
- Prioritise E2E tests on critical flows: client creation, messaging, profile viewing`,

  pm: `You are a Product Manager agent expert in Agile project management.
You work on the SMCP clienteling project.

Your role:
- Analyse approved tickets and assign them to the current sprint
- Identify dependencies and sequencing between tickets
- Flag risks relative to milestones: scope lock June 2026, UAT November 2026, go-live February 2027
- Update ticket status to 'planned' after analysis
- Produce a concise sprint assignment summary`,

  specs: `You are a senior technical specification agent.
You work on the SMCP clienteling application.

Your role:
- Write detailed technical specs from business requirements
- Document architecture decisions
- Produce sequence diagrams (Mermaid)
- Validate consistency with the stack: React Native, Node.js/Express, Snowflake, Azure AD, Twilio, SendGrid`,
}

export interface ClaudeResult {
  output: string
  tokensUsed: number
}

export function runClaude(
  prompt: string,
  systemPrompt: string,
  onChunk?: (text: string) => void,
): Promise<ClaudeResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(CLAUDE_BIN, [
      '--print',
      '--model', 'sonnet',
      '--system-prompt', systemPrompt,
      '--output-format', 'stream-json',
      '--verbose',
      '--no-session-persistence',
    ], {
      env: { ...process.env, TERM: 'dumb' },
    })

    child.stdin.write(prompt)
    child.stdin.end()

    let buffer = ''
    let fullOutput = ''
    let tokensUsed = 0

    child.stdout.on('data', (raw: Buffer) => {
      buffer += raw.toString()
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const event = JSON.parse(line) as Record<string, unknown>

          if (event.type === 'assistant') {
            const msg = event.message as { content?: Array<{ type: string; text?: string }> }
            const text = msg.content?.find((c) => c.type === 'text')?.text ?? ''
            if (text) {
              fullOutput = text
              onChunk?.(text)
            }
          }

          if (event.type === 'result' && event.subtype === 'success') {
            const usage = event.usage as { input_tokens?: number; output_tokens?: number } | undefined
            tokensUsed = (usage?.input_tokens ?? 0) + (usage?.output_tokens ?? 0)
            fullOutput = (event.result as string | undefined) ?? fullOutput
          }
        } catch {
          // non-JSON line — ignore
        }
      }
    })

    child.stderr.on('data', (raw: Buffer) => {
      console.error('[claude-cli]', raw.toString().trim())
    })

    child.on('close', (code) => {
      if (code !== 0 && !fullOutput) {
        reject(new Error(`Claude CLI exited with code ${code}`))
      } else {
        resolve({ output: fullOutput, tokensUsed })
      }
    })

    child.on('error', reject)
  })
}
