"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import type { ProjectDraft } from "@/lib/client/project-types";
import {
  buttonQuiet,
  buttonSecondary,
  microLabel,
  sectionLabel,
} from "@/lib/design/tokens";
import { ErrorBoundary } from "@/components/dashboard/error-boundary";
import { ProblemIcon, SpinnerIcon } from "@/components/dashboard/icons";

export default function DraftPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={null}>
        <DraftView />
      </Suspense>
    </ErrorBoundary>
  );
}

function DraftView() {
  const parameters = useParams<{ projectId: string }>();
  const projectId = parameters.projectId;
  const searchParams = useSearchParams();
  const requestedDraftId = searchParams.get("draftId");

  const [draft, setDraft] = useState<ProjectDraft | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const query =
        requestedDraftId === null ? "" : `?draftId=${requestedDraftId}`;
      const response = await fetch(`/api/projects/${projectId}/draft${query}`);
      const body = (await response.json()) as {
        draft?: ProjectDraft;
        error?: string;
      };

      if (!response.ok || body.draft === undefined) {
        setErrorMessage(body.error ?? "The draft could not be loaded.");
        return;
      }

      setDraft(body.draft);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The draft could not be loaded."
      );
    } finally {
      setIsLoading(false);
    }
  }, [projectId, requestedDraftId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-4xl items-center gap-3 text-sm text-muted-foreground">
        <SpinnerIcon className="size-4 animate-spin" />
        Loading the draft
      </div>
    );
  }

  if (draft === null) {
    return (
      <div className="mx-auto max-w-2xl">
        <div
          role="alert"
          className="flex gap-4 border border-verdict-retracted/40 px-6 py-5"
        >
          <ProblemIcon className="size-5 shrink-0 translate-y-0.5 text-verdict-retracted" />
          <div>
            <p className="font-display text-lg font-light">
              There is no draft to show
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {errorMessage ?? "This project has not reached a draft yet."}
            </p>
            <Link href={`/projects/${projectId}`} className={`${buttonQuiet} mt-5`}>
              Back to the project
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const downloadBase = `/api/projects/${projectId}/draft/${draft.draftId}/download`;

  return (
    <div className="mx-auto max-w-5xl">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="print-hidden mb-10 border-b border-white/10 pb-8"
      >
        <div className="mb-6 flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-0">
            <p className={`${sectionLabel} mb-3`}>Your draft</p>
            <h1 className="max-w-2xl font-display text-2xl font-light leading-snug md:text-3xl">
              {draft.title}
            </h1>
            <p className={`${microLabel} mt-3`}>
              {draft.authorName} · {draft.figureCount} figures ·{" "}
              {draft.tableCount} tables · {draft.excludedCitations.length}{" "}
              sources left out
            </p>
          </div>

          <Link href={`/projects/${projectId}`} className={buttonQuiet}>
            Back to the project
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className={buttonSecondary}
          >
            Save as PDF
          </button>

          <a href={`${downloadBase}?format=tex`} className={buttonSecondary}>
            Download the LaTeX
          </a>

          <a href={`${downloadBase}?format=bib`} className={buttonSecondary}>
            Download the bibliography
          </a>
        </div>

        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Save as PDF prints the page below through your browser. The LaTeX file
          carries the same content with the figures drawn in TikZ, so it opens
          in Overleaf against the bibliography file without any edits.
        </p>
      </motion.header>

      {draft.excludedCitations.length === 0 ? null : (
        <section className="print-hidden mb-10 border border-verdict-wrong-source/40 px-6 py-5">
          <p className={`${sectionLabel} mb-4`}>
            Kept out of the bibliography
          </p>
          <ul className="space-y-2.5">
            {draft.excludedCitations.map((excluded, index) => (
              <li key={`excluded-${index}`} className="text-sm leading-relaxed">
                <span className="block">{excluded.reference}</span>
                <span className="block text-xs text-muted-foreground">
                  {excluded.reason}
                </span>
              </li>
            ))}
          </ul>
          <p className={`${microLabel} mt-5`}>
            These appear in the draft as a note, not as citations
          </p>
        </section>
      )}

      <motion.article
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="draft-preview"
        dangerouslySetInnerHTML={{ __html: draft.previewHtml }}
      />
    </div>
  );
}
