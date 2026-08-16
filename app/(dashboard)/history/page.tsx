"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Report } from "@/lib/schemas/report";
import type { ReportSummary } from "@/lib/tools/database/list-reports";
import { formatDollars } from "@/lib/config/pricing";
import {
  buttonQuiet,
  buttonSecondary,
  displayMedium,
  microLabel,
  sectionLabel,
} from "@/lib/design/tokens";
import { ErrorBoundary } from "@/components/dashboard/error-boundary";
import { ProblemIcon, SpinnerIcon } from "@/components/dashboard/icons";
import { SummarySection } from "@/components/dashboard/report-sections";

export default function HistoryPage() {
  const [status, setStatus] = useState<"loading" | "ready" | "failed">(
    "loading"
  );
  const [summaries, setSummaries] = useState<ReportSummary[]>([]);
  const [problem, setProblem] = useState<{
    message: string;
    detail: string | null;
  } | null>(null);
  const [openReport, setOpenReport] = useState<Report | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/reports");

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
          detail?: string;
        } | null;
        setStatus("failed");
        setProblem({
          message: body?.error ?? "Past reports could not be loaded.",
          detail: body?.detail ?? null,
        });
        return;
      }

      const body = (await response.json()) as { reports: ReportSummary[] };
      setSummaries(body.reports);
      setStatus("ready");
    } catch (error) {
      setStatus("failed");
      setProblem({
        message: "Past reports could not be loaded.",
        detail:
          error instanceof Error ? error.message : "Unknown network error.",
      });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function openOne(reportId: string): Promise<void> {
    setOpeningId(reportId);

    try {
      const response = await fetch(`/api/reports/${reportId}`);

      if (!response.ok) {
        return;
      }

      const body = (await response.json()) as { report: Report };
      setOpenReport(body.report);
    } finally {
      setOpeningId(null);
    }
  }

  return (
    <ErrorBoundary>
      <div className="mx-auto max-w-5xl">
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-14 flex flex-wrap items-end justify-between gap-6"
        >
          <div>
            <p className={`${sectionLabel} mb-4`}>History</p>
            <h1 className={displayMedium}>Every paper you have checked.</h1>
            <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Reports are stored whole and never edited, so reopening one shows
              exactly what was concluded at the time rather than what the
              evidence looks like now.
            </p>
          </div>
          <Link href="/check" className={buttonSecondary}>
            Check a paper
          </Link>
        </motion.header>

        {status === "loading" ? (
          <div className="flex items-center gap-3 border-t border-white/10 py-10 text-sm text-muted-foreground">
            <SpinnerIcon className="size-4 animate-spin" />
            Loading past reports
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
                History needs the database configured. Checking a paper still
                works without it, but the result is not kept.
              </p>
            </div>
          </div>
        ) : null}

        {status === "ready" && summaries.length === 0 ? (
          <div className="border-t border-white/10 py-16">
            <p className="mb-4 font-display text-2xl font-light italic">
              Nothing checked yet.
            </p>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
              Every report you produce is stored here so you can reopen it
              without paying to run the check again.
            </p>
          </div>
        ) : null}

        {summaries.length === 0 ? null : (
          <ul className="border-t border-white/10">
            {summaries.map((summary) => (
              <li
                key={summary.reportId}
                className="flex flex-wrap items-start justify-between gap-6 border-b border-white/10 py-6"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-3">
                    <span className={microLabel}>
                      {new Date(summary.createdAt).toLocaleDateString()}
                    </span>
                    <span className={microLabel}>{summary.depth}</span>
                    <span className={microLabel}>
                      {formatDollars(summary.costDollars)}
                    </span>
                  </div>

                  <h2 className="mb-2 max-w-2xl font-display text-xl font-light leading-snug">
                    {summary.title}
                  </h2>

                  <p className="text-sm text-muted-foreground">
                    {summary.claimsFound} claims ·{" "}
                    {summary.citationsChecked} citations ·{" "}
                    <span
                      className={
                        summary.citationProblems > 0
                          ? "text-verdict-wrong-source"
                          : "text-verdict-supported"
                      }
                    >
                      {summary.citationProblems} with problems
                    </span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void openOne(summary.reportId)}
                  disabled={openingId === summary.reportId}
                  className={`${buttonQuiet} disabled:opacity-40`}
                >
                  {openingId === summary.reportId ? "Opening" : "Open"}
                </button>
              </li>
            ))}
          </ul>
        )}

        {openReport === null ? null : (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-16 border-t border-white/10 pt-10"
          >
            <div className="mb-8 flex flex-wrap items-baseline justify-between gap-4">
              <div>
                <p className={`${sectionLabel} mb-3`}>Reopened</p>
                <h2 className="font-display text-2xl font-light">
                  {openReport.paperTitle}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpenReport(null)}
                className={buttonQuiet}
              >
                Close
              </button>
            </div>

            <SummarySection report={openReport} />
          </motion.section>
        )}
      </div>
    </ErrorBoundary>
  );
}
