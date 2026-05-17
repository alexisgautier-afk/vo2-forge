export const dynamic = 'force-dynamic'

import { createServiceClient } from '@/lib/supabase/service'
import { SignoffBoard } from '@/components/signoff/SignoffBoard'
import type { SignoffRequest } from '@/types'

export default async function SignOffPage() {
  const supabase = createServiceClient()

  const { data: requests } = await supabase
    .from('signoff_requests')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-blue-deep border-b border-white/10">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center gap-3">
          <span className="text-white font-jost font-bold text-lg tracking-tight">VO2</span>
          <span className="text-white/30">|</span>
          <span className="text-white/60 font-dm-sans">Forge</span>
          <span className="text-white/20 mx-1">·</span>
          <span className="text-white/80 text-sm font-dm-sans">Validation SMCP</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-2">
        <h1 className="text-2xl font-bold font-jost text-text-primary">
          Sign-off des features
        </h1>
        <p className="text-sm text-text-muted mb-8">
          Validez ou rejetez les features soumises par l'équipe VO2 avant mise en production.
        </p>

        <SignoffBoard initialRequests={(requests as SignoffRequest[]) ?? []} />
      </main>
    </div>
  )
}
