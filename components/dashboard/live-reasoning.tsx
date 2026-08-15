"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { AgentTrace } from "@/lib/client/use-run-stream";
import { microLabel, sectionLabel } from "@/lib/design/tokens";
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
      <div className="flex h-full flex-col justify-center border-t border-white/10 pt-8">
        <p className={`${sectionLabel} mb-6`}>The reasoning</p>
        <p className="max-w-md font-display text-2xl font-light italic leading-snug text-muted-foreground">
          Each specialist explains itself here, in its own words, while it
          works.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col border-t border-white/10 pt-8">
      <div className="mb-6 flex items-baseline justify-between">
        <p className={sectionLabel}>The reasoning</p>
        <span className={microLabel}>{runningCount} working</span>
      </div>

      <div ref={containerRef} className="flex-1 overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {agents.map((agent) => (
            <motion.article
              key={`${agent.agentName}-${agent.subject}-${agent.startedAt}`}
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="border-b border-white/10 py-5"
            >
              <div className="mb-3 flex flex-wrap items-baseline gap-3">
                <StatusMark agent={agent} />
                <h3 className="font-display text-lg font-light">
                  {agent.agentLabel}
                </h3>
                <span className={microLabel}>{agent.subject}</span>
              </div>

              <p className="whitespace-pre-wrap pl-7 text-sm leading-relaxed text-muted-foreground">
                {agent.isRunning
                  ? agent.thinking
                  : (agent.conclusion ?? agent.thinking)}
                {agent.isRunning ? (
                  <span className="ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 animate-pulse bg-accent" />
                ) : null}
              </p>
            </motion.article>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function StatusMark({ agent }: { agent: AgentTrace }) {
  if (agent.isRunning) {
    return <SpinnerIcon className="size-4 shrink-0 animate-spin text-accent" />;
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
