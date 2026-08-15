"use client";

import { useState } from "react";
import Link from "next/link";
import type { WatchSummary } from "@/lib/tools/database/list-watches";
import { useWatchlist } from "@/lib/client/use-watchlist";
import { describeSchedule } from "@/lib/watch/schedule";
import { ChangeCard, ImportanceBadge } from "@/components/dashboard/change-card";
import { ErrorBoundary } from "@/components/dashboard/error-boundary";
import {
  DocumentIcon,
  ProblemIcon,
  SpinnerIcon,
} from "@/components/dashboard/icons";

export default function WatchlistPage() {
  const {
    state,
    histories,
    busyWatchId,
    loadHistory,
    checkNow,
    stopWatching,
  } = useWatchlist();

  const [openWatchId, setOpenWatchId] = useState<string | null>(null);

  return (
    <ErrorBoundary>
      <div className="space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl text-foreground">
              Papers being watched
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Each check re-reads the paper and compares the result against the
              stored report. Only what actually moved is reported.
            </p>
          </div>
          <Link
            href="/check"
            className="border border-border px-4 py-2 text-sm text-foreground transition-colors hover:border-accent hover:text-accent"
          >
            Check a new paper
          </Link>
        </header>

        {state.status === "loading" ? (
          <div className="flex items-center gap-2 border border-border/60 bg-card/40 px-4 py-8 text-sm text-muted-foreground">
            <SpinnerIcon className="size-4 animate-spin" />
            Loading the watch list
          </div>
        ) : null}

        {state.status === "failed" ? (
          <div
            role="alert"
            className="flex gap-3 border border-verdict-retracted/40 bg-card/40 p-4"
          >
            <ProblemIcon className="size-5 shrink-0 text-verdict-retracted" />
            <div>
              <p className="text-sm text-foreground">{state.errorMessage}</p>
              {state.errorDetail === null ? null : (
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {state.errorDetail}
                </p>
              )}
              <p className="mt-2 text-sm text-muted-foreground">
                Watching needs the database configured. See docs/setup.md for
                the values it expects.
              </p>
            </div>
          </div>
        ) : null}

        {state.status === "ready" && state.watches.length === 0 ? (
          <div className="border border-border/60 bg-card/40 px-6 py-12 text-center">
            <DocumentIcon className="mx-auto mb-3 size-8 text-muted-foreground" />
            <p className="mb-1 text-sm text-foreground">
              Nothing is being watched yet
            </p>
            <p className="mx-auto max-w-md text-sm text-muted-foreground">
              After you check a paper, you can ask to be told when its evidence
              changes. Retractions and new contradicting studies are the two
              that usually matter.
            </p>
          </div>
        ) : null}

        <ul className="space-y-3">
          {state.watches.map((watch) => (
            <WatchRow
              key={watch.watchId}
              watch={watch}
              isOpen={openWatchId === watch.watchId}
              isBusy={busyWatchId === watch.watchId}
              history={histories[watch.watchId] ?? null}
              onToggle={() => {
                const next = openWatchId === watch.watchId ? null : watch.watchId;
                setOpenWatchId(next);
                if (next !== null && histories[watch.watchId] === undefined) {
                  void loadHistory(watch.watchId);
                }
              }}
              onCheckNow={() => void checkNow(watch)}
              onStop={() => void stopWatching(watch.watchId)}
            />
          ))}
        </ul>
      </div>
    </ErrorBoundary>
  );
}

interface WatchRowProps {
  watch: WatchSummary;
  isOpen: boolean;
  isBusy: boolean;
  history: ReturnType<typeof useWatchlist>["histories"][string] | null;
  onToggle: () => void;
  onCheckNow: () => void;
  onStop: () => void;
}

function WatchRow({
  watch,
  isOpen,
  isBusy,
  history,
  onToggle,
  onCheckNow,
  onStop,
}: WatchRowProps) {
  const needsAttention =
    watch.latestImportance === "high" || watch.latestImportance === "medium";

  return (
    <li
      className={`border bg-card/40 ${
        needsAttention ? "border-verdict-retracted/40" : "border-border/60"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4 p-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <h2 className="text-sm text-foreground">{watch.title}</h2>
            {watch.latestImportance === null ? (
              <span className="border border-border px-2 py-0.5 text-xs text-muted-foreground">
                Not yet compared
              </span>
            ) : (
              <ImportanceBadge importance={watch.latestImportance} />
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            {describeSchedule(watch.frequency, new Date(watch.nextCheckAt))} ·{" "}
            {watch.checkCount} {watch.checkCount === 1 ? "check" : "checks"} so
            far
          </p>

          {watch.latestExplanation === null ? null : (
            <p className="mt-2 text-sm text-muted-foreground">
              {watch.latestExplanation}
            </p>
          )}
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={onCheckNow}
            disabled={isBusy}
            className="border border-border px-3 py-1.5 text-xs text-foreground transition-colors hover:border-accent hover:text-accent disabled:opacity-40"
          >
            {isBusy ? "Checking…" : "Check now"}
          </button>
          <button
            type="button"
            onClick={onToggle}
            className="border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            {isOpen ? "Hide history" : "History"}
          </button>
          <button
            type="button"
            onClick={onStop}
            disabled={isBusy}
            className="border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-verdict-retracted hover:text-verdict-retracted disabled:opacity-40"
          >
            Stop
          </button>
        </div>
      </div>

      {isOpen ? (
        <div className="border-t border-border/40 p-4">
          {history === null ? (
            <p className="text-sm text-muted-foreground">Loading history…</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No comparison has run yet. A paper needs two stored reports before
              anything can be compared.
            </p>
          ) : (
            <ol className="space-y-4">
              {history.map((check) => (
                <li key={check.watchCheckId}>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">
                      {new Date(check.createdAt).toLocaleDateString()}
                    </span>
                    <ImportanceBadge importance={check.importance} />
                  </div>
                  <p className="mb-3 text-sm text-muted-foreground">
                    {check.explanation}
                  </p>
                  {check.changes.length === 0 ? null : (
                    <div className="space-y-2">
                      {check.changes.map((change, index) => (
                        <ChangeCard
                          key={`${check.watchCheckId}-${index}`}
                          change={change}
                        />
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      ) : null}
    </li>
  );
}
