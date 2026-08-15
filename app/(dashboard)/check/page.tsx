"use client";

import { useRunStream } from "@/lib/client/use-run-stream";
import { formatDollars } from "@/lib/config/pricing";
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
      <div className="space-y-8">
        <header>
          <h1 className="font-display text-3xl text-foreground">
            Check a paper
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Twenty-four specialists read the paper, check every citation
            against its source, read the numbers twice over, and tell you what
            they could not verify.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <div className="space-y-6">
            <UploadPanel
              isRunning={isRunning}
              onStart={(file, depth) => {
                void start(file, depth);
              }}
              onCancel={cancel}
            />

            {state.status === "idle" ? null : (
              <section className="border border-border/60 bg-card/40 p-5">
                <div className="mb-4 flex items-baseline justify-between">
                  <h2 className="text-sm text-foreground">Progress</h2>
                  <span className="font-mono text-xs text-muted-foreground">
                    {formatDollars(state.spendDollars)}
                  </span>
                </div>

                <PipelineProgress
                  currentStage={state.progress.stage}
                  isRunning={isRunning}
                />

                <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-border/40 pt-4">
                  <div>
                    <dt className="text-xs text-muted-foreground">Working</dt>
                    <dd className="font-mono text-sm text-foreground">
                      {state.activeAgentCount}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Lookups</dt>
                    <dd className="font-mono text-sm text-foreground">
                      {state.toolUses}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Tokens</dt>
                    <dd className="font-mono text-sm text-foreground">
                      {formatCount(state.tokensIn + state.tokensOut)}
                    </dd>
                  </div>
                </dl>
              </section>
            )}

            {state.activity.length === 0 ? null : (
              <section className="border border-border/60 bg-card/40">
                <h2 className="border-b border-border/60 px-4 py-3 text-sm">
                  What happened
                </h2>
                <div className="max-h-80 overflow-y-auto">
                  <ActivityFeed lines={state.activity} />
                </div>
              </section>
            )}
          </div>

          <div className="min-h-[32rem] space-y-6">
            {state.errorMessage === null ? null : (
              <div
                role="alert"
                className="flex gap-3 border border-verdict-retracted/40 bg-card/40 p-4"
              >
                <ProblemIcon className="size-5 shrink-0 text-verdict-retracted" />
                <div>
                  <p className="text-sm text-foreground">
                    The check could not finish
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {state.errorMessage}
                  </p>
                </div>
              </div>
            )}

            {state.report === null ? (
              <div className="h-[32rem]">
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
