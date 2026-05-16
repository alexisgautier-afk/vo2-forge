import { AppShell } from '@/components/layout/AppShell'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <AppShell userEmail={user?.email}>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-text-primary font-jost">Vue d'ensemble</h2>
          <p className="text-sm text-text-muted mt-0.5">Sprint 12 · 12 – 26 mai 2026</p>
        </div>

        {/* Placeholder metric cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Agents actifs', value: '0', sub: 'en ce moment' },
            { label: 'Runs aujourd\'hui', value: '0', sub: 'total' },
            { label: 'Tickets ouverts', value: '—', sub: 'sprint en cours' },
            { label: 'PRs ouvertes', value: '—', sub: 'smcp-clienteling' },
          ].map(({ label, value, sub }) => (
            <div key={label} className="card">
              <p className="label-mono mb-3">{label}</p>
              <p className="text-3xl font-bold font-jost text-text-primary">{value}</p>
              <p className="text-xs text-text-muted mt-1">{sub}</p>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
