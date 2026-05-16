import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic, AGENT_SYSTEM_PROMPTS } from '@/lib/claude'
import type { AgentType } from '@/types'

export const maxDuration = 300

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

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
    .insert({
      agent_type,
      prompt,
      ticket_id,
      ticket_name,
      status: 'running',
      triggered_by: user.id,
    })
    .select()
    .single()

  if (runError || !run) {
    return new Response('Failed to create run', { status: 500 })
  }

  const encoder = new TextEncoder()

  const writeLog = async (
    controller: ReadableStreamDefaultController,
    level: 'info' | 'warn' | 'error' | 'success',
    message: string,
  ) => {
    controller.enqueue(
      encoder.encode(`data: ${JSON.stringify({ level, message, run_id: run.id })}\n\n`)
    )
    await supabase.from('agent_logs').insert({ run_id: run.id, level, message })
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'run_start', run_id: run.id })}\n\n`)
        )

        await writeLog(controller, 'info', `Agent ${agent_type} démarré${ticket_id ? ` — ${ticket_id}` : ''}`)
        await writeLog(controller, 'info', 'Connexion à Claude…')

        let fullOutput = ''

        const claudeStream = anthropic.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 8096,
          system: AGENT_SYSTEM_PROMPTS[agent_type],
          messages: [{ role: 'user', content: prompt }],
        })

        await writeLog(controller, 'info', 'Génération en cours…')

        for await (const chunk of claudeStream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            fullOutput += chunk.delta.text
          }
        }

        const finalMessage = await claudeStream.finalMessage()
        const tokensUsed = finalMessage.usage.input_tokens + finalMessage.usage.output_tokens

        await writeLog(controller, 'success', `Terminé — ${tokensUsed} tokens utilisés`)

        await supabase
          .from('agent_runs')
          .update({ status: 'done', output: fullOutput, tokens_used: tokensUsed })
          .eq('id', run.id)

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'run_done', run_id: run.id, output: fullOutput, tokens_used: tokensUsed })}\n\n`
          )
        )
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur inconnue'

        await supabase
          .from('agent_runs')
          .update({ status: 'error', error: message })
          .eq('id', run.id)

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'run_error', run_id: run.id, message })}\n\n`
          )
        )
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
