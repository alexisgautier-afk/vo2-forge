import { after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { AGENT_SYSTEM_PROMPTS, runClaude } from '@/lib/claude'
import type { TicketStatus } from '@/types'

interface RouteContext {
  params: Promise<{ id: string }>
}

interface PatchTicketBody {
  name?: string
  description?: string
  status?: TicketStatus
  priority?: 'low' | 'medium' | 'high' | 'critical'
  assignee?: string
  assignee_agent?: string
  sprint?: string
  rejection_comment?: string
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { id } = await params
  const body: PatchTicketBody = await request.json()

  const { data: ticket, error } = await supabase
    .from('tickets')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  // Auto-trigger PM agent in the background when a ticket is approved
  if (body.status === 'approved' && ticket) {
    after(async () => {
      const service = createServiceClient()

      const { data: run } = await service
        .from('agent_runs')
        .insert({
          agent_type: 'pm',
          prompt: `Ticket ${ticket.id} has been approved.\nTitle: ${ticket.name}\nDescription: ${ticket.description ?? 'N/A'}\n\nAnalyse this ticket: assign it to the current sprint, determine sequencing relative to other planned tickets, identify dependencies, and update your sprint plan.`,
          ticket_id: ticket.id,
          ticket_name: ticket.name,
          status: 'running',
          triggered_by: null,
        })
        .select()
        .single()

      if (!run) return

      try {
        const result = await runClaude(
          `Ticket ${ticket.id} approved — Title: ${ticket.name} — Description: ${ticket.description ?? 'N/A'}. Assign sprint, identify dependencies, flag risks vs milestones.`,
          AGENT_SYSTEM_PROMPTS.pm,
        )

        await service
          .from('agent_runs')
          .update({ status: 'done', output: result.output, tokens_used: result.tokensUsed })
          .eq('id', run.id)

        await service
          .from('tickets')
          .update({ status: 'planned', updated_at: new Date().toISOString() })
          .eq('id', ticket.id)

        await service
          .from('agent_logs')
          .insert({ run_id: run.id, level: 'success', message: `PM planning complete — ${result.tokensUsed} tokens` })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        await service.from('agent_runs').update({ status: 'error', error: message }).eq('id', run.id)
      }
    })
  }

  return Response.json(ticket)
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { id } = await params

  const { error } = await supabase
    .from('tickets')
    .delete()
    .eq('id', id)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  return new Response(null, { status: 204 })
}
