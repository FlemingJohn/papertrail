import { agents } from "@/lib/agents/registry";
import { runStageLabels } from "@/lib/config/labels";
import { getToolLabel } from "@/lib/tools/registry";
import { displayMedium, microLabel, pill, sectionLabel } from "@/lib/design/tokens";

export const metadata = {
  title: "Agents — PaperTrail",
};

const stageOrder = [
  "finding-claims",
  "gathering-papers",
  "checking-citations",
  "checking-numbers",
  "checking-methods",
  "finding-conflicts",
  "reviewing",
  "writing-report",
] as const;

export default function AgentsPage() {
  const everyAgent = Object.values(agents);

  const byStage = stageOrder.map((stage) => ({
    stage,
    label: runStageLabels[stage],
    members: everyAgent.filter((agent) => agent.stage === stage),
  }));

  const withTools = everyAgent.filter(
    (agent) => agent.toolNames.length > 0
  ).length;

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-14">
        <p className={`${sectionLabel} mb-4`}>Agents</p>
        <h1 className={displayMedium}>
          Twenty-four specialists, and what each is allowed to do.
        </h1>
        <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Every agent has one job, one output shape, and an explicit list of
          tools it may call. {everyAgent.length - withTools} of the{" "}
          {everyAgent.length} have no tools at all — they reason over evidence
          handed to them. Giving a judge the ability to fetch more evidence
          turns it into a fourth investigator, which is not what that stage
          needs.
        </p>
      </header>

      <div className="mb-14 grid gap-8 sm:grid-cols-3">
        <Figure label="Agents" value={String(everyAgent.length)} />
        <Figure label="With tools" value={String(withTools)} />
        <Figure
          label="Reason only"
          value={String(everyAgent.length - withTools)}
        />
      </div>

      <div className="space-y-14">
        {byStage.map((group) => (
          <section key={group.stage} className="border-t border-white/10 pt-8">
            <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
              <p className={sectionLabel}>{group.label}</p>
              <span className={microLabel}>
                {group.members.length}{" "}
                {group.members.length === 1 ? "agent" : "agents"}
              </span>
            </div>

            <ul>
              {group.members.map((agent) => (
                <li
                  key={agent.name}
                  className="border-b border-white/10 py-5 last:border-b-0"
                >
                  <div className="mb-2 flex flex-wrap items-center gap-3">
                    <h2 className="font-display text-xl font-light">
                      {agent.label}
                    </h2>
                    <span className={microLabel}>{agent.name}</span>
                    <span className={microLabel}>
                      temperature {agent.temperature}
                    </span>
                  </div>

                  <p className="mb-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                    {readRole(agent.buildSystemPrompt())}
                  </p>

                  {agent.toolNames.length === 0 ? (
                    <span
                      className={`${pill} border-white/15 text-muted-foreground/60`}
                    >
                      no tools
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {agent.toolNames.map((toolName) => (
                        <span
                          key={toolName}
                          className={`${pill} border-accent/40 text-accent`}
                        >
                          {getToolLabel(toolName)}
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
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

function readRole(systemPrompt: string): string {
  const match = systemPrompt.match(/Your role: (.+)/);
  return match === null ? "" : match[1].trim();
}
