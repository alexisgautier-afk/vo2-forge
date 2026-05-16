import { Octokit } from 'octokit'

export const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
})

const [owner, repo] = (process.env.GITHUB_REPO ?? 'vo2group/smcp-clienteling').split('/')

export async function getPullRequests() {
  const { data } = await octokit.rest.pulls.list({
    owner,
    repo,
    state: 'open',
    per_page: 20,
    sort: 'updated',
    direction: 'desc',
  })

  return data.map((pr) => ({
    number: pr.number,
    title: pr.title,
    url: pr.html_url,
    state: pr.state,
    author: pr.user?.login ?? 'unknown',
    branch: pr.head.ref,
    created_at: pr.created_at,
  }))
}
