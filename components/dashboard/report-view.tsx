"use client";

import { useState } from "react";
import type { Report } from "@/lib/schemas/report";
import { formatDollars } from "@/lib/config/pricing";
import {
  agreementStatusLabels,
  missingDetailCategoryLabels,
  reviewAngleLabels,
  reviewOutcomeLabels,
} from "@/lib/config/labels";
import { isProblemVerdict } from "@/lib/schemas/verdict";
import { ChartIcon, CoinIcon, LinkIcon, ScaleIcon } from "./icons";
import { StatTile } from "./stat-tile";
import { ConfidenceBadge, SeverityBadge, VerdictBadge } from "./verdict-badge";

type TabKey =
  | "summary"
  | "citations"
  | "numbers"
  | "methods"
  | "conflicts"
  | "review";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "summary", label: "Summary" },
  { key: "citations", label: "Citations" },
  { key: "numbers", label: "Numbers" },
  { key: "methods", label: "Methods" },
  { key: "conflicts", label: "Conflicts" },
  { key: "review", label: "Review" },
];

export function ReportView({ report }: { report: Report }) {
  const [activeTab, setActiveTab] = useState<TabKey>("summary");

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
    <section className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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

      <nav className="flex flex-wrap gap-1 border-b border-border/60">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            aria-current={activeTab === tab.key ? "page" : undefined}
            className={`border-b-2 px-3 py-2 text-sm transition-colors ${
              activeTab === tab.key
                ? "border-accent text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === "summary" ? <SummaryTab report={report} /> : null}
      {activeTab === "citations" ? <CitationsTab report={report} /> : null}
      {activeTab === "numbers" ? <NumbersTab report={report} /> : null}
      {activeTab === "methods" ? <MethodsTab report={report} /> : null}
      {activeTab === "conflicts" ? <ConflictsTab report={report} /> : null}
      {activeTab === "review" ? <ReviewTab report={report} /> : null}
    </section>
  );
}

function SummaryTab({ report }: { report: Report }) {
  return (
    <div className="space-y-6">
      <article className="border border-border/60 bg-card/40 p-5">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {report.narrative}
        </p>
      </article>

      {report.confidenceRatings.length === 0 ? null : (
        <div className="border border-border/60 bg-card/40">
          <h3 className="border-b border-border/60 px-4 py-3 text-sm">
            How much weight each claim carries
          </h3>
          <ul className="divide-y divide-border/30">
            {report.confidenceRatings.map((rating) => {
              const claim = report.claims.find(
                (entry) => entry.identifier === rating.claimIdentifier
              );

              return (
                <li key={rating.claimIdentifier} className="px-4 py-3">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">
                      {rating.claimIdentifier}
                    </span>
                    <ConfidenceBadge level={rating.level} />
                  </div>
                  <p className="text-sm text-foreground">
                    {claim?.text ?? "Claim text unavailable"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {rating.explanation}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {report.limitations.length === 0 ? null : (
        <div className="border border-verdict-wrong-source/30 bg-card/40">
          <h3 className="border-b border-verdict-wrong-source/30 px-4 py-3 text-sm text-verdict-wrong-source">
            What this check did not cover
          </h3>
          <ul className="divide-y divide-border/30">
            {report.limitations.map((limitation, index) => (
              <li key={`${limitation.area}-${index}`} className="px-4 py-3">
                <p className="text-xs tracking-wide uppercase text-muted-foreground">
                  {limitation.area}
                </p>
                <p className="text-sm text-foreground">
                  {limitation.description}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function CitationsTab({ report }: { report: Report }) {
  if (report.citationChecks.length === 0) {
    return <EmptyNote text="No citations were checked." />;
  }

  return (
    <ul className="space-y-3">
      {report.citationChecks.map((check, index) => {
        const claim = report.claims.find(
          (entry) => entry.identifier === check.claimIdentifier
        );

        return (
          <li
            key={`${check.claimIdentifier}-${check.marker}-${index}`}
            className="border border-border/60 bg-card/40 p-4"
          >
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">
                {check.claimIdentifier} {check.marker}
              </span>
              <VerdictBadge verdict={check.judgement.verdict} />
              {claim === undefined ? null : (
                <span className="font-mono text-xs text-muted-foreground">
                  page {claim.location.pageNumber}
                </span>
              )}
            </div>

            <p className="mb-3 text-sm text-foreground">
              {claim?.text ?? check.rawReference}
            </p>

            {check.resolvedSource === null ? null : (
              <p className="mb-3 text-xs text-muted-foreground">
                Cited: {check.resolvedSource.title}
                {check.resolvedSource.publicationYear === null
                  ? ""
                  : ` (${check.resolvedSource.publicationYear})`}
              </p>
            )}

            <p className="text-sm text-muted-foreground">
              {check.judgement.reasoning}
            </p>

            {check.judgement.quotedEvidence === null ? null : (
              <blockquote className="mt-3 border-l-2 border-accent/50 pl-3 font-mono text-xs text-muted-foreground">
                {check.judgement.quotedEvidence}
              </blockquote>
            )}

            {check.trace === null || check.trace.chain.length < 2 ? null : (
              <div className="mt-3 border-t border-border/40 pt-3">
                <p className="mb-1.5 text-xs tracking-wide uppercase text-muted-foreground">
                  Where the finding came from
                </p>
                <ol className="space-y-1">
                  {check.trace.chain.map((link, linkIndex) => (
                    <li
                      key={link.digitalObjectIdentifier}
                      className="flex gap-2 text-xs"
                      style={{ paddingLeft: `${linkIndex * 14}px` }}
                    >
                      <span
                        className={
                          link.role === "original"
                            ? "text-verdict-supported"
                            : "text-verdict-indirect-source"
                        }
                      >
                        {link.role === "original" ? "original" : "repeats"}
                      </span>
                      <span className="text-muted-foreground">{link.title}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function NumbersTab({ report }: { report: Report }) {
  if (report.measurements.length === 0) {
    return <EmptyNote text="No reported numbers were checked." />;
  }

  return (
    <div className="overflow-x-auto border border-border/60 bg-card/40">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/60 text-left text-xs tracking-wide uppercase text-muted-foreground">
            <th className="px-4 py-2.5 font-normal">Claim</th>
            <th className="px-4 py-2.5 font-normal">Reader one</th>
            <th className="px-4 py-2.5 font-normal">Reader two</th>
            <th className="px-4 py-2.5 font-normal">Agreed</th>
            <th className="px-4 py-2.5 font-normal">Agreement</th>
            <th className="px-4 py-2.5 font-normal">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {report.measurements.map((measurement) => (
            <tr key={measurement.claimIdentifier}>
              <td className="px-4 py-2.5 font-mono text-xs">
                {measurement.claimIdentifier}
              </td>
              <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                {measurement.readerOne?.value ?? "none"}
              </td>
              <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                {measurement.readerTwo?.value ?? "none"}
              </td>
              <td className="px-4 py-2.5 font-mono text-xs">
                {measurement.agreedValue?.value ?? "unresolved"}
              </td>
              <td className="px-4 py-2.5 font-mono text-xs">
                {measurement.agreementScore.toFixed(2)}
              </td>
              <td className="px-4 py-2.5 text-xs text-muted-foreground">
                {agreementStatusLabels[measurement.status]}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MethodsTab({ report }: { report: Report }) {
  if (report.missingDetails.length === 0) {
    return <EmptyNote text="Nothing important is missing from the method." />;
  }

  return (
    <ul className="space-y-3">
      {report.missingDetails.map((detail, index) => (
        <li
          key={`${detail.category}-${index}`}
          className="border border-border/60 bg-card/40 p-4"
        >
          <div className="mb-2 flex items-center gap-2">
            <SeverityBadge severity={detail.severity} />
            <span className="text-xs text-muted-foreground">
              {missingDetailCategoryLabels[detail.category]}
            </span>
          </div>
          <p className="mb-2 text-sm text-foreground">{detail.description}</p>
          <p className="border-l-2 border-accent/50 pl-3 text-sm text-muted-foreground">
            Ask the authors: {detail.questionForAuthors}
          </p>
        </li>
      ))}
    </ul>
  );
}

function ConflictsTab({ report }: { report: Report }) {
  if (report.conflicts.length === 0) {
    return (
      <EmptyNote text="The related papers agree with this one, or too few were available to compare." />
    );
  }

  return (
    <ul className="space-y-4">
      {report.conflicts.map((conflict) => (
        <li
          key={conflict.identifier}
          className="border border-border/60 bg-card/40 p-4"
        >
          <h3 className="mb-3 font-display text-lg text-foreground">
            {conflict.question}
          </h3>

          <div className="mb-3 grid gap-3 sm:grid-cols-2">
            {conflict.groups.map((group) => (
              <div key={group.label} className="border border-border/50 p-3">
                <p className="mb-1 text-sm text-foreground">{group.label}</p>
                <p className="mb-2 font-mono text-xs text-muted-foreground">
                  {group.direction.replace(/-/g, " ")} ·{" "}
                  {group.studyIdentifiers.length} studies
                </p>
                {group.combinedValue === null ? null : (
                  <p className="font-display text-2xl text-foreground">
                    {group.combinedValue}
                  </p>
                )}
              </div>
            ))}
          </div>

          {conflict.explanation === null ? (
            <p className="border-l-2 border-verdict-wrong-source/50 pl-3 text-sm text-muted-foreground">
              No factor was found that separates these groups cleanly.
            </p>
          ) : (
            <div className="border-l-2 border-accent/50 pl-3">
              <p className="text-sm text-foreground">
                Explained by {conflict.explanation.differingFactor}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {conflict.explanation.evidence}
              </p>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function ReviewTab({ report }: { report: Report }) {
  if (report.review === null) {
    return <EmptyNote text="No review was run for this check." />;
  }

  return (
    <div className="space-y-4">
      <div className="border border-border/60 bg-card/40 p-5">
        <p className="mb-1 text-xs tracking-wide uppercase text-muted-foreground">
          Outcome
        </p>
        <p className="mb-3 font-display text-3xl text-foreground">
          {reviewOutcomeLabels[report.review.outcome]}
        </p>
        <p className="text-sm text-muted-foreground">
          {report.review.headline}
        </p>
      </div>

      <ul className="space-y-3">
        {report.review.points.map((point, index) => (
          <li
            key={`${point.angle}-${index}`}
            className="border border-border/60 bg-card/40 p-4"
          >
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <SeverityBadge severity={point.severity} />
              <span className="text-xs text-muted-foreground">
                {reviewAngleLabels[point.angle]}
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                {point.rebuttalDifficulty} to answer
              </span>
            </div>
            <p className="mb-1.5 text-sm text-foreground">{point.summary}</p>
            <p className="text-sm text-muted-foreground">{point.detail}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EmptyNote({ text }: { text: string }) {
  return (
    <p className="border border-border/60 bg-card/40 px-4 py-8 text-center text-sm text-muted-foreground">
      {text}
    </p>
  );
}
