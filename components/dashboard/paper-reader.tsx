"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { ParsedDocument } from "@/lib/schemas/document";
import type { Report } from "@/lib/schemas/report";
import type { CitationCheck } from "@/lib/schemas/citation";
import { isProblemVerdict } from "@/lib/schemas/verdict";
import { citationVerdictLabels } from "@/lib/config/labels";
import { buttonQuiet, microLabel, sectionLabel } from "@/lib/design/tokens";
import { QuoteIcon } from "./icons";
import { VerdictBadge } from "./verdict-badge";

interface PaperReaderProps {
  documentId: string;
  extraction: ParsedDocument;
  report: Report | null;
  initialClaimIdentifier: string | null;
}

export function PaperReader({
  documentId,
  extraction,
  report,
  initialClaimIdentifier,
}: PaperReaderProps) {
  const checksByMarker = useMemo(() => {
    const map = new Map<string, CitationCheck>();
    for (const check of report?.citationChecks ?? []) {
      map.set(normalise(check.marker), check);
    }
    return map;
  }, [report]);

  const claimsByIdentifier = useMemo(() => {
    const map = new Map<string, (typeof claims)[number]>();
    const claims = report?.claims ?? [];
    for (const claim of claims) {
      map.set(claim.identifier, claim);
    }
    return map;
  }, [report]);

  const problems = useMemo(
    () =>
      (report?.citationChecks ?? []).filter((check) =>
        isProblemVerdict(check.judgement.verdict)
      ),
    [report]
  );

  const startingClaim =
    initialClaimIdentifier !== null
      ? (claimsByIdentifier.get(initialClaimIdentifier) ?? null)
      : null;

  const [activePage, setActivePage] = useState(
    startingClaim?.location.pageNumber ?? 1
  );
  const [openClaim, setOpenClaim] = useState<string | null>(
    initialClaimIdentifier
  );

  const pageNumbers = Array.from(
    { length: extraction.pageCount },
    (_value, index) => index + 1
  );

  const problemPages = new Set(
    problems
      .map((check) => claimsByIdentifier.get(check.claimIdentifier))
      .filter((claim) => claim !== undefined)
      .map((claim) => claim.location.pageNumber)
  );

  const blocksOnPage = extraction.textBlocks.filter(
    (block) => block.location.pageNumber === activePage
  );

  const tablesOnPage = extraction.tables.filter(
    (table) => table.location.pageNumber === activePage
  );

  const openCheck =
    openClaim === null
      ? null
      : ((report?.citationChecks ?? []).find(
          (check) => check.claimIdentifier === openClaim
        ) ?? null);

  const openClaimText =
    openClaim === null ? null : (claimsByIdentifier.get(openClaim)?.text ?? null);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <div className="grid gap-8 sm:grid-cols-[10rem_minmax(0,1fr)]">
        <aside className="space-y-8">
          <div>
            <p className={`${microLabel} mb-3`}>Pages</p>
            <div className="grid grid-cols-4 gap-1.5">
              {pageNumbers.map((pageNumber) => {
                const isActive = pageNumber === activePage;
                const hasProblem = problemPages.has(pageNumber);

                return (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => {
                      setActivePage(pageNumber);
                      setOpenClaim(null);
                    }}
                    aria-current={isActive ? "page" : undefined}
                    className={`aspect-3/4 border font-mono text-[10px] transition-colors ${
                      isActive
                        ? "border-accent text-foreground"
                        : hasProblem
                          ? "border-verdict-wrong-source/50 text-verdict-wrong-source"
                          : "border-white/10 text-muted-foreground/60 hover:border-white/25"
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>
            {problemPages.size === 0 ? null : (
              <p className={`${microLabel} mt-3 normal-case tracking-wider`}>
                Amber marks a page with a problem
              </p>
            )}
          </div>

          <div>
            <p className={`${microLabel} mb-2`}>On this page</p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {blocksOnPage.length} paragraphs
              <br />
              {tablesOnPage.length} tables
            </p>
          </div>

          {problems.length === 0 ? null : (
            <div>
              <p className={`${microLabel} mb-2`}>Problems</p>
              <ul className="space-y-1">
                {problems.map((check) => {
                  const claim = claimsByIdentifier.get(check.claimIdentifier);
                  return (
                    <li key={`${check.claimIdentifier}-${check.marker}`}>
                      <button
                        type="button"
                        onClick={() => {
                          setOpenClaim(check.claimIdentifier);
                          if (claim !== undefined) {
                            setActivePage(claim.location.pageNumber);
                          }
                        }}
                        className={`font-mono text-[10px] uppercase tracking-widest transition-colors ${
                          openClaim === check.claimIdentifier
                            ? "text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {check.claimIdentifier} · page{" "}
                        {claim?.location.pageNumber ?? "?"}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </aside>

        <div className="min-w-0">
          <p className={`${microLabel} mb-5`}>
            Page {activePage} of {extraction.pageCount} · read by prebuilt-layout
          </p>

          <motion.div
            key={activePage}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-[62ch] space-y-4"
          >
            {blocksOnPage.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nothing was extracted from this page.
              </p>
            ) : (
              blocksOnPage.map((block, index) => (
                <BlockText
                  key={`${activePage}-${index}`}
                  text={block.text}
                  role={block.role}
                  checksByMarker={checksByMarker}
                  onOpen={setOpenClaim}
                />
              ))
            )}

            {tablesOnPage.map((table, index) => (
              <div
                key={`table-${index}`}
                className="overflow-x-auto border-t border-white/10 pt-4"
              >
                <p className={`${microLabel} mb-3`}>
                  {table.caption ?? `Table ${index + 1}`}
                </p>
                <TableView cells={table.cells} />
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      <aside className="lg:border-l lg:border-white/10 lg:pl-8">
        {openCheck === null ? (
          <div className="border-t border-white/10 pt-6">
            <p className={`${sectionLabel} mb-4`}>The verdicts</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {report === null
                ? "This paper has not been checked yet, so the citation markers are not linked to anything."
                : "Select a citation marker in the text, or a problem on the left, to see how it was judged."}
            </p>
          </div>
        ) : (
          <motion.div
            key={openCheck.claimIdentifier}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-white/10 pt-6"
          >
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className={microLabel}>
                {openCheck.claimIdentifier} {openCheck.marker}
              </span>
              <VerdictBadge verdict={openCheck.judgement.verdict} />
            </div>

            {openClaimText === null ? null : (
              <p className="mb-5 font-display text-lg font-light leading-snug">
                {openClaimText}
              </p>
            )}

            {openCheck.resolvedSource === null ? null : (
              <p className="mb-5 text-xs text-muted-foreground">
                Cited: {openCheck.resolvedSource.title}
                {openCheck.resolvedSource.publicationYear === null
                  ? ""
                  : ` (${openCheck.resolvedSource.publicationYear})`}
              </p>
            )}

            {openCheck.challengerArgument === null ? null : (
              <div className="mb-5">
                <p className={`${microLabel} mb-2`}>Arguing against</p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {openCheck.challengerArgument.position}
                </p>
              </div>
            )}

            {openCheck.supporterArgument === null ? null : (
              <div className="mb-5">
                <p className={`${microLabel} mb-2`}>Arguing for</p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {openCheck.supporterArgument.position}
                </p>
              </div>
            )}

            <div className="mb-5">
              <p className={`${microLabel} mb-2`}>Verdict</p>
              <p className="text-sm leading-relaxed">
                {openCheck.judgement.reasoning}
              </p>
            </div>

            {openCheck.judgement.quotedEvidence === null ? null : (
              <blockquote className="mb-5 flex gap-3 border-l border-accent/60 pl-4">
                <QuoteIcon className="size-4 shrink-0 translate-y-1 text-accent/70" />
                <span className="text-sm italic leading-relaxed text-muted-foreground">
                  {openCheck.judgement.quotedEvidence}
                </span>
              </blockquote>
            )}

            {openCheck.trace === null ||
            openCheck.trace.chain.length < 2 ? null : (
              <div className="mb-5">
                <p className={`${microLabel} mb-3`}>Where the finding came from</p>
                <ol className="space-y-2">
                  {openCheck.trace.chain.map((link, index) => (
                    <li
                      key={link.digitalObjectIdentifier}
                      className="flex flex-wrap items-baseline gap-2"
                      style={{ paddingLeft: `${index * 16}px` }}
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
                      <span className="text-xs text-muted-foreground">
                        {link.title}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <button
              type="button"
              onClick={() => setOpenClaim(null)}
              className={buttonQuiet}
            >
              Close
            </button>
          </motion.div>
        )}
      </aside>
    </div>
  );
}

function BlockText({
  text,
  role,
  checksByMarker,
  onOpen,
}: {
  text: string;
  role: string | null;
  checksByMarker: Map<string, CitationCheck>;
  onOpen: (claimIdentifier: string) => void;
}) {
  const parts = text.split(/(\[[0-9]{1,3}(?:\s*,\s*[0-9]{1,3})*\])/g);

  const body = parts.map((part, index) => {
    const match = part.match(/^\[([0-9,\s]+)\]$/);

    if (match === null) {
      return <span key={index}>{part}</span>;
    }

    const first = normalise(match[1].split(",")[0]);
    const check = checksByMarker.get(first);

    if (check === undefined) {
      return (
        <span key={index} className="font-mono text-xs text-muted-foreground">
          {part}
        </span>
      );
    }

    const isProblem = isProblemVerdict(check.judgement.verdict);

    return (
      <button
        key={index}
        type="button"
        onClick={() => onOpen(check.claimIdentifier)}
        title={citationVerdictLabels[check.judgement.verdict]}
        className={`mx-0.5 rounded-full border px-2 py-0.5 font-mono text-[10px] transition-colors ${
          isProblem
            ? "border-verdict-wrong-source/60 text-verdict-wrong-source hover:bg-verdict-wrong-source/10"
            : "border-accent/50 text-accent hover:bg-accent/10"
        }`}
      >
        {match[1].trim()}
      </button>
    );
  });

  if (role === "sectionHeading" || role === "title") {
    return (
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
        {text}
      </p>
    );
  }

  return <p className="text-sm leading-loose text-foreground/85">{body}</p>;
}

function TableView({
  cells,
}: {
  cells: Array<{ rowIndex: number; columnIndex: number; text: string }>;
}) {
  const rows = new Map<number, string[]>();

  for (const cell of cells) {
    const row = rows.get(cell.rowIndex) ?? [];
    row[cell.columnIndex] = cell.text;
    rows.set(cell.rowIndex, row);
  }

  const ordered = [...rows.entries()].sort((left, right) => left[0] - right[0]);

  return (
    <table className="w-full text-xs">
      <tbody>
        {ordered.map(([rowIndex, columns]) => (
          <tr key={rowIndex} className="border-b border-white/10 last:border-b-0">
            {columns.map((value, columnIndex) => (
              <td
                key={columnIndex}
                className="py-2 pr-4 font-mono text-muted-foreground"
              >
                {value}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function normalise(marker: string): string {
  return marker.trim().replace(/^\[+/, "").replace(/\]+$/, "").trim();
}
