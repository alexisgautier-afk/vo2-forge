interface AgentPageProps {
  params: Promise<{ type: string }>
}

export default async function AgentPage({ params }: AgentPageProps) {
  const { type } = await params
  return <div>Agent {type}</div>
}
