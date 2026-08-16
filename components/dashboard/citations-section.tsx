"use client";

import { useState } from "react";
import Link from "next/link";
import type { Report } from "@/lib/schemas/report";
import type { CitationVerdict } from "@/lib/schemas/verdict";
import { isProblemVerdict } from "@/lib/schemas/verdict";
import { buttonQuiet, microLabel } from "@/lib/design/tokens";
import { QuoteIcon } from "./icons";
import { VerdictBadge } from "./verdict-badge";

const verdictOrder: CitationVerdict[] = [
  "retracted",
  "not-supported",
  "wrong-source",
  "source-not-found",
  "indirect-source",
  "could-not-check",
  "partly-supported",
  "supported",
];

interface CitationsSectionProps {
  report: Report;
  documentId?: string | null;
}

export function CitationsSection({
  report,
  documentId = null,
}: CitationsSectionProps) {
  const [showOnlyProblems, setShowOnlyProblems] = useState(false);

  if (report.citationChecks.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        No citations were checked.
      </p>
    );
  }

  const problemCount = report.citationChecks.filter((check) =>
    isProblemVerdict(check.judgement.verdict)
  ).length;

  const visible = showOnlyProblems
    ? report.citationChecks.filter((check) =>
        isProblemVerdict(check.judgement.verdict)
      )
    : report.citationChecks;

  const grouped = verdictOrder
    .map((verdict) => ({
      verdict,
      checks: visible.filter((check) => check.judgement.verdict === verdict),
    }))
    .filter((group) => group.checks.length > 0);

  return (
    <div>
      <div className="mb-10 flex flex-wrap items-center gap-3">
        <FilterButton
          isActive={!showOnlyProblems}
          onSelect={() => setShowOnlyProblems(false)}
          label={`All ${report.citationChecks.length}`}
        />
        <FilterButton
          isActive={showOnlyProblems}
          isWarning
          onSelect={() => setShowOnlyProblems(true)}
          label={`Problems ${problemCount}`}
        />
      </div>

      {grouped.map((group) => (
        <section key={group.verdict} className="mb-12">
          <div className="mb-5 flex flex-wrap items-center gap-3 border-t border-white/10 pt-5">
            <VerdictBadge verdict={group.verdict} />
            <span className={microLabel}>
              {group.checks.length}{" "}
              {group.checks.length === 1 ? "citation" : "citations"}
            </span>
          </div>

          <ul>
            {group.checks.map((check, index) => {
              const claim = report.claims.find(
                (entry) => entry.identifier === check.claimIdentifier
              );

              const original = check.trace?.chain.find(
                (link) => link.role === "original"
              );

              return (
                <li
                  key={`${check.claimIdentifier}-${check.marker}-${index}`}
                  className="border-b border-white/10 py-6 last:border-b-0"
                >
                  <div className="mb-3 flex flex-wrap items-center gap-3">
                    <span className={microLabel}>
                      {check.claimIdentifier} {check.marker}
                    </span>
                    {claim === undefined ? null : (
                      <span className={microLabel}>
                        page {claim.location.pageNumber}
                      </span>
                    )}
                  </div>

                  <p className="mb-3 max-w-3xl font-display text-lg font-light leading-snug">
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

                  <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
                    {check.judgement.reasoning}
                  </p>

                  {check.judgement.quotedEvidence === null ? null : (
                    <blockquote className="mt-3 flex max-w-3xl gap-3 border-l border-accent/60 pl-4">
                      <QuoteIcon className="size-4 shrink-0 translate-y-1 text-accent/70" />
                      <span className="text-sm italic leading-relaxed text-muted-foreground">
                        {check.judgement.quotedEvidence}
                      </span>
                    </blockquote>
                  )}

                  {check.trace === null ||
                  check.trace.chain.length < 2 ? null : (
                    <div className="mt-5">
                      <p className={`${microLabel} mb-3`}>
                        Where the finding came from
                      </p>
                      <ol className="space-y-2">
                        {check.trace.chain.map((link, linkIndex) => (
                          <li
                            key={link.digitalObjectIdentifier}
                            className="flex flex-wrap items-baseline gap-3"
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

                  {documentId === null ? null : (
                    <div className="mt-5 flex flex-wrap gap-2">
                      <Link
                        href={`/knowledge/${documentId}?claim=${check.claimIdentifier}`}
                        className={buttonQuiet}
                      >
                        See it in the paper
                      </Link>
                      {original === undefined ? null : (
                        <span className={`${buttonQuiet} normal-case`}>
                          Cite {shorten(original.title)} instead
                        </span>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {visible.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Every citation held up.
        </p>
      ) : null}
    </div>
  );
}

function FilterButton({
  isActive,
  isWarning = false,
  onSelect,
  label,
}: {
  isActive: boolean;
  isWarning?: boolean;
  onSelect: () => void;
  label: string;
}) {
  const activeClasses = isWarning
    ? "border-verdict-wrong-source/70 text-verdict-wrong-source"
    : "border-white/60 text-foreground";

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isActive}
      className={`rounded-full border px-5 py-2 font-mono text-[10px] uppercase tracking-widest transition-colors ${
        isActive
          ? activeClasses
          : "border-white/20 text-muted-foreground hover:border-white/40"
      }`}
    >
      {label}
    </button>
  );
}

function shorten(title: string): string {
  return title.length > 38 ? `${title.slice(0, 38)}…` : title;
}
