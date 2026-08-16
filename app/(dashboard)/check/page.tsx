"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useDashboard } from "@/lib/client/dashboard-context";
import { formatDollars } from "@/lib/config/pricing";
import {
  buttonPrimary,
  displayMedium,
  microLabel,
  sectionLabel,
} from "@/lib/design/tokens";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { ErrorBoundary } from "@/components/dashboard/error-boundary";
import { CheckIcon, ProblemIcon } from "@/components/dashboard/icons";
import { LiveReasoning } from "@/components/dashboard/live-reasoning";
import { PipelineProgress } from "@/components/dashboard/pipeline-progress";
import { UploadPanel } from "@/components/dashboard/upload-panel";
import { WatchButton } from "@/components/dashboard/watch-button";

export default function CheckPage() {
  const { run, startRun, cancelRun } = useDashboard();
  const isRunning = run.status === "running";

  return (
    <ErrorBoundary>
      <div className="mx-auto max-w-6xl">
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <p className={`${sectionLabel} mb-4`}>Check a paper</p>
          <h1 className={displayMedium}>Twenty-four specialists, one paper.</h1>
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Every citation is read back to its source, every number is
            extracted twice over, and anything that could not be verified is
            said out loud rather than quietly assumed.
          </p>
        </motion.header>

        <div className="grid gap-x-12 gap-y-14 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
          <div className="space-y-14">
            <UploadPanel
              isRunning={isRunning}
              onStart={startRun}
              onCancel={cancelRun}
            />

            {run.status === "idle" ? null : (
              <section className="border-t border-white/10 pt-8">
                <div className="mb-6 flex items-baseline justify-between">
                  <p className={sectionLabel}>03 — Progress</p>
                  <span className="font-display text-xl font-light">
                    {formatDollars(run.spendDollars)}
                  </span>
                </div>

                <PipelineProgress
                  currentStage={run.progress.stage}
                  isRunning={isRunning}
                />

                <dl className="mt-8 grid grid-cols-3 gap-6">
                  <div>
                    <dt className={microLabel}>Working</dt>
                    <dd className="mt-1 font-display text-2xl font-light">
                      {run.activeAgentCount}
                    </dd>
                  </div>
                  <div>
                    <dt className={microLabel}>Lookups</dt>
                    <dd className="mt-1 font-display text-2xl font-light">
                      {run.toolUses}
                    </dd>
                  </div>
                  <div>
                    <dt className={microLabel}>Tokens</dt>
                    <dd className="mt-1 font-display text-2xl font-light">
                      {formatCount(run.tokensIn + run.tokensOut)}
                    </dd>
                  </div>
                </dl>
              </section>
            )}

            {run.activity.length === 0 ? null : (
              <section className="border-t border-white/10 pt-8">
                <p className={`${sectionLabel} mb-6`}>04 — What happened</p>
                <div className="max-h-96 overflow-y-auto pr-1">
                  <ActivityFeed lines={run.activity} />
                </div>
              </section>
            )}
          </div>

          <div className="min-h-[30rem] space-y-14">
            {run.reportId === null ? null : (
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="border-t border-verdict-supported/40 pt-8"
              >
                <div className="mb-4 flex items-center gap-3">
                  <CheckIcon className="size-5 text-verdict-supported" />
                  <p className={sectionLabel}>The report is ready</p>
                </div>

                <p className="mb-6 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  It is stored, so it keeps its own address. You can come back
                  to it, or send the link to someone else, without running the
                  check again.
                </p>

                <Link href={`/reports/${run.reportId}`} className={buttonPrimary}>
                  Open the report
                </Link>
              </motion.section>
            )}

            {run.errorMessage === null ? null : (
              <div
                role="alert"
                className="flex gap-4 border-t border-verdict-retracted/40 pt-8"
              >
                <ProblemIcon className="size-5 shrink-0 text-verdict-retracted" />
                <div>
                  <p className="font-display text-xl font-light">
                    The check could not finish
                  </p>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                    {run.errorMessage}
                  </p>
                </div>
              </div>
            )}

            <div className="h-[30rem]">
              <LiveReasoning agents={run.agents} />
            </div>

            {run.documentId === null ? null : (
              <WatchButton documentId={run.documentId} />
            )}
          </div>
        </div>

      </div>
    </ErrorBoundary>
  );
}

function formatCount(value: number): string {
  if (value < 1000) {
    return String(value);
  }
  return `${(value / 1000).toFixed(1)}k`;
}
