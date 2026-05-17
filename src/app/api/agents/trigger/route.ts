import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { AGENT_SYSTEM_PROMPTS, runClaude } from '@/lib/claude'
import type { AgentType } from '@/types'

export const maxDuration = 300

interface BaTicketProposal {
  id: string
  name: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  assignee_agent: AgentType
}

function parseBaTickets(output: string): BaTicketProposal[] {
  try {
    const match = output.match(/\{[\s\S]*\}/)
    if (!match) return []
    const parsed = JSON.parse(match[0]) as { tickets?: BaTicketProposal[] }
    return Array.isArray(parsed.tickets) ? parsed.tickets : []
  } catch {
    return []
  }
}

interface PersonalisationRow {
  instructions: string
  files: { name: string; content: string }[]
}

async function buildSystemPrompt(agentType: AgentType): Promise<string> {
  const service = createServiceClient()

  const [{ data: global }, { data: agent }] = await Promise.all([
    service.from('agent_personalisation').select('instructions, files').is('agent_type', null).single(),
    service.from('agent_personalisation').select('instructions, files').eq('agent_type', agentType).single(),
  ])

  const core = AGENT_SYSTEM_PROMPTS[agentType]

  const sections: string[] = [core]

  const toSection = (row: PersonalisationRow | null, label: string) => {
    if (!row) return
    const parts: string[] = []
    if (row.instructions?.trim()) parts.push(row.instructions.trim())
    for (const f of row.files ?? []) {
      if (f.content?.trim()) parts.push(`--- ${f.name} ---\n${f.content.trim()}`)
    }
    if (parts.length > 0) sections.push(`## ${label}\n${parts.join('\n\n')}`)
  }

  toSection(global as PersonalisationRow | null, 'Global context')
  toSection(agent as PersonalisationRow | null, 'Agent-specific context')

  return sections.join('\n\n')
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const body = await req.json() as {
    agent_type: AgentType
    prompt: string
    ticket_id?: string
    ticket_name?: string
  }

  const { agent_type, prompt, ticket_id, ticket_name } = body
  if (!agent_type || !prompt) {
    return new Response('Missing agent_type or prompt', { status: 400 })
  }

  const { data: run, error: runError } = await supabase
    .from('agent_runs')
    .insert({ agent_type, prompt, ticket_id, ticket_name, status: 'running', triggered_by: user.id })
    .select()
    .single()

  if (runError || !run) return new Response('Failed to create run', { status: 500 })

  const encoder = new TextEncoder()

  const writeLog = async (
    controller: ReadableStreamDefaultController,
    level: 'info' | 'warn' | 'error' | 'success',
    message: string,
  ) => {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ level, message, run_id: run.id })}\n\n`))
    await supabase.from('agent_logs').insert({ run_id: run.id, level, message })
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'run_start', run_id: run.id })}\n\n`))
        await writeLog(controller, 'info', `Agent ${agent_type} started${ticket_id ? ` — ${ticket_id}` : ''}`)
        await writeLog(controller, 'info', 'Launching Claude CLI…')

        const systemPrompt = await buildSystemPrompt(agent_type)
        const result = await runClaude(
          prompt,
          systemPrompt,
          (chunk) => {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'chunk', text: chunk, run_id: run.id })}\n\n`)
            )
          },
        )

        await writeLog(controller, 'success', `Done — ${result.tokensUsed} tokens used`)

        await supabase
          .from('agent_runs')
          .update({ status: 'done', output: result.output, tokens_used: result.tokensUsed })
          .eq('id', run.id)

        // BA: parse output and persist ticket proposals
        let ticketsCreated: string[] = []
        if (agent_type === 'ba') {
          const proposals = parseBaTickets(result.output)
          if (proposals.length > 0) {
            const service = createServiceClient()
            const rows = proposals.map((t) => ({
              id: t.id,
              name: t.name,
              description: t.description,
              priority: t.priority,
              assignee_agent: t.assignee_agent,
              status: 'pending_approval',
              created_by: user.id,
            }))
            const { data: created } = await service.from('tickets').insert(rows).select('id')
            ticketsCreated = (created ?? []).map((r: { id: string }) => r.id)
            await writeLog(controller, 'success', `${ticketsCreated.length} ticket(s) created and awaiting approval`)
          }
        }

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'run_done',
            run_id: run.id,
            output: result.output,
            tokens_used: result.tokensUsed,
            tickets_created: ticketsCreated,
          })}\n\n`)
        )
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        await supabase.from('agent_runs').update({ status: 'error', error: message }).eq('id', run.id)
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'run_error', run_id: run.id, message })}\n\n`))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
  })
}
