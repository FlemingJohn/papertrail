# Deploying to Vercel

The application builds and deploys as an ordinary Next.js app. One thing needs
attention before you press the button, and it is the reason this page exists.

## The function timeout is the whole problem

A standard check takes about **214 seconds**. The routes that run agents declare
`maxDuration = 300` so they are allowed to take that long:

| Route | Declared |
| --- | --- |
| `/api/runs` | 300s |
| `/api/documents` | 300s |
| `/api/projects` and its three gate routes | 300s |
| `/api/watch/[watchId]/check` | 120s |

Vercel only honours that on plans that allow long-running functions. On a plan
capped at 60 seconds the request is killed mid-run, and because these routes stream
NDJSON the browser sees a truncated stream rather than a clean error.

**Check your plan's function limit before deploying.** If it is 60 seconds:

- Everything except running agents still works — signing in, the knowledge base,
  reading stored reports, browsing a finished project, exporting a draft.
- Starting a new check or a new project will cut off partway.

The honest options are to deploy on a plan that permits 300 second functions, or to
run the agent work somewhere without a request timeout and keep Vercel for the
interface.

## Environment variables

Set these in **Project Settings, Environment Variables**, for Production and Preview.

| Name | Notes |
| --- | --- |
| `AZURE_OPENAI_API_KEY` | server only |
| `AZURE_OPENAI_ENDPOINT` | |
| `AZURE_OPENAI_API_VERSION` | `2025-01-01-preview` |
| `AZURE_OPENAI_DEPLOYMENT` | the deployment name, `gpt-4o` |
| `AZURE_DOCUMENT_ENDPOINT` | |
| `AZURE_DOCUMENT_KEY` | server only |
| `OPENALEX_CONTACT_EMAIL` | your address |
| `OPENALEX_API_KEY` | optional, raises the daily budget tenfold |
| `SUPABASE_URL` | |
| `SUPABASE_SERVICE_ROLE_KEY` | server only, never expose it |
| `DATABASE_URL` | the **pooled** connection, port 6543 |
| `NEXT_PUBLIC_SUPABASE_URL` | reaches the browser, which is fine |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | the `sb_publishable_...` key |

Use the pooled connection string. Serverless functions open and close connections
constantly, and the direct connection on port 5432 will exhaust its limit quickly.

## Deploying

```bash
npm install -g vercel      # or use npx
vercel login               # interactive, has to be you
vercel link                # attach this folder to a project
vercel --prod
```

`vercel` reads `.env.local` for local development only. Production values have to be
set in the dashboard or pushed with `vercel env add`.

## After the first deploy

Update Supabase so authentication points at the deployed origin, under
**Authentication, URL Configuration**:

- **Site URL** — the deployment origin, for example `https://papertrail.vercel.app`
- **Redirect URLs** — add the same origin

Leaving these at `http://localhost:3000` means confirmation and recovery links sent
by email point back at a machine nobody else can reach.

## What does not deploy

The MCP server (`npm run mcp`) speaks over stdio to a local client. It is a
development and integration tool and has no place in a web deployment.

The demo recorder under `videos/` drives a local browser against a local server. It
is never part of a build.
