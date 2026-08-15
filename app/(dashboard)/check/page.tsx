"use client";

import { motion } from "framer-motion";
import { useRunStream } from "@/lib/client/use-run-stream";
import { formatDollars } from "@/lib/config/pricing";
import { displayMedium, microLabel, sectionLabel } from "@/lib/design/tokens";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { ErrorBoundary } from "@/components/dashboard/error-boundary";
import { ProblemIcon } from "@/components/dashboard/icons";
import { LiveReasoning } from "@/components/dashboard/live-reasoning";
import { PipelineProgress } from "@/components/dashboard/pipeline-progress";
import { ReportView } from "@/components/dashboard/report-view";
import { UploadPanel } from "@/components/dashboard/upload-panel";
import { WatchButton } from "@/components/dashboard/watch-button";

export default function CheckPage() {
  const { state, start, cancel } = useRunStream();
  const isRunning = state.status === "running";

  return (
    <ErrorBoundary>
      <div className="mx-auto max-w-6xl">
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-16"
        >
          <p className={`${sectionLabel} mb-4`}>Check a paper</p>
          <h1 className={displayMedium}>
            Twenty-four specialists, one paper.
          </h1>
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Every citation is read back to its source, every number is
            extracted twice over, and anything that could not be verified is
            said out loud rather than quietly assumed.
          </p>
        </motion.header>

        <div className="grid gap-x-12 gap-y-16 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
          <div className="space-y-16">
            <UploadPanel
              isRunning={isRunning}
              onStart={(file, depth) => {
                void start(file, depth);
              }}
              onCancel={cancel}
            />

            {state.status === "idle" ? null : (
              <section className="border-t border-white/10 pt-8">
                <div className="mb-6 flex items-baseline justify-between">
                  <p className={sectionLabel}>03 — Progress</p>
                  <span className="font-display text-xl font-light">
                    {formatDollars(state.spendDollars)}
                  </span>
                </div>

                <PipelineProgress
                  currentStage={state.progress.stage}
                  isRunning={isRunning}
                />

                <dl className="mt-8 grid grid-cols-3 gap-6">
                  <div>
                    <dt className={microLabel}>Working</dt>
                    <dd className="mt-1 font-display text-2xl font-light">
                      {state.activeAgentCount}
                    </dd>
                  </div>
                  <div>
                    <dt className={microLabel}>Lookups</dt>
                    <dd className="mt-1 font-display text-2xl font-light">
                      {state.toolUses}
                    </dd>
                  </div>
                  <div>
                    <dt className={microLabel}>Tokens</dt>
                    <dd className="mt-1 font-display text-2xl font-light">
                      {formatCount(state.tokensIn + state.tokensOut)}
                    </dd>
                  </div>
                </dl>
              </section>
            )}

            {state.activity.length === 0 ? null : (
              <section className="border-t border-white/10 pt-8">
                <p className={`${sectionLabel} mb-6`}>04 — What happened</p>
                <div className="max-h-96 overflow-y-auto pr-1">
                  <ActivityFeed lines={state.activity} />
                </div>
              </section>
            )}
          </div>

          <div className="min-h-[34rem] space-y-16">
            {state.errorMessage === null ? null : (
              <div
                role="alert"
                className="flex gap-4 border-t border-verdict-retracted/40 pt-8"
              >
                <ProblemIcon className="size-5 shrink-0 text-verdict-retracted" />
                <div>
                  <p className="font-display text-xl font-light">
                    The check could not finish
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {state.errorMessage}
                  </p>
                </div>
              </div>
            )}

            {state.report === null ? (
              <div className="h-[34rem]">
                <LiveReasoning agents={state.agents} />
              </div>
            ) : (
              <>
                {state.documentId === null ? null : (
                  <WatchButton documentId={state.documentId} />
                )}
                <ReportView report={state.report} />
              </>
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
