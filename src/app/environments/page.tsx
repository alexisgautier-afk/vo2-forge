import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/AppShell'
import { EnvCard } from '@/components/environments/EnvCard'
import { GateList } from '@/components/environments/GateList'
import { Pipeline } from '@/components/environments/Pipeline'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { ENVIRONMENTS, PIPELINE_GATES, SMCP_MILESTONES } from '@/lib/constants'

export default async function EnvironmentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <AppShell userEmail={user?.email}>
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold text-text-primary font-jost">Environments</h2>
          <p className="text-sm text-text-muted mt-0.5">
            Deployment pipeline — Dev → UAT → Production
          </p>
        </div>

        <section className="space-y-3">
          <SectionLabel>Active environments</SectionLabel>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {ENVIRONMENTS.map((env) => (
              <EnvCard key={env.name} env={env} />
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="space-y-3">
            <SectionLabel>Validation pipeline</SectionLabel>
            <GateList gates={PIPELINE_GATES} />
          </section>

          <section className="space-y-3">
            <SectionLabel>Critical milestones</SectionLabel>
            <Pipeline milestones={SMCP_MILESTONES} />
          </section>
        </div>
      </div>
    </AppShell>
  )
}
