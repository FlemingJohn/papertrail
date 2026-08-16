"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { formatDollars } from "@/lib/config/pricing";
import { displayMedium, microLabel, sectionLabel } from "@/lib/design/tokens";
import { ErrorBoundary } from "@/components/dashboard/error-boundary";
import { ProblemIcon, SpinnerIcon } from "@/components/dashboard/icons";

interface UsageTotals {
  runCount: number;
  paperCount: number;
  totalDollars: number;
  tokensIn: number;
  tokensOut: number;
  toolCallCount: number;
  cacheHitCount: number;
  failedCallCount: number;
}

export default function UsagePage() {
  const [status, setStatus] = useState<"loading" | "ready" | "failed">(
    "loading"
  );
  const [totals, setTotals] = useState<UsageTotals | null>(null);
  const [problem, setProblem] = useState<{
    message: string;
    detail: string | null;
  } | null>(null);

  useEffect(() => {
    async function load(): Promise<void> {
      try {
        const response = await fetch("/api/reports?view=usage");

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as {
            error?: string;
            detail?: string;
          } | null;
          setStatus("failed");
          setProblem({
            message: body?.error ?? "Usage totals could not be loaded.",
            detail: body?.detail ?? null,
          });
          return;
        }

        setTotals((await response.json()) as UsageTotals);
        setStatus("ready");
      } catch (error) {
        setStatus("failed");
        setProblem({
          message: "Usage totals could not be loaded.",
          detail:
            error instanceof Error ? error.message : "Unknown network error.",
        });
      }
    }

    void load();
  }, []);

  const cacheRate =
    totals === null || totals.toolCallCount === 0
      ? 0
      : Math.round((totals.cacheHitCount / totals.toolCallCount) * 100);

  const perPaper =
    totals === null || totals.runCount === 0
      ? 0
      : totals.totalDollars / totals.runCount;

  return (
    <ErrorBoundary>
      <div className="mx-auto max-w-5xl">
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-14"
        >
          <p className={`${sectionLabel} mb-4`}>Usage</p>
          <h1 className={displayMedium}>What this has cost so far.</h1>
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Every model call and every lookup is metered as it happens. Nothing
            here is estimated.
          </p>
        </motion.header>

        {status === "loading" ? (
          <div className="flex items-center gap-3 border-t border-white/10 py-10 text-sm text-muted-foreground">
            <SpinnerIcon className="size-4 animate-spin" />
            Loading totals
          </div>
        ) : null}

        {status === "failed" && problem !== null ? (
          <div
            role="alert"
            className="flex gap-4 border-t border-verdict-retracted/40 pt-8"
          >
            <ProblemIcon className="size-5 shrink-0 translate-y-1 text-verdict-retracted" />
            <div>
              <p className="font-display text-xl font-light">
                {problem.message}
              </p>
              {problem.detail === null ? null : (
                <p className="mt-3 max-w-2xl font-mono text-xs leading-relaxed text-muted-foreground">
                  {problem.detail}
                </p>
              )}
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Totals across runs need the database configured. A single run
                still reports its own cost on the check page.
              </p>
            </div>
          </div>
        ) : null}

        {totals === null ? null : (
          <>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <Figure label="Total spend" value={formatDollars(totals.totalDollars)} />
              <Figure label="Papers checked" value={String(totals.paperCount)} />
              <Figure label="Runs" value={String(totals.runCount)} />
              <Figure label="Per run" value={formatDollars(perPaper)} />
            </div>

            <div className="mt-12 grid gap-8 border-t border-white/10 pt-10 sm:grid-cols-2 lg:grid-cols-4">
              <Figure label="Tokens in" value={totals.tokensIn.toLocaleString()} />
              <Figure label="Tokens out" value={totals.tokensOut.toLocaleString()} />
              <Figure label="Lookups" value={String(totals.toolCallCount)} />
              <Figure label="Cache hits" value={`${cacheRate}%`} />
            </div>

            <div className="mt-12 border-t border-white/10 pt-10">
              <p className={`${sectionLabel} mb-6`}>What that means</p>
              <ul className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                <li>
                  <span className="text-foreground">{cacheRate}%</span> of
                  lookups came from cache. Re-checking a paper you have already
                  seen costs materially less than the first pass.
                </li>
                <li>
                  <span className="text-foreground">
                    {totals.failedCallCount}
                  </span>{" "}
                  lookups failed and were recovered by fallback rather than
                  stopping a run.
                </li>
                <li>
                  Output tokens are charged at four times the rate of input, so{" "}
                  <span className="text-foreground">
                    {totals.tokensOut.toLocaleString()}
                  </span>{" "}
                  written tokens carry more of this bill than the{" "}
                  {totals.tokensIn.toLocaleString()} read.
                </li>
              </ul>
            </div>
          </>
        )}
      </div>
    </ErrorBoundary>
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
