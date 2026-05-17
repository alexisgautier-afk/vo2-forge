import { NextRequest } from 'next/server'
import { spawn } from 'child_process'
import { createClient } from '@/lib/supabase/server'
import { AGENT_SYSTEM_PROMPTS } from '@/lib/claude'
import type { AgentType } from '@/types'

export const maxDuration = 300

const CLAUDE_BIN = process.env.CLAUDE_BIN ?? '/Users/vo2group/.npm-global/bin/claude'

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

        const result = await runClaude(
          CLAUDE_BIN,
          prompt,
          AGENT_SYSTEM_PROMPTS[agent_type],
          (chunk) => {
            // Stream each text chunk as a live log line
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

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'run_done', run_id: run.id, output: result.output, tokens_used: result.tokensUsed })}\n\n`)
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

interface ClaudeResult {
  output: string
  tokensUsed: number
}

function runClaude(
  bin: string,
  prompt: string,
  systemPrompt: string,
  onChunk: (text: string) => void,
): Promise<ClaudeResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, [
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
              fullOutput = text // assistant event carries the full text so far
              onChunk(text)
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
      // stderr is informational — not fatal
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
