import Link from "next/link";
import { notFound } from "next/navigation";
import { loadLatestReportFor, loadPaper } from "@/lib/client/load-document";
import { buttonSecondary, microLabel, sectionLabel } from "@/lib/design/tokens";
import { PaperReader } from "@/components/dashboard/paper-reader";

interface PageProps {
  params: Promise<{ documentId: string }>;
  searchParams: Promise<{ claim?: string }>;
}

export default async function PaperPage({ params, searchParams }: PageProps) {
  const { documentId } = await params;
  const { claim } = await searchParams;

  const paper = await loadPaper(documentId);

  if (paper === null) {
    notFound();
  }

  const report = await loadLatestReportFor(documentId);

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-12">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Link
            href="/knowledge"
            className={`${microLabel} transition-colors hover:text-foreground`}
          >
            Your papers
          </Link>
          <span className={microLabel}>·</span>
          <span className={microLabel}>{paper.pageCount} pages</span>
          {report === null ? null : (
            <>
              <span className={microLabel}>·</span>
              <span className={microLabel}>
                {report.citationChecks.length} citations checked
              </span>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-start justify-between gap-6">
          <h1 className="max-w-3xl font-display text-3xl font-light leading-snug md:text-4xl">
            {paper.title}
          </h1>
          <div className="flex gap-2">
            {report === null ? null : (
              <Link
                href={`/reports/${paper.latestReportId}`}
                className={buttonSecondary}
              >
                The findings
              </Link>
            )}
            <Link href={`/check?paper=${documentId}`} className={buttonSecondary}>
              Check it
            </Link>
          </div>
        </div>

        <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {report === null
            ? "This is what the document reader extracted. Check the paper to have its citations judged."
            : "This is what the document reader extracted. Citation markers are linked to how they were judged."}
        </p>
      </header>

      {paper.extractedContent === null ? (
        <p className={`${sectionLabel} border-t border-white/10 py-12`}>
          Nothing was extracted from this paper.
        </p>
      ) : (
        <PaperReader
          documentId={documentId}
          extraction={paper.extractedContent}
          report={report}
          initialClaimIdentifier={claim ?? null}
        />
      )}
    </div>
  );
}
