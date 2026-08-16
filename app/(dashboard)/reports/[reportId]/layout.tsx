import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadReport } from "@/lib/client/load-report";
import { formatDollars } from "@/lib/config/pricing";
import { isProblemVerdict } from "@/lib/schemas/verdict";
import { microLabel, sectionLabel } from "@/lib/design/tokens";
import { ReportTabs } from "@/components/dashboard/report-tabs";
import { StatTile } from "@/components/dashboard/stat-tile";
import {
  ChartIcon,
  CoinIcon,
  LinkIcon,
  ScaleIcon,
} from "@/components/dashboard/icons";

interface LayoutProps {
  children: ReactNode;
  params: Promise<{ reportId: string }>;
}

export default async function ReportLayout({ children, params }: LayoutProps) {
  const { reportId } = await params;
  const report = await loadReport(reportId);

  if (report === null) {
    notFound();
  }

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
    <div className="mx-auto max-w-5xl">
      <header className="mb-12">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Link
            href="/reports"
            className={`${microLabel} transition-colors hover:text-foreground`}
          >
            Reports
          </Link>
          <span className={microLabel}>·</span>
          <span className={microLabel}>{report.pageCount} pages</span>
          <span className={microLabel}>·</span>
          <span className={microLabel}>
            {formatDollars(report.spend.totalDollars)}
          </span>
        </div>

        <h1 className="font-display text-3xl font-light leading-snug md:text-4xl">
          {report.paperTitle}
        </h1>

        <p className={`${sectionLabel} mt-4`}>
          fingerprint {report.fingerprint.slice(0, 16)}
        </p>
      </header>

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

      <ReportTabs
        reportId={reportId}
        counts={{
          citations: report.citationChecks.length,
          numbers: report.measurements.length,
          methods: report.missingDetails.length,
          conflicts: report.conflicts.length,
          review: report.review?.points.length ?? 0,
        }}
        problemCount={problemCount}
      />

      <div className="mt-10">{children}</div>
    </div>
  );
}
