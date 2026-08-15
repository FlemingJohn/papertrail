# Setup

## What you need

- Node 20.9 or newer
- An Azure AI Services resource with a GPT-4o deployment
- Azure Document Intelligence, which may already be enabled on the same resource

## 1. Azure OpenAI

In Azure AI Foundry, create a deployment named `gpt-4o`.

Your endpoint will look like one of these:

```
https://your-resource.openai.azure.com
https://your-resource.cognitiveservices.azure.com
```

Both work. If yours ends in `cognitiveservices.azure.com` it is a multi-service AI Services resource, which means Document Intelligence may be available on the same key. Check the APIs list on the resource before provisioning a second service.

The code builds the request path itself in `lib/config/environment.ts`, so paste the endpoint exactly as Azure gives it, with or without a trailing slash.

## 2. Azure Document Intelligence

If it is not already on your AI Services resource, create a Document Intelligence resource in the same region. Copy its endpoint and key.

PaperTrail uses the `prebuilt-layout` model with markdown output. That model returns a bounding polygon for every paragraph and table cell, which is what lets the report point back at the exact place a claim appears.

## 3. Environment values

```bash
cp .env.example .env.local
```

Fill in:

| Name | Where it comes from |
| --- | --- |
| `AZURE_OPENAI_API_KEY` | Resource, Keys and Endpoint |
| `AZURE_OPENAI_ENDPOINT` | Same page |
| `AZURE_OPENAI_API_VERSION` | Leave at `2025-01-01-preview` |
| `AZURE_OPENAI_DEPLOYMENT` | The deployment name you chose, `gpt-4o` |
| `AZURE_DOCUMENT_ENDPOINT` | Document Intelligence resource |
| `AZURE_DOCUMENT_KEY` | Same page |
| `OPENALEX_CONTACT_EMAIL` | Your email. OpenAlex asks for it and gives faster service in return |

`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` and `DATABASE_URL` are validated on startup but are only needed once you store reports for the watch feature.

`.env.local` is gitignored. Keep it that way. If a key ever reaches a shared log or a chat window, rotate it in the portal rather than hoping.

## 4. Run it

```bash
npm install
npm run dev
```

Open `http://localhost:3000/check`, drop in a PDF and choose a depth.

| Depth | Comparison papers | Claims | Review | Typical time |
| --- | --- | --- | --- | --- |
| Quick | none | up to 15 | no | about 1 minute |
| Standard | 5 | up to 35 | yes | 2 to 4 minutes |
| Deep | 10 | up to 60 | yes | 5 to 8 minutes |

Start with Quick on a short open access paper to confirm your keys work before spending on a full run.

## 5. Checks before committing

```bash
npm run typecheck
npm run build
```

The build fails on type errors by design. That is what keeps the schemas and the code in step.

## Deploying

The app runs on Vercel unchanged. One thing to know: the analysis route declares `maxDuration = 300`, which is the ceiling on Vercel's Hobby plan. Standard runs fit comfortably. Deep runs on a long paper can approach it, so either use Pro, or move `executeRun` to a background worker and have the route return a run identifier instead of a stream. Nothing else changes; the graph is a plain function.

## The MCP server

```bash
npm run mcp
```

This exposes the lookup tools over stdio for any MCP client. To use it from Claude Desktop, add:

```json
{
  "mcpServers": {
    "papertrail": {
      "command": "npx",
      "args": ["tsx", "mcp/server.ts"],
      "cwd": "/absolute/path/to/papertrail"
    }
  }
}
```

## Common problems

**`Missing or invalid environment variables`** — the message names the ones that failed. Check `.env.local` exists and that the endpoints are full URLs.

**A 404 from Azure OpenAI** — the deployment name in `AZURE_OPENAI_DEPLOYMENT` must match Azure exactly, and it is the deployment name, not the model name. They are often different.

**Every citation comes back `Source not found`** — the reference list was not detected. Check that the PDF has real text rather than scanned images; Document Intelligence can read scans, but a reference list rendered as an image will not match citation markers.

**The run is slower than the table above** — most of the time is spent waiting on OpenAlex and Europe PMC. Results are cached for a week, so a second run on the same paper is much faster.
