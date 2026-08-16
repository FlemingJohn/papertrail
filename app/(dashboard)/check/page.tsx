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
import {
  ChartIcon,
  CoinIcon,
  LinkIcon,
  ProblemIcon,
  ScaleIcon,
} from "@/components/dashboard/icons";
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

type ReportTab = Exclude<DashboardView, "check">;

const reportTabs: Array<{ key: ReportTab; label: string }> = [
  { key: "summary", label: "Summary" },
  { key: "citations", label: "Citations" },
  { key: "numbers", label: "Numbers" },
  { key: "methods", label: "Methods" },
  { key: "conflicts", label: "Conflicts" },
  { key: "review", label: "Review" },
  { key: "cost", label: "Cost" },
];

export default function CheckPage() {
  const { run, startRun, cancelRun, activeView, setActiveView } =
    useDashboard();
  const isRunning = run.status === "running";
  const report = run.report;

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

        {report === null ? null : (
          <ReportPane
            report={report}
            activeTab={activeView === "check" ? "summary" : activeView}
            onSelectTab={setActiveView}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}

interface ReportPaneProps {
  report: Report;
  activeTab: ReportTab;
  onSelectTab: (tab: ReportTab) => void;
}

function ReportPane({ report, activeTab, onSelectTab }: ReportPaneProps) {
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

  const counts: Partial<Record<ReportTab, number>> = {
    citations: report.citationChecks.length,
    numbers: report.measurements.length,
    methods: report.missingDetails.length,
    conflicts: report.conflicts.length,
    review: report.review?.points.length ?? 0,
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mt-20 border-t border-white/10 pt-12"
    >
      <p className={`${sectionLabel} mb-8`}>05 — The report</p>

      <div className="mb-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
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

      <nav className="mb-10 flex flex-wrap gap-2">
        {reportTabs.map((tab) => {
          const count = counts[tab.key];
          const isFlagged = tab.key === "citations" && problemCount > 0;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onSelectTab(tab.key)}
              aria-current={activeTab === tab.key ? "page" : undefined}
              className={`rounded-full border px-5 py-2 font-mono text-[10px] uppercase tracking-widest transition-colors duration-300 ${
                activeTab === tab.key
                  ? "border-white/60 text-foreground"
                  : "border-white/20 text-muted-foreground hover:border-white/40"
              }`}
            >
              {tab.label}
              {count === undefined || count === 0 ? null : (
                <span
                  className={`ml-2 ${
                    isFlagged ? "text-verdict-wrong-source" : "opacity-50"
                  }`}
                >
                  {isFlagged ? `${problemCount}!` : count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        {activeTab === "summary" ? <SummarySection report={report} /> : null}
        {activeTab === "citations" ? (
          <CitationsSection report={report} />
        ) : null}
        {activeTab === "numbers" ? <NumbersSection report={report} /> : null}
        {activeTab === "methods" ? <MethodsSection report={report} /> : null}
        {activeTab === "conflicts" ? (
          <ConflictsSection report={report} />
        ) : null}
        {activeTab === "review" ? <ReviewSection report={report} /> : null}
        {activeTab === "cost" ? <CostSection report={report} /> : null}
      </motion.div>
    </motion.section>
  );
}

function formatCount(value: number): string {
  if (value < 1000) {
    return String(value);
  }
  return `${(value / 1000).toFixed(1)}k`;
}
