"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Report } from "@/lib/schemas/report";
import { formatDollars } from "@/lib/config/pricing";
import {
  agreementStatusLabels,
  missingDetailCategoryLabels,
  reviewAngleLabels,
  reviewOutcomeLabels,
} from "@/lib/config/labels";
import { isProblemVerdict } from "@/lib/schemas/verdict";
import { microLabel, sectionLabel } from "@/lib/design/tokens";
import { ChartIcon, CoinIcon, LinkIcon, ScaleIcon } from "./icons";
import { StatTile } from "./stat-tile";
import {
  ConfidenceBadge,
  NeutralPill,
  SeverityBadge,
  VerdictBadge,
} from "./verdict-badge";

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
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-12"
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

      <nav className="flex flex-wrap gap-2 border-t border-white/10 pt-8">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            aria-current={activeTab === tab.key ? "page" : undefined}
            className={`rounded-full border px-5 py-2 font-mono text-[10px] uppercase tracking-widest transition-colors duration-300 ${
              activeTab === tab.key
                ? "border-white/60 text-foreground"
                : "border-white/20 text-muted-foreground hover:border-white/40"
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
    </motion.section>
  );
}

function SummaryTab({ report }: { report: Report }) {
  return (
    <div className="space-y-12">
      <article className="border-t border-white/10 pt-8">
        <p className={`${sectionLabel} mb-6`}>What was found</p>
        <p className="max-w-3xl whitespace-pre-wrap text-base leading-relaxed">
          {report.narrative}
        </p>
      </article>

      {report.confidenceRatings.length === 0 ? null : (
        <section className="border-t border-white/10 pt-8">
          <p className={`${sectionLabel} mb-6`}>
            How much weight each claim carries
          </p>
          <ul>
            {report.confidenceRatings.map((rating) => {
              const claim = report.claims.find(
                (entry) => entry.identifier === rating.claimIdentifier
              );

              return (
                <li
                  key={rating.claimIdentifier}
                  className="border-b border-white/10 py-5 last:border-b-0"
                >
                  <div className="mb-3 flex flex-wrap items-center gap-3">
                    <span className={microLabel}>{rating.claimIdentifier}</span>
                    <ConfidenceBadge level={rating.level} />
                  </div>
                  <p className="text-sm leading-relaxed">
                    {claim?.text ?? "Claim text unavailable"}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {rating.explanation}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {report.limitations.length === 0 ? null : (
        <section className="border-t border-verdict-wrong-source/40 pt-8">
          <p
            className={`${sectionLabel} mb-6 text-verdict-wrong-source`}
          >
            What this check did not cover
          </p>
          <ul>
            {report.limitations.map((limitation, index) => (
              <li
                key={`${limitation.area}-${index}`}
                className="border-b border-white/10 py-4 last:border-b-0"
              >
                <p className={`${microLabel} mb-1`}>{limitation.area}</p>
                <p className="text-sm leading-relaxed">
                  {limitation.description}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function CitationsTab({ report }: { report: Report }) {
  if (report.citationChecks.length === 0) {
    return <EmptyNote text="No citations were checked." />;
  }

  return (
    <ul className="border-t border-white/10">
      {report.citationChecks.map((check, index) => {
        const claim = report.claims.find(
          (entry) => entry.identifier === check.claimIdentifier
        );

        return (
          <li
            key={`${check.claimIdentifier}-${check.marker}-${index}`}
            className="border-b border-white/10 py-8"
          >
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className={microLabel}>
                {check.claimIdentifier} {check.marker}
              </span>
              <VerdictBadge verdict={check.judgement.verdict} />
              {claim === undefined ? null : (
                <span className={microLabel}>
                  page {claim.location.pageNumber}
                </span>
              )}
            </div>

            <p className="mb-4 max-w-3xl font-display text-xl font-light leading-snug">
              {claim?.text ?? check.rawReference}
            </p>

            {check.resolvedSource === null ? null : (
              <p className="mb-4 text-sm text-muted-foreground">
                Cited: {check.resolvedSource.title}
                {check.resolvedSource.publicationYear === null
                  ? ""
                  : ` (${check.resolvedSource.publicationYear})`}
              </p>
            )}

            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
              {check.judgement.reasoning}
            </p>

            {check.judgement.quotedEvidence === null ? null : (
              <blockquote className="mt-4 max-w-3xl border-l border-accent/60 pl-4 text-sm italic leading-relaxed text-muted-foreground">
                {check.judgement.quotedEvidence}
              </blockquote>
            )}

            {check.trace === null || check.trace.chain.length < 2 ? null : (
              <div className="mt-6">
                <p className={`${microLabel} mb-3`}>
                  Where the finding came from
                </p>
                <ol className="space-y-2">
                  {check.trace.chain.map((link, linkIndex) => (
                    <li
                      key={link.digitalObjectIdentifier}
                      className="flex flex-wrap items-center gap-3"
                      style={{ paddingLeft: `${linkIndex * 20}px` }}
                    >
                      <span
                        className={`font-mono text-[10px] uppercase tracking-widest ${
                          link.role === "original"
                            ? "text-verdict-supported"
                            : "text-verdict-indirect-source"
                        }`}
                      >
                        {link.role === "original" ? "original" : "repeats"}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {link.title}
                      </span>
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
    <div className="overflow-x-auto border-t border-white/10 pt-8">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left">
            {[
              "Claim",
              "Reader one",
              "Reader two",
              "Agreed",
              "Agreement",
              "Status",
            ].map((heading) => (
              <th
                key={heading}
                className={`${microLabel} pb-3 pr-6 font-normal`}
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {report.measurements.map((measurement) => (
            <tr
              key={measurement.claimIdentifier}
              className="border-b border-white/10 last:border-b-0"
            >
              <td className="py-3 pr-6 font-mono text-xs">
                {measurement.claimIdentifier}
              </td>
              <td className="py-3 pr-6 font-mono text-xs text-muted-foreground">
                {measurement.readerOne?.value ?? "none"}
              </td>
              <td className="py-3 pr-6 font-mono text-xs text-muted-foreground">
                {measurement.readerTwo?.value ?? "none"}
              </td>
              <td className="py-3 pr-6 font-mono text-xs">
                {measurement.agreedValue?.value ?? "unresolved"}
              </td>
              <td className="py-3 pr-6 font-mono text-xs">
                {measurement.agreementScore.toFixed(2)}
              </td>
              <td className="py-3 text-xs text-muted-foreground">
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
    <ul className="border-t border-white/10">
      {report.missingDetails.map((detail, index) => (
        <li
          key={`${detail.category}-${index}`}
          className="border-b border-white/10 py-6"
        >
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <SeverityBadge severity={detail.severity} />
            <NeutralPill>
              {missingDetailCategoryLabels[detail.category]}
            </NeutralPill>
          </div>
          <p className="mb-3 max-w-3xl text-sm leading-relaxed">
            {detail.description}
          </p>
          <p className="max-w-3xl border-l border-accent/60 pl-4 text-sm leading-relaxed text-muted-foreground">
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
    <ul className="border-t border-white/10">
      {report.conflicts.map((conflict) => (
        <li key={conflict.identifier} className="border-b border-white/10 py-8">
          <h3 className="mb-6 max-w-3xl font-display text-2xl font-light italic leading-snug">
            {conflict.question}
          </h3>

          <div className="mb-6 grid gap-8 sm:grid-cols-2">
            {conflict.groups.map((group) => (
              <div key={group.label} className="border-t border-white/10 pt-4">
                <p className={`${microLabel} mb-2`}>
                  {group.direction.replace(/-/g, " ")} ·{" "}
                  {group.studyIdentifiers.length} studies
                </p>
                <p className="mb-2 text-sm">{group.label}</p>
                {group.combinedValue === null ? null : (
                  <p className="font-display text-3xl font-light">
                    {group.combinedValue}
                  </p>
                )}
              </div>
            ))}
          </div>

          {conflict.explanation === null ? (
            <p className="max-w-3xl border-l border-verdict-wrong-source/60 pl-4 text-sm leading-relaxed text-muted-foreground">
              No factor was found that separates these groups cleanly.
            </p>
          ) : (
            <div className="max-w-3xl border-l border-accent/60 pl-4">
              <p className="text-sm">
                Explained by {conflict.explanation.differingFactor}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
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
    <div className="space-y-10">
      <div className="border-t border-white/10 pt-8">
        <p className={`${sectionLabel} mb-4`}>Outcome</p>
        <p className="mb-4 font-display text-4xl font-light italic">
          {reviewOutcomeLabels[report.review.outcome]}
        </p>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {report.review.headline}
        </p>
      </div>

      <ul className="border-t border-white/10">
        {report.review.points.map((point, index) => (
          <li
            key={`${point.angle}-${index}`}
            className="border-b border-white/10 py-6"
          >
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <SeverityBadge severity={point.severity} />
              <NeutralPill>{reviewAngleLabels[point.angle]}</NeutralPill>
              <span className={microLabel}>
                {point.rebuttalDifficulty} to answer
              </span>
            </div>
            <p className="mb-2 max-w-3xl font-display text-lg font-light leading-snug">
              {point.summary}
            </p>
            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
              {point.detail}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EmptyNote({ text }: { text: string }) {
  return (
    <p className="border-t border-white/10 py-12 text-center text-sm text-muted-foreground">
      {text}
    </p>
  );
}
