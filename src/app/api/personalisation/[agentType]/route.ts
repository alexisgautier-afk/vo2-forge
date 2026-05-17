import { createClient } from '@/lib/supabase/server'

interface RouteContext {
  params: Promise<{ agentType: string }>
}

export async function GET(_req: Request, { params }: RouteContext) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { agentType } = await params
  const isGlobal = agentType === 'global'

  const q = isGlobal
    ? supabase.from('agent_personalisation').select('instructions, files, updated_at').is('agent_type', null).single()
    : supabase.from('agent_personalisation').select('instructions, files, updated_at').eq('agent_type', agentType).single()

  const { data, error } = await q

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })

  return Response.json(data ?? { instructions: '', files: [] })
}

interface PutBody {
  instructions: string
  files: { name: string; content: string }[]
}

export async function PUT(req: Request, { params }: RouteContext) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { agentType } = await params
  const isGlobal = agentType === 'global'
  const body: PutBody = await req.json()

  const update = { instructions: body.instructions, files: body.files, updated_at: new Date().toISOString(), updated_by: user.id }

  const q = isGlobal
    ? supabase.from('agent_personalisation').update(update).is('agent_type', null).select().single()
    : supabase.from('agent_personalisation').update(update).eq('agent_type', agentType).select().single()

  const { data, error } = await q

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })

  return Response.json(data)
}
