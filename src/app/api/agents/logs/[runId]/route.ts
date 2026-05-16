import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 300

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { runId } = await params

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      // Send existing logs first
      const { data: existing } = await supabase
        .from('agent_logs')
        .select('*')
        .eq('run_id', runId)
        .order('id', { ascending: true })

      for (const log of existing ?? []) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(log)}\n\n`)
        )
      }

      // Check if run is already finished
      const { data: run } = await supabase
        .from('agent_runs')
        .select('status')
        .eq('id', runId)
        .single()

      if (run?.status === 'done' || run?.status === 'error') {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'run_' + run.status })}\n\n`)
        )
        controller.close()
        return
      }

      // Subscribe to realtime log inserts
      const channel = supabase
        .channel(`logs:${runId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'agent_logs',
            filter: `run_id=eq.${runId}`,
          },
          (payload) => {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(payload.new)}\n\n`)
            )
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'agent_runs',
            filter: `id=eq.${runId}`,
          },
          (payload) => {
            const status = payload.new.status as string
            if (status === 'done' || status === 'error') {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'run_' + status })}\n\n`)
              )
              supabase.removeChannel(channel)
              controller.close()
            }
          }
        )
        .subscribe()
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
