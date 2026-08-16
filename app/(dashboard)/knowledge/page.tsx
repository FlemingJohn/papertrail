"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { DocumentSummary } from "@/lib/tools/database/list-documents";
import {
  buttonQuiet,
  buttonSecondary,
  displayMedium,
  microLabel,
  sectionLabel,
} from "@/lib/design/tokens";
import { ErrorBoundary } from "@/components/dashboard/error-boundary";
import {
  DocumentIcon,
  ProblemIcon,
  SpinnerIcon,
  UploadIcon,
} from "@/components/dashboard/icons";

const maximumFileBytes = 20 * 1024 * 1024;

export default function KnowledgePage() {
  const [status, setStatus] = useState<"loading" | "ready" | "failed">(
    "loading"
  );
  const [papers, setPapers] = useState<DocumentSummary[]>([]);
  const [problem, setProblem] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/documents");

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
          detail?: string;
        } | null;
        setStatus("failed");
        setProblem(body?.error ?? "Your papers could not be loaded.");
        setDetail(body?.detail ?? null);
        return;
      }

      const body = (await response.json()) as { documents: DocumentSummary[] };
      setPapers(body.documents);
      setStatus("ready");
    } catch (error) {
      setStatus("failed");
      setProblem("Your papers could not be loaded.");
      setDetail(error instanceof Error ? error.message : "Network error.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const addPaper = useCallback(
    async (file: File | undefined) => {
      if (file === undefined) {
        return;
      }

      if (file.type !== "application/pdf") {
        setProblem("That file is not a PDF.");
        return;
      }

      if (file.size > maximumFileBytes) {
        setProblem("That PDF is larger than 20 MB.");
        return;
      }

      setProblem(null);
      setDetail(null);
      setIsAdding(true);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/documents", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          setProblem(body?.error ?? "That paper could not be added.");
          return;
        }

        await load();
      } catch (error) {
        setProblem(
          error instanceof Error ? error.message : "The upload failed."
        );
      } finally {
        setIsAdding(false);
      }
    },
    [load]
  );

  return (
    <ErrorBoundary>
      <div className="mx-auto max-w-5xl">
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <p className={`${sectionLabel} mb-4`}>Your papers</p>
          <h1 className={displayMedium}>
            {papers.length === 0
              ? "Nothing here yet."
              : papers.length === 1
                ? "One paper, read and stored."
                : `${papers.length} papers, read and stored.`}
          </h1>
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            A paper is read once and kept. Checking it later never sends it to
            the document reader again.
          </p>
        </motion.header>

        <div
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            void addPaper(event.dataTransfer.files[0]);
          }}
          className={`mb-4 flex flex-col items-center justify-center border border-dashed py-12 transition-colors ${
            isDragging ? "border-accent bg-accent/5" : "border-white/15"
          }`}
        >
          {isAdding ? (
            <>
              <SpinnerIcon className="mb-4 size-6 animate-spin text-accent" />
              <p className="font-display text-lg font-light">Reading it now</p>
              <p className={`${microLabel} mt-2`}>
                This takes about twenty seconds
              </p>
            </>
          ) : (
            <>
              <UploadIcon className="mb-4 size-6 text-muted-foreground" />
              <p className="mb-1 font-display text-xl font-light">
                Add a paper
              </p>
              <p className={`${microLabel} mb-5`}>Read once, kept forever</p>
              <label className={`${buttonQuiet} cursor-pointer`}>
                Choose a PDF
                <input
                  type="file"
                  accept="application/pdf"
                  className="sr-only"
                  onChange={(event) => void addPaper(event.target.files?.[0])}
                />
              </label>
            </>
          )}
        </div>

        {problem === null ? null : (
          <p
            role="alert"
            className="mb-8 flex items-start gap-3 border border-verdict-retracted/40 px-4 py-3 text-sm text-verdict-retracted"
          >
            <ProblemIcon className="size-4 shrink-0 translate-y-0.5" />
            <span>
              {problem}
              {detail === null ? null : (
                <span className="mt-1 block font-mono text-xs text-muted-foreground">
                  {detail}
                </span>
              )}
            </span>
          </p>
        )}

        {status === "loading" ? (
          <div className="flex items-center gap-3 border-t border-white/10 py-10 text-sm text-muted-foreground">
            <SpinnerIcon className="size-4 animate-spin" />
            Loading your papers
          </div>
        ) : null}

        {status === "ready" && papers.length === 0 ? (
          <div className="border-t border-white/10 py-14">
            <p className="mb-4 font-display text-2xl font-light italic">
              Add a paper to begin.
            </p>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
              Everything else in PaperTrail works on a paper you have added. It
              is read once, and you can check it as many times as you like.
            </p>
          </div>
        ) : null}

        {papers.length === 0 ? null : (
          <ul className="border-t border-white/10">
            {papers.map((paper) => (
              <li
                key={paper.documentId}
                className="flex flex-wrap items-start justify-between gap-6 border-b border-white/10 py-6"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center gap-2.5">
                    <DocumentIcon className="size-4 shrink-0 text-muted-foreground" />
                    <h2 className="font-display text-xl font-light leading-snug">
                      {paper.title}
                    </h2>
                  </div>

                  <p className={`${microLabel} mb-1`}>
                    {paper.pageCount} pages · {paper.blockCount} blocks ·{" "}
                    {paper.referenceCount} references · {paper.tableCount} tables
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {paper.checkCount === 0
                      ? "Never checked"
                      : `Checked ${paper.checkCount} ${paper.checkCount === 1 ? "time" : "times"}`}
                    {paper.problemCount > 0 ? (
                      <span className="text-verdict-wrong-source">
                        {" "}
                        · {paper.problemCount} citation problems
                      </span>
                    ) : null}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <Link
                    href={`/knowledge/${paper.documentId}`}
                    className={buttonQuiet}
                  >
                    Open
                  </Link>
                  <Link
                    href={`/check?paper=${paper.documentId}`}
                    className={buttonSecondary}
                  >
                    Check
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ErrorBoundary>
  );
}
