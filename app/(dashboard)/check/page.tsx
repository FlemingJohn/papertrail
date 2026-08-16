"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import type { RunDepth } from "@/lib/schemas/run";
import type { DocumentSummary } from "@/lib/tools/database/list-documents";
import { useDashboard } from "@/lib/client/dashboard-context";
import { formatDollars } from "@/lib/config/pricing";
import {
  buttonPrimary,
  buttonQuiet,
  buttonSecondary,
  displayMedium,
  microLabel,
  sectionLabel,
} from "@/lib/design/tokens";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { ErrorBoundary } from "@/components/dashboard/error-boundary";
import {
  CheckIcon,
  ProblemIcon,
  SpinnerIcon,
} from "@/components/dashboard/icons";
import { LiveReasoning } from "@/components/dashboard/live-reasoning";
import { PipelineProgress } from "@/components/dashboard/pipeline-progress";

const depthOptions: Array<{
  value: RunDepth;
  label: string;
  detail: string;
  cost: string;
}> = [
  {
    value: "quick",
    label: "Quick",
    detail: "the paper on its own",
    cost: "about a minute · roughly $0.25",
  },
  {
    value: "standard",
    label: "Standard",
    detail: "plus 5 related papers, conflicts and a review",
    cost: "about three minutes · roughly $0.90",
  },
  {
    value: "deep",
    label: "Deep",
    detail: "plus 10 related papers",
    cost: "about six minutes · roughly $2.00",
  },
];

export default function CheckPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={null}>
        <CheckFlow />
      </Suspense>
    </ErrorBoundary>
  );
}

function CheckFlow() {
  const searchParams = useSearchParams();
  const { run, startRun, cancelRun } = useDashboard();

  const [papers, setPapers] = useState<DocumentSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chosen, setChosen] = useState<string | null>(searchParams.get("paper"));
  const [depth, setDepth] = useState<RunDepth>("standard");

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/documents");
      if (response.ok) {
        const body = (await response.json()) as { documents: DocumentSummary[] };
        setPapers(body.documents);
        setChosen((current) => current ?? body.documents[0]?.documentId ?? null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const hasStarted = run.status !== "idle";
  const isRunning = run.status === "running";
  const chosenPaper = papers.find((paper) => paper.documentId === chosen);
  const selectedDepth = depthOptions.find((option) => option.value === depth);

  if (!hasStarted) {
    return (
      <div className="mx-auto max-w-2xl">
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-14"
        >
          <p className={`${sectionLabel} mb-4`}>Check a paper</p>
          <h1 className={displayMedium}>Which paper should be checked?</h1>
        </motion.header>

        <section className="mb-12">
          <p className={`${sectionLabel} mb-5`}>Choose from your papers</p>

          {isLoading ? (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <SpinnerIcon className="size-4 animate-spin" />
              Loading your papers
            </div>
          ) : papers.length === 0 ? (
            <div className="border border-white/10 px-6 py-10">
              <p className="mb-3 font-display text-xl font-light">
                No papers yet.
              </p>
              <p className="mb-6 max-w-md text-sm leading-relaxed text-muted-foreground">
                Add one to your knowledge base first. It is read once and kept,
                so checking it later costs less.
              </p>
              <Link href="/knowledge" className={buttonSecondary}>
                Add a paper
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {papers.map((paper) => (
                <button
                  key={paper.documentId}
                  type="button"
                  onClick={() => setChosen(paper.documentId)}
                  aria-pressed={chosen === paper.documentId}
                  className={`flex w-full items-start gap-3 border px-4 py-4 text-left transition-colors ${
                    chosen === paper.documentId
                      ? "border-white/40 bg-white/5"
                      : "border-white/10 hover:border-white/25"
                  }`}
                >
                  <span
                    className={`mt-1.5 size-3 shrink-0 rounded-full border ${
                      chosen === paper.documentId
                        ? "border-accent bg-accent"
                        : "border-white/25"
                    }`}
                  />
                  <span className="min-w-0">
                    <span className="block font-display text-base leading-snug">
                      {paper.title}
                    </span>
                    <span className={`${microLabel} mt-1.5 block`}>
                      {paper.pageCount} pages · already read ·{" "}
                      {paper.checkCount === 0
                        ? "never checked"
                        : `checked ${paper.checkCount} times`}
                    </span>
                  </span>
                </button>
              ))}

              <Link
                href="/knowledge"
                className={`${microLabel} mt-4 inline-block transition-colors hover:text-foreground`}
              >
                Add a new paper instead
              </Link>
            </div>
          )}
        </section>

        <section className="mb-12 border-t border-white/10 pt-8">
          <p className={`${sectionLabel} mb-5`}>How deep</p>
          <div className="flex flex-wrap gap-2">
            {depthOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setDepth(option.value)}
                aria-pressed={depth === option.value}
                className={`rounded-full border px-5 py-2 font-mono text-[10px] uppercase tracking-widest transition-colors ${
                  depth === option.value
                    ? "border-white/60 text-foreground"
                    : "border-white/20 text-muted-foreground hover:border-white/40"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {selectedDepth === undefined ? null : (
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {selectedDepth.detail} · {selectedDepth.cost}
            </p>
          )}
        </section>

        <section className="border-t border-white/10 pt-8">
          <motion.button
            type="button"
            whileHover={chosen === null ? undefined : { scale: 1.03 }}
            whileTap={chosen === null ? undefined : { scale: 0.97 }}
            disabled={chosen === null}
            onClick={() => {
              if (chosen !== null) {
                void startRun(chosen, depth);
              }
            }}
            className={`${buttonPrimary} disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-foreground`}
          >
            Check this paper
          </motion.button>

          <p className={`${microLabel} mt-4`}>
            Reading is already done, so this skips the document reader
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
        className="mb-10 flex flex-wrap items-end justify-between gap-6 border-b border-white/10 pb-8"
      >
        <div className="min-w-0">
          <p className={`${sectionLabel} mb-3`}>
            {isRunning ? "Checking now" : "Check finished"}
          </p>
          <h1 className="max-w-2xl font-display text-2xl font-light leading-snug md:text-3xl">
            {chosenPaper?.title ?? "This paper"}
          </h1>
          <p className={`${microLabel} mt-3`}>
            {depth} · {run.progress.stageLabel}
          </p>
        </div>

        <div className="flex items-center gap-5">
          <span className="text-right">
            <span className={`${microLabel} block`}>This run</span>
            <span className="font-display text-2xl font-light">
              {formatDollars(run.spendDollars)}
            </span>
          </span>

          {isRunning ? (
            <button type="button" onClick={cancelRun} className={buttonQuiet}>
              Stop
            </button>
          ) : (
            <Link href="/check" className={buttonQuiet}>
              Check another
            </Link>
          )}
        </div>
      </motion.header>

      {run.reportId === null ? null : (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12 flex flex-wrap items-center justify-between gap-6 border border-verdict-supported/40 px-6 py-5"
        >
          <div className="flex items-center gap-3">
            <CheckIcon className="size-5 shrink-0 text-verdict-supported" />
            <div>
              <p className="font-display text-lg font-light">
                The report is ready
              </p>
              <p className={`${microLabel} mt-1`}>
                Stored with its own address
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/reports/${run.reportId}`} className={buttonSecondary}>
              Open the report
            </Link>
            {run.documentId === null ? null : (
              <Link
                href={`/knowledge/${run.documentId}`}
                className={buttonQuiet}
              >
                See it in the paper
              </Link>
            )}
          </div>
        </motion.section>
      )}

      {run.errorMessage === null ? null : (
        <div
          role="alert"
          className="mb-12 flex gap-4 border border-verdict-retracted/40 px-6 py-5"
        >
          <ProblemIcon className="size-5 shrink-0 translate-y-0.5 text-verdict-retracted" />
          <div>
            <p className="font-display text-lg font-light">
              The check could not finish
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {run.errorMessage}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-x-12 gap-y-12 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <div className="space-y-10">
          <section>
            <p className={`${sectionLabel} mb-5`}>Progress</p>
            <PipelineProgress
              currentStage={run.progress.stage}
              isRunning={isRunning}
            />

            <dl className="mt-7 grid grid-cols-3 gap-5 border-t border-white/10 pt-5">
              <div>
                <dt className={microLabel}>Working</dt>
                <dd className="mt-1 font-display text-xl font-light">
                  {run.activeAgentCount}
                </dd>
              </div>
              <div>
                <dt className={microLabel}>Lookups</dt>
                <dd className="mt-1 font-display text-xl font-light">
                  {run.toolUses}
                </dd>
              </div>
              <div>
                <dt className={microLabel}>Tokens</dt>
                <dd className="mt-1 font-display text-xl font-light">
                  {formatCount(run.tokensIn + run.tokensOut)}
                </dd>
              </div>
            </dl>
          </section>

          {run.activity.length === 0 ? null : (
            <section className="border-t border-white/10 pt-8">
              <p className={`${sectionLabel} mb-5`}>What happened</p>
              <div className="max-h-[26rem] overflow-y-auto pr-1">
                <ActivityFeed lines={run.activity} />
              </div>
            </section>
          )}
        </div>

        <div className="h-[42rem] lg:sticky lg:top-24">
          <LiveReasoning agents={run.agents} />
        </div>
      </div>
    </div>
  );
}

function formatCount(value: number): string {
  if (value < 1000) {
    return String(value);
  }
  return `${(value / 1000).toFixed(1)}k`;
}
