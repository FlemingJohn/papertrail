"use client";

import type { Report } from "@/lib/schemas/report";
import { formatDollars } from "@/lib/config/pricing";
import {
  agreementStatusLabels,
  missingDetailCategoryLabels,
  reviewAngleLabels,
  reviewOutcomeLabels,
} from "@/lib/config/labels";
import { microLabel, sectionLabel } from "@/lib/design/tokens";
import { QuoteIcon } from "./icons";
import {
  ConfidenceBadge,
  NeutralPill,
  SeverityBadge,
  VerdictBadge,
} from "./verdict-badge";

export function SummarySection({ report }: { report: Report }) {
  return (
    <div className="space-y-14">
      <article>
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
                  <p className="max-w-3xl text-sm leading-relaxed">
                    {claim?.text ?? "Claim text unavailable"}
                  </p>
                  <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
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
          <p className={`${sectionLabel} mb-6 text-verdict-wrong-source`}>
            What this check did not cover
          </p>
          <ul>
            {report.limitations.map((limitation, index) => (
              <li
                key={`${limitation.area}-${index}`}
                className="border-b border-white/10 py-4 last:border-b-0"
              >
                <p className={`${microLabel} mb-1`}>{limitation.area}</p>
                <p className="max-w-3xl text-sm leading-relaxed">
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

export function CitationsSection({ report }: { report: Report }) {
  if (report.citationChecks.length === 0) {
    return <EmptyNote text="No citations were checked." />;
  }

  return (
    <ul>
      {report.citationChecks.map((check, index) => {
        const claim = report.claims.find(
          (entry) => entry.identifier === check.claimIdentifier
        );

        return (
          <li
            key={`${check.claimIdentifier}-${check.marker}-${index}`}
            className="border-b border-white/10 py-8 first:pt-0"
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
              <blockquote className="mt-4 flex max-w-3xl gap-3 border-l border-accent/60 pl-4">
                <QuoteIcon className="size-4 shrink-0 translate-y-1 text-accent/70" />
                <span className="text-sm italic leading-relaxed text-muted-foreground">
                  {check.judgement.quotedEvidence}
                </span>
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

export function NumbersSection({ report }: { report: Report }) {
  if (report.measurements.length === 0) {
    return <EmptyNote text="No reported numbers were checked." />;
  }

  return (
    <div className="overflow-x-auto">
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
              <th key={heading} className={`${microLabel} pb-3 pr-6 font-normal`}>
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

export function MethodsSection({ report }: { report: Report }) {
  if (report.missingDetails.length === 0) {
    return <EmptyNote text="Nothing important is missing from the method." />;
  }

  return (
    <ul>
      {report.missingDetails.map((detail, index) => (
        <li
          key={`${detail.category}-${index}`}
          className="border-b border-white/10 py-6 first:pt-0"
        >
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <SeverityBadge severity={detail.severity} />
            <NeutralPill>
              {missingDetailCategoryLabels[detail.category]}
            </NeutralPill>
          </div>
          <p className="mb-3 max-w-3xl font-display text-lg font-light leading-snug">
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

export function ConflictsSection({ report }: { report: Report }) {
  if (report.conflicts.length === 0) {
    return (
      <EmptyNote text="The related papers agree with this one, or too few were available to compare." />
    );
  }

  return (
    <ul>
      {report.conflicts.map((conflict) => (
        <li
          key={conflict.identifier}
          className="border-b border-white/10 py-8 first:pt-0"
        >
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

export function ReviewSection({ report }: { report: Report }) {
  if (report.review === null) {
    return <EmptyNote text="No review was run for this check." />;
  }

  return (
    <div className="space-y-10">
      <div>
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

export function CostSection({ report }: { report: Report }) {
  const rows: Array<{ label: string; value: string }> = [
    { label: "Total", value: formatDollars(report.spend.totalDollars) },
    { label: "Tokens in", value: report.spend.tokensIn.toLocaleString() },
    { label: "Tokens out", value: report.spend.tokensOut.toLocaleString() },
    {
      label: "Reused from cache",
      value: report.spend.cachedTokensIn.toLocaleString(),
    },
    { label: "Pages read", value: String(report.spend.documentPagesRead) },
    { label: "Lookups", value: String(report.spend.toolCallCount) },
    { label: "Served from cache", value: String(report.spend.cacheHitCount) },
  ];

  const cacheRate =
    report.spend.toolCallCount === 0
      ? 0
      : Math.round(
          (report.spend.cacheHitCount / report.spend.toolCallCount) * 100
        );

  const perClaim =
    report.claims.length === 0
      ? 0
      : report.spend.totalDollars / report.claims.length;

  return (
    <div className="space-y-12">
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((row) => (
          <div key={row.label} className="border-t border-white/10 pt-5">
            <p className={`${microLabel} mb-2`}>{row.label}</p>
            <p className="font-display text-3xl font-light">{row.value}</p>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10 pt-8">
        <p className={`${sectionLabel} mb-6`}>What that works out to</p>
        <ul className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <li>
            <span className="text-foreground">
              {formatDollars(perClaim)}
            </span>{" "}
            per claim checked, across {report.claims.length} claims.
          </li>
          <li>
            <span className="text-foreground">{cacheRate}%</span> of lookups
            were served from cache, so re-checking this paper costs materially
            less.
          </li>
          {report.spend.cachedTokensIn === 0 ? null : (
            <li>
              <span className="text-foreground">
                {promptCacheRate(report)}%
              </span>{" "}
              of what was sent to the model was already cached from an earlier
              call, and is charged at half rate.
            </li>
          )}
          <li>
            {report.coverage.citationsChecked} citations checked,{" "}
            {report.coverage.citationsUncheckable} of them unverifiable because
            the source could not be read.
          </li>
        </ul>
      </div>
    </div>
  );
}

function promptCacheRate(report: Report): number {
  if (report.spend.tokensIn === 0) {
    return 0;
  }
  return Math.round((report.spend.cachedTokensIn / report.spend.tokensIn) * 100);
}

function EmptyNote({ text }: { text: string }) {
  return (
    <p className="py-12 text-center text-sm text-muted-foreground">{text}</p>
  );
}
