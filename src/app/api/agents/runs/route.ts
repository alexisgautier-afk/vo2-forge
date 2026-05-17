import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { searchParams } = new URL(req.url)
  const agentType = searchParams.get('agent_type')

  let query = supabase
    .from('agent_runs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(30)

  if (agentType) query = query.eq('agent_type', agentType)

  const { data, error } = await query

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })

  return Response.json(data)
}
