"use client";

import { useEffect, useRef } from "react";
import type { AgentTrace } from "@/lib/client/use-run-stream";
import { CheckIcon, ProblemIcon, SpinnerIcon, WarningIcon } from "./icons";

interface LiveReasoningProps {
  agents: AgentTrace[];
}

export function LiveReasoning({ agents }: LiveReasoningProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const runningCount = agents.filter((agent) => agent.isRunning).length;

  useEffect(() => {
    containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [agents.length]);

  if (agents.length === 0) {
    return (
      <div className="flex h-full items-center justify-center border border-border/60 bg-card/40 px-6 py-16 text-center">
        <p className="max-w-xs text-sm text-muted-foreground">
          The reasoning of each specialist appears here as it works.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col border border-border/60 bg-card/40">
      <header className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <h2 className="text-sm tracking-wide text-foreground">
          What the specialists are thinking
        </h2>
        <span className="font-mono text-xs text-muted-foreground">
          {runningCount} working
        </span>
      </header>

      <div
        ref={containerRef}
        className="flex-1 divide-y divide-border/40 overflow-y-auto"
      >
        {agents.map((agent) => (
          <AgentCard
            key={`${agent.agentName}-${agent.subject}-${agent.startedAt}`}
            agent={agent}
          />
        ))}
      </div>
    </div>
  );
}

function AgentCard({ agent }: { agent: AgentTrace }) {
  const text = agent.isRunning
    ? agent.thinking
    : (agent.conclusion ?? agent.thinking);

  return (
    <article className="px-4 py-3">
      <div className="mb-1.5 flex items-baseline gap-2">
        <StatusMark agent={agent} />
        <h3 className="text-sm text-foreground">{agent.agentLabel}</h3>
        <span className="truncate font-mono text-xs text-muted-foreground">
          {agent.subject}
        </span>
      </div>

      <p className="whitespace-pre-wrap pl-6 text-sm leading-relaxed text-muted-foreground">
        {text.length === 0 ? "Reading…" : text}
        {agent.isRunning && text.length > 0 ? (
          <span className="ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 animate-pulse bg-accent" />
        ) : null}
      </p>
    </article>
  );
}

function StatusMark({ agent }: { agent: AgentTrace }) {
  if (agent.isRunning) {
    return (
      <SpinnerIcon className="size-4 shrink-0 animate-spin text-accent" />
    );
  }

  if (agent.level === "problem") {
    return <ProblemIcon className="size-4 shrink-0 text-verdict-retracted" />;
  }

  if (agent.level === "warning") {
    return (
      <WarningIcon className="size-4 shrink-0 text-verdict-wrong-source" />
    );
  }

  return <CheckIcon className="size-4 shrink-0 text-verdict-supported" />;
}
