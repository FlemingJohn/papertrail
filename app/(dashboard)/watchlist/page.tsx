"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { WatchSummary } from "@/lib/tools/database/list-watches";
import { useWatchlist, type WatchCheckRecord } from "@/lib/client/use-watchlist";
import { describeSchedule } from "@/lib/watch/schedule";
import {
  buttonQuiet,
  buttonSecondary,
  displayMedium,
  microLabel,
  sectionLabel,
} from "@/lib/design/tokens";
import { ChangeCard, ImportanceBadge } from "@/components/dashboard/change-card";
import { ErrorBoundary } from "@/components/dashboard/error-boundary";
import { ProblemIcon, SpinnerIcon } from "@/components/dashboard/icons";

export default function WatchlistPage() {
  const { state, histories, busyWatchId, loadHistory, checkNow, stopWatching } =
    useWatchlist();

  const [openWatchId, setOpenWatchId] = useState<string | null>(null);

  return (
    <ErrorBoundary>
      <div className="mx-auto max-w-5xl">
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-16 flex flex-wrap items-end justify-between gap-6"
        >
          <div>
            <p className={`${sectionLabel} mb-4`}>Watchlist</p>
            <h1 className={displayMedium}>Papers being watched.</h1>
            <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Each check re-reads the paper and compares the result against the
              stored report. Only what actually moved is reported.
            </p>
          </div>
          <Link href="/check" className={buttonSecondary}>
            Check a paper
          </Link>
        </motion.header>

        {state.status === "loading" ? (
          <div className="flex items-center gap-3 border-t border-white/10 py-10 text-sm text-muted-foreground">
            <SpinnerIcon className="size-4 animate-spin" />
            Loading the watch list
          </div>
        ) : null}

        {state.status === "failed" ? (
          <div
            role="alert"
            className="flex gap-4 border-t border-verdict-retracted/40 pt-8"
          >
            <ProblemIcon className="size-5 shrink-0 translate-y-1 text-verdict-retracted" />
            <div>
              <p className="font-display text-xl font-light">
                {state.errorMessage}
              </p>
              {state.errorDetail === null ? null : (
                <p className="mt-3 max-w-2xl font-mono text-xs leading-relaxed text-muted-foreground">
                  {state.errorDetail}
                </p>
              )}
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Watching needs the database configured. See docs/setup.md for
                the values it expects.
              </p>
            </div>
          </div>
        ) : null}

        {state.status === "ready" && state.watches.length === 0 ? (
          <div className="border-t border-white/10 py-16">
            <p className="mb-4 font-display text-2xl font-light italic">
              Nothing is being watched yet.
            </p>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
              After you check a paper, you can ask to be told when its evidence
              changes. Retractions and new contradicting studies are the two
              that usually matter.
            </p>
          </div>
        ) : null}

        <ul className={state.watches.length > 0 ? "border-t border-white/10" : ""}>
          {state.watches.map((watch) => (
            <WatchRow
              key={watch.watchId}
              watch={watch}
              isOpen={openWatchId === watch.watchId}
              isBusy={busyWatchId === watch.watchId}
              history={histories[watch.watchId] ?? null}
              onToggle={() => {
                const next =
                  openWatchId === watch.watchId ? null : watch.watchId;
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
  history: WatchCheckRecord[] | null;
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
  return (
    <li className="border-b border-white/10 py-8">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            {watch.latestImportance === null ? (
              <span className={microLabel}>Not yet compared</span>
            ) : (
              <ImportanceBadge importance={watch.latestImportance} />
            )}
            <span className={microLabel}>
              {describeSchedule(watch.frequency, new Date(watch.nextCheckAt))} ·{" "}
              {watch.checkCount} {watch.checkCount === 1 ? "check" : "checks"}
            </span>
          </div>

          <h2 className="mb-3 max-w-2xl font-display text-2xl font-light leading-snug">
            {watch.title}
          </h2>

          {watch.latestExplanation === null ? null : (
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {watch.latestExplanation}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={onCheckNow}
            disabled={isBusy}
            className={`${buttonQuiet} disabled:opacity-40`}
          >
            {isBusy ? "Checking" : "Check now"}
          </button>
          <button type="button" onClick={onToggle} className={buttonQuiet}>
            {isOpen ? "Hide" : "History"}
          </button>
          <button
            type="button"
            onClick={onStop}
            disabled={isBusy}
            className={`${buttonQuiet} disabled:opacity-40`}
          >
            Stop
          </button>
        </div>
      </div>

      {isOpen ? (
        <div className="mt-8 border-t border-white/10 pt-6">
          {history === null ? (
            <p className="text-sm text-muted-foreground">Loading history</p>
          ) : history.length === 0 ? (
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              No comparison has run yet. A paper needs two stored reports before
              anything can be compared.
            </p>
          ) : (
            <ol className="space-y-10">
              {history.map((check) => (
                <li key={check.watchCheckId}>
                  <div className="mb-4 flex flex-wrap items-center gap-3">
                    <span className={microLabel}>
                      {new Date(check.createdAt).toLocaleDateString()}
                    </span>
                    <ImportanceBadge importance={check.importance} />
                  </div>
                  <p className="mb-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    {check.explanation}
                  </p>
                  {check.changes.length === 0 ? null : (
                    <div className="space-y-8">
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
