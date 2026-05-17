import { createClient } from '@/lib/supabase/server'
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
  sprint?: string
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { id } = await params
  const body: PatchTicketBody = await request.json()

  const { data, error } = await supabase
    .from('tickets')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  return Response.json(data)
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
