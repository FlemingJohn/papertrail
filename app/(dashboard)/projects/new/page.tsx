"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { ResearchDomain } from "@/lib/schemas/project";
import { useProjectStream } from "@/lib/client/use-project-stream";
import {
  buttonPrimary,
  displayMedium,
  microLabel,
  sectionLabel,
} from "@/lib/design/tokens";
import { ErrorBoundary } from "@/components/dashboard/error-boundary";
import { ProjectProgress } from "@/components/projects/project-progress";

const domains: Array<{ value: ResearchDomain; label: string }> = [
  { value: "machine-learning", label: "Machine learning" },
  { value: "clinical", label: "Clinical" },
  { value: "biology", label: "Biology" },
  { value: "physics", label: "Physics" },
  { value: "other", label: "Something else" },
];

const paperCounts = [5, 8, 10, 12];

export default function NewProjectPage() {
  return (
    <ErrorBoundary>
      <NewProjectFlow />
    </ErrorBoundary>
  );
}

function NewProjectFlow() {
  const router = useRouter();
  const { state, send } = useProjectStream();

  const [question, setQuestion] = useState("");
  const [domain, setDomain] = useState<ResearchDomain>("machine-learning");
  const [paperTarget, setPaperTarget] = useState(10);

  useEffect(() => {
    if (state.status === "waiting" && state.projectId !== null) {
      const timer = window.setTimeout(() => {
        router.push(`/projects/${state.projectId}`);
      }, 1400);

      return () => window.clearTimeout(timer);
    }

    return undefined;
  }, [state.status, state.projectId, router]);

  const isReady = question.trim().length >= 12;

  if (state.status === "idle") {
    return (
      <div className="mx-auto max-w-2xl">
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-14"
        >
          <p className={`${sectionLabel} mb-4`}>Start a project</p>
          <h1 className={displayMedium}>What are you trying to find out?</h1>
        </motion.header>

        <section className="mb-12">
          <label htmlFor="question" className={`${sectionLabel} mb-4 block`}>
            Your research question
          </label>
          <textarea
            id="question"
            rows={3}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Whether retrieval helps long context models on multi step reasoning"
            className="w-full resize-none border-b border-white/20 bg-transparent pb-3 font-display text-xl font-light leading-snug outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-white/50"
          />
          <p className={`${microLabel} mt-3`}>
            Word it the way you would search a database, not the way you would
            ask a person
          </p>
        </section>

        <section className="mb-12 border-t border-white/10 pt-8">
          <p className={`${sectionLabel} mb-5`}>Field</p>
          <div className="flex flex-wrap gap-2">
            {domains.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setDomain(option.value)}
                aria-pressed={domain === option.value}
                className={`rounded-full border px-5 py-2 font-mono text-[10px] uppercase tracking-widest transition-colors ${
                  domain === option.value
                    ? "border-white/60 text-foreground"
                    : "border-white/20 text-muted-foreground hover:border-white/40"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        <section className="mb-12 border-t border-white/10 pt-8">
          <p className={`${sectionLabel} mb-5`}>How many papers to gather</p>
          <div className="flex flex-wrap gap-2">
            {paperCounts.map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => setPaperTarget(count)}
                aria-pressed={paperTarget === count}
                className={`rounded-full border px-5 py-2 font-mono text-[10px] uppercase tracking-widest transition-colors ${
                  paperTarget === count
                    ? "border-white/60 text-foreground"
                    : "border-white/20 text-muted-foreground hover:border-white/40"
                }`}
              >
                {count}
              </button>
            ))}
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Retracted papers are dropped before anything is read, so the count
            you get back may be lower than the count you asked for.
          </p>
        </section>

        <section className="border-t border-white/10 pt-8">
          <motion.button
            type="button"
            whileHover={isReady ? { scale: 1.03 } : undefined}
            whileTap={isReady ? { scale: 0.97 } : undefined}
            disabled={!isReady}
            onClick={() => {
              void send("/api/projects", {
                question: question.trim(),
                domain,
                paperTarget,
              });
            }}
            className={`${buttonPrimary} disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-foreground`}
          >
            Gather the papers
          </motion.button>

          <p className={`${microLabel} mt-4`}>
            About two minutes · roughly $0.15
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10 border-b border-white/10 pb-8"
      >
        <p className={`${sectionLabel} mb-3`}>Starting the project</p>
        <h1 className="max-w-3xl font-display text-2xl font-light leading-snug md:text-3xl">
          {question}
        </h1>
        {state.gate === null ? null : (
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-accent">
            {state.gate.message} Taking you there now.
          </p>
        )}
      </motion.header>

      <ProjectProgress stream={state} />
    </div>
  );
}
