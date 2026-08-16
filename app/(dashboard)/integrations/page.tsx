import { allTools } from "@/lib/tools/registry";
import { displayMedium, microLabel, pill, sectionLabel } from "@/lib/design/tokens";

export const metadata = {
  title: "Integrations — PaperTrail",
};

const evidenceSources = [
  {
    name: "OpenAlex",
    role: "Resolving references, searching related work, listing what a paper cites",
    key: "none needed",
  },
  {
    name: "Crossref",
    role: "Retraction and correction status",
    key: "none needed",
  },
  {
    name: "Europe PMC",
    role: "Full text of open access sources",
    key: "none needed",
  },
  {
    name: "Azure Document Intelligence",
    role: "Turning a PDF into text with page positions",
    key: "endpoint and key",
  },
  {
    name: "Azure OpenAI",
    role: "Every agent, in strict JSON schema mode",
    key: "endpoint and key",
  },
];

export default function IntegrationsPage() {
  const openTools = allTools.filter((tool) => tool.availableToAgents);

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-14">
        <p className={`${sectionLabel} mb-4`}>Integrations</p>
        <h1 className={displayMedium}>
          The same checks, from inside your editor.
        </h1>
        <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          PaperTrail ships a Model Context Protocol server, so a researcher can
          verify a citation without opening this app at all. The tools below
          are the same ones the agents use.
        </p>
      </header>

      <section className="border-t border-white/10 pt-8">
        <p className={`${sectionLabel} mb-6`}>Model Context Protocol server</p>

        <div className="mb-8 grid gap-8 sm:grid-cols-3">
          <Figure label="Servers" value="1" />
          <Figure label="Tools exposed" value={String(openTools.length)} />
          <Figure label="Transport" value="stdio" />
        </div>

        <p className="mb-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Start it with <code className="font-mono text-xs">npm run mcp</code>,
          then add this to your client configuration:
        </p>

        <pre className="mb-8 overflow-x-auto border border-white/10 bg-black/40 p-5 font-mono text-xs leading-relaxed text-muted-foreground">
{`{
  "mcpServers": {
    "papertrail": {
      "command": "npx",
      "args": ["tsx", "mcp/server.ts"],
      "cwd": "/absolute/path/to/papertrail"
    }
  }
}`}
        </pre>

        <ul>
          {openTools.map((tool) => (
            <li
              key={tool.name}
              className="border-b border-white/10 py-4 last:border-b-0"
            >
              <div className="mb-2 flex flex-wrap items-center gap-3">
                <span className="font-mono text-sm">{tool.name}</span>
                <span className={`${pill} border-accent/40 text-accent`}>
                  agent callable
                </span>
              </div>
              <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
                {tool.description}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-14 border-t border-white/10 pt-8">
        <p className={`${sectionLabel} mb-6`}>Where the evidence comes from</p>

        <ul>
          {evidenceSources.map((source) => (
            <li
              key={source.name}
              className="flex flex-wrap items-baseline justify-between gap-4 border-b border-white/10 py-4 last:border-b-0"
            >
              <div className="min-w-0 flex-1">
                <p className="mb-1 font-display text-lg font-light">
                  {source.name}
                </p>
                <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {source.role}
                </p>
              </div>
              <span className={microLabel}>{source.key}</span>
            </li>
          ))}
        </ul>

        <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Three of the five are public, free and need no registration. No
          proprietary dataset is involved, and nothing is sent anywhere except
          Azure and those three.
        </p>
      </section>
    </div>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-white/10 pt-5">
      <p className={`${microLabel} mb-3`}>{label}</p>
      <p className="font-display text-4xl font-light leading-none">{value}</p>
    </div>
  );
}
