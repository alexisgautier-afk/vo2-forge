import { createClient } from '@/lib/supabase/server'
import type { TicketStatus } from '@/types'

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  return Response.json(data)
}

interface CreateTicketBody {
  id: string
  name: string
  description?: string
  status: TicketStatus
  priority: 'low' | 'medium' | 'high' | 'critical'
  assignee?: string
  sprint?: string
}

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const body: CreateTicketBody = await request.json()

  const { data, error } = await supabase
    .from('tickets')
    .insert({ ...body, created_by: user.id })
    .select()
    .single()

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  return Response.json(data, { status: 201 })
}
