@AGENTS.md

# VO2 Forge — Mémoire agents

## Projet
Application clienteling mobile-first pour SMCP (Sandro, Maje, Claudie Pierlot, Fursac).
~750 boutiques globales. Go-live V1 : février 2027.

## Stack VO2 Forge (cette app)
- Next.js 16 App Router + TypeScript strict
- Supabase : Auth + Postgres + Storage
- Zustand (état global) + React Query (données serveur)
- Déployée sur Vercel
- Proxy auth (proxy.ts) — remplace middleware.ts depuis Next.js 16

## Stack application clienteling cible (ce qu'on développe)
- React Native (mobile-first) + TypeScript strict
- Tests : Vitest (unit) + Playwright (E2E)
- API : Node.js / Express sur Heroku
- Data : Snowflake (analytics) + Heroku (source of truth clients)
- Auth : Azure AD SSO
- Messaging : Twilio (SMS + WhatsApp) + SendGrid (email)
- Repo GitHub : vo2group/smcp-clienteling

## Règles absolues
- Ne jamais appeler les APIs Salesforce directement — passer par Heroku
- Pseudonymiser toute donnée client avant tout appel LLM (RGPD)
- Un composant = un fichier, maximum 300 lignes par fichier
- Aucun `any` en TypeScript
- Aucun `useEffect` pour fetcher des données — utiliser React Query

## Patterns imposés
- React Query pour tous les appels API
- Zustand pour l'état global uniquement
- Tailwind CSS v4 pour le styling (config via @theme dans globals.css, pas de tailwind.config.ts)
- Nommage branches : `feature/smcp-{id}-{slug}` (ex: feature/smcp-42-client-list)
- Next.js 16 : middleware.ts → proxy.ts, export function proxy() (pas middleware())
- Params de page/layout sont des Promises en Next.js 15+ : await params

## Supabase schema
- `agent_runs` : chaque déclenchement d'agent (type, status, tokens, output)
- `agent_logs` : lignes de log SSE par run
- `tickets` : cache local des tickets Jira
- `signoff_requests` : features soumises à validation SMCP

## Environnements
- Dev : déploiement automatique, tous agents autorisés
- UAT : déploiement humain uniquement, QA agent en lecture seule
- Prod : aucun agent, double approbation humaine, freeze décembre

## Gates de validation
- Coding agent : ouvre une PR, jamais de merge direct
- QA agent : commente la PR, ne merge pas
- Lead Tech (Claire / Sébastien) : approve obligatoire avant UAT
- Sign-off SMCP (Héloïse / Aurélie) : obligatoire avant prod pour features critiques

## Jalons critiques
- Juin 2026 : scope lock design sprints
- Novembre 2026 : ouverture UAT
- Décembre 2026 : freeze production
- Février 2027 : go-live V1

## Auth
- Supabase Auth gère toutes les sessions
- /sign-off est public (pas d'auth requise) — accessible via lien direct pour SMCP
- Toutes les autres routes sont protégées par proxy.ts
