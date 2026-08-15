"use client";

import { motion } from "framer-motion";
import type { Report } from "@/lib/schemas/report";
import {
  useDashboard,
  type DashboardView,
} from "@/lib/client/dashboard-context";
import { formatDollars } from "@/lib/config/pricing";
import { isProblemVerdict } from "@/lib/schemas/verdict";
import { displayMedium, microLabel, sectionLabel } from "@/lib/design/tokens";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { ErrorBoundary } from "@/components/dashboard/error-boundary";
import { ChartIcon, CoinIcon, LinkIcon, ProblemIcon, ScaleIcon } from "@/components/dashboard/icons";
import { LiveReasoning } from "@/components/dashboard/live-reasoning";
import { PipelineProgress } from "@/components/dashboard/pipeline-progress";
import { StatTile } from "@/components/dashboard/stat-tile";
import { UploadPanel } from "@/components/dashboard/upload-panel";
import { WatchButton } from "@/components/dashboard/watch-button";
import {
  CitationsSection,
  ConflictsSection,
  CostSection,
  MethodsSection,
  NumbersSection,
  ReviewSection,
  SummarySection,
} from "@/components/dashboard/report-sections";

const viewTitles: Record<DashboardView, string> = {
  check: "Check a paper",
  summary: "Summary",
  citations: "Citations",
  numbers: "Numbers",
  methods: "Methods",
  conflicts: "Conflicts",
  review: "Review",
  cost: "Cost",
};

const viewHeadlines: Record<DashboardView, string> = {
  check: "Twenty-four specialists, one paper.",
  summary: "What held up, and what did not.",
  citations: "Does the source say what the paper claims?",
  numbers: "Two readers, working blind.",
  methods: "What is missing to repeat this.",
  conflicts: "Where the evidence disagrees with itself.",
  review: "What a careful referee would say.",
  cost: "What this check cost to run.",
};

export default function CheckPage() {
  const { run, startRun, cancelRun, activeView } = useDashboard();
  const isRunning = run.status === "running";

  return (
    <ErrorBoundary>
      <div className="mx-auto max-w-6xl">
        <motion.header
          key={activeView}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <p className={`${sectionLabel} mb-4`}>{viewTitles[activeView]}</p>
          <h1 className={displayMedium}>{viewHeadlines[activeView]}</h1>
        </motion.header>

        {activeView === "check" ? (
          <CheckView
            run={run}
            isRunning={isRunning}
            onStart={startRun}
            onCancel={cancelRun}
          />
        ) : run.report === null ? (
          <p className="border-t border-white/10 py-12 text-sm text-muted-foreground">
            No report yet. Check a paper first.
          </p>
        ) : (
          <ReportPane report={run.report} view={activeView} />
        )}
      </div>
    </ErrorBoundary>
  );
}

interface CheckViewProps {
  run: ReturnType<typeof useDashboard>["run"];
  isRunning: boolean;
  onStart: (file: File, depth: Parameters<ReturnType<typeof useDashboard>["startRun"]>[1]) => void;
  onCancel: () => void;
}

function CheckView({ run, isRunning, onStart, onCancel }: CheckViewProps) {
  return (
    <div className="grid gap-x-12 gap-y-14 lg:grid-cols-[minmax(0,25rem)_minmax(0,1fr)]">
      <div className="space-y-14">
        <UploadPanel
          isRunning={isRunning}
          onStart={onStart}
          onCancel={onCancel}
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

      <div className="min-h-[34rem] space-y-14">
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

        <div className="h-[34rem]">
          <LiveReasoning agents={run.agents} />
        </div>

        {run.documentId === null ? null : (
          <WatchButton documentId={run.documentId} />
        )}
      </div>
    </div>
  );
}

function ReportPane({
  report,
  view,
}: {
  report: Report;
  view: DashboardView;
}) {
  const problemCount = report.citationChecks.filter((check) =>
    isProblemVerdict(check.judgement.verdict)
  ).length;

  const soundPercentage =
    report.citationChecks.length === 0
      ? 100
      : Math.round(
          ((report.citationChecks.length - problemCount) /
            report.citationChecks.length) *
            100
        );

  const averageAgreement =
    report.measurements.length === 0
      ? 1
      : report.measurements.reduce(
          (total, measurement) => total + measurement.agreementScore,
          0
        ) / report.measurements.length;

  return (
    <motion.div
      key={view}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-14"
    >
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Citations sound"
          value={`${soundPercentage}%`}
          detail={`${problemCount} of ${report.citationChecks.length} had problems`}
          tone={problemCount === 0 ? "good" : "warning"}
          icon={<LinkIcon className="size-4" />}
        />
        <StatTile
          label="Reader agreement"
          value={averageAgreement.toFixed(2)}
          detail={`across ${report.measurements.length} numbers`}
          tone={averageAgreement >= 0.8 ? "good" : "warning"}
          icon={<ChartIcon className="size-4" />}
        />
        <StatTile
          label="Disagreements"
          value={String(report.conflicts.length)}
          detail={`${report.coverage.comparisonPapersUsed} papers compared`}
          tone={report.conflicts.length === 0 ? "good" : "warning"}
          icon={<ScaleIcon className="size-4" />}
        />
        <StatTile
          label="Cost"
          value={formatDollars(report.spend.totalDollars)}
          detail={`${report.spend.toolCallCount} lookups, ${report.spend.cacheHitCount} cached`}
          icon={<CoinIcon className="size-4" />}
        />
      </div>

      <div className="border-t border-white/10 pt-10">
        {view === "summary" ? <SummarySection report={report} /> : null}
        {view === "citations" ? <CitationsSection report={report} /> : null}
        {view === "numbers" ? <NumbersSection report={report} /> : null}
        {view === "methods" ? <MethodsSection report={report} /> : null}
        {view === "conflicts" ? <ConflictsSection report={report} /> : null}
        {view === "review" ? <ReviewSection report={report} /> : null}
        {view === "cost" ? <CostSection report={report} /> : null}
      </div>
    </motion.div>
  );
}

function formatCount(value: number): string {
  if (value < 1000) {
    return String(value);
  }
  return `${(value / 1000).toFixed(1)}k`;
}
