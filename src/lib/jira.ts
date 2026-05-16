const JIRA_BASE = process.env.ATLASSIAN_BASE_URL
const JIRA_EMAIL = process.env.ATLASSIAN_EMAIL
const JIRA_TOKEN = process.env.ATLASSIAN_API_TOKEN

const authHeader = Buffer.from(`${JIRA_EMAIL}:${JIRA_TOKEN}`).toString('base64')

export async function getJiraTickets(projectKey = 'SMCP') {
  const jql = encodeURIComponent(
    `project = ${projectKey} AND sprint in openSprints() ORDER BY updated DESC`
  )

  const res = await fetch(
    `${JIRA_BASE}/rest/api/3/search?jql=${jql}&maxResults=50&fields=summary,status,assignee`,
    {
      headers: {
        Authorization: `Basic ${authHeader}`,
        Accept: 'application/json',
      },
      next: { revalidate: 60 },
    }
  )

  if (!res.ok) throw new Error(`Jira API error: ${res.status}`)

  const data = await res.json()

  return data.issues.map((issue: { key: string; fields: { summary: string; status: { name: string }; assignee?: { displayName: string } } }) => ({
    id: issue.key,
    name: issue.fields.summary,
    status: mapJiraStatus(issue.fields.status.name),
    assignee: issue.fields.assignee?.displayName,
    url: `${JIRA_BASE}/browse/${issue.key}`,
    updated_at: new Date().toISOString(),
  }))
}

function mapJiraStatus(jiraStatus: string): string {
  const map: Record<string, string> = {
    'To Do': 'ready',
    'Ready': 'ready',
    'In Progress': 'in_progress',
    'In Review': 'review',
    'Code Review': 'review',
    'Blocked': 'blocked',
    'Done': 'ready',
  }
  return map[jiraStatus] ?? 'ready'
}
