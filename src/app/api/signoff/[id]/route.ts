import { createServiceClient } from '@/lib/supabase/service'

interface RouteContext {
  params: Promise<{ id: string }>
}

interface PatchSignoffBody {
  status: 'approved' | 'rejected'
  reviewed_by: string
  comment?: string
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const supabase = createServiceClient()
  const { id } = await params
  const body: PatchSignoffBody = await request.json()

  const { data, error } = await supabase
    .from('signoff_requests')
    .update({
      status: body.status,
      reviewed_by: body.reviewed_by,
      comment: body.comment,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  return Response.json(data)
}
