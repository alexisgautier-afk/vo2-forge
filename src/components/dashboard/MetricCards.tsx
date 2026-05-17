interface MetricCardsProps {
  activeAgents: number
  runsToday: number
  openTickets: number
}

function daysUntilGoLive(): number {
  const goLive = new Date('2027-02-01')
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.max(0, Math.ceil((goLive.getTime() - now.getTime()) / 86400000))
}

interface MetricCardProps {
  label: string
  value: string | number
  sub: string
}

function MetricCard({ label, value, sub }: MetricCardProps) {
  return (
    <div className="card">
      <p className="label-mono mb-3">{label}</p>
      <p className="text-3xl font-bold font-jost text-text-primary">{value}</p>
      <p className="text-xs text-text-muted mt-1">{sub}</p>
    </div>
  )
}

export function MetricCards({ activeAgents, runsToday, openTickets }: MetricCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        label="Agents actifs"
        value={activeAgents}
        sub="en ce moment"
      />
      <MetricCard
        label="Runs aujourd'hui"
        value={runsToday}
        sub="total"
      />
      <MetricCard
        label="Tickets ouverts"
        value={openTickets}
        sub="sprint en cours"
      />
      <MetricCard
        label="Go-live V1"
        value={daysUntilGoLive()}
        sub="jours restants"
      />
    </div>
  )
}
