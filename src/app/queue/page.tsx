import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/AppShell'
import { RunList } from '@/components/queue/RunList'
import type { AgentRun } from '@/types'

export default async function QueuePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: runs } = await supabase
    .from('agent_runs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <AppShell userEmail={user?.email}>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-text-primary font-jost">Queue des agents</h2>
          <p className="text-sm text-text-muted mt-0.5">Historique des runs — 100 derniers</p>
        </div>
        <RunList initialRuns={(runs as AgentRun[]) ?? []} />
      </div>
    </AppShell>
  )
}
