"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { ProjectDetail } from "@/lib/client/project-types";
import { stageLabels } from "@/lib/client/project-types";
import type { Decision } from "@/lib/schemas/project";
import { useProjectStream } from "@/lib/client/use-project-stream";
import { formatDollars } from "@/lib/config/pricing";
import {
  buttonQuiet,
  buttonSecondary,
  microLabel,
  pill,
  sectionLabel,
} from "@/lib/design/tokens";
import { ErrorBoundary } from "@/components/dashboard/error-boundary";
import {
  CheckIcon,
  ProblemIcon,
  SpinnerIcon,
} from "@/components/dashboard/icons";
import { GapGate } from "@/components/projects/gap-gate";
import { MethodGate } from "@/components/projects/method-gate";
import { ProjectProgress } from "@/components/projects/project-progress";
import { ProposalGate } from "@/components/projects/proposal-gate";
import { DecisionHistory } from "@/components/projects/decision-history";

export default function ProjectPage() {
  return (
    <ErrorBoundary>
      <ProjectWorkspace />
    </ErrorBoundary>
  );
}

function ProjectWorkspace() {
  const parameters = useParams<{ projectId: string }>();
  const projectId = parameters.projectId;
  const router = useRouter();
  const { state, send, reset } = useProjectStream();

  const [detail, setDetail] = useState<ProjectDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      const body = (await response.json()) as ProjectDetail & {
        error?: string;
      };

      if (!response.ok) {
        setErrorMessage(body.error ?? "This project could not be loaded.");
        return;
      }

      setDetail(body);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "This project could not be loaded."
      );
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (state.status === "waiting") {
      void load();
      reset();
      return;
    }

    if (state.status === "finished" && state.draftId !== null) {
      router.push(`/projects/${projectId}/draft?draftId=${state.draftId}`);
    }
  }, [state.status, state.draftId, load, reset, router, projectId]);

  const isBusy = state.status === "running";

  const decideGaps = useCallback(
    (decisions: Array<{ gapId: string; decision: Decision }>) => {
      void send(`/api/projects/${projectId}/gaps`, { decisions });
    },
    [projectId, send]
  );

  const chooseProposal = useCallback(
    (proposalId: string) => {
      void send(`/api/projects/${projectId}/proposals`, { proposalId });
    },
    [projectId, send]
  );

  const approveMethod = useCallback(
    (authorName: string) => {
      void send(`/api/projects/${projectId}/method`, {
        isApproved: true,
        authorName,
      });
    },
    [projectId, send]
  );

  const sendMethodBack = useCallback(async () => {
    await fetch(`/api/projects/${projectId}/method`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isApproved: false, authorName: "not used" }),
    });
    await load();
  }, [projectId, load]);

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-4xl items-center gap-3 text-sm text-muted-foreground">
        <SpinnerIcon className="size-4 animate-spin" />
        Loading this project
      </div>
    );
  }

  if (detail === null) {
    return (
      <div className="mx-auto max-w-2xl">
        <div
          role="alert"
          className="flex gap-4 border border-verdict-retracted/40 px-6 py-5"
        >
          <ProblemIcon className="size-5 shrink-0 translate-y-0.5 text-verdict-retracted" />
          <div>
            <p className="font-display text-lg font-light">
              This project could not be opened
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {errorMessage ?? "It may have been removed."}
            </p>
            <Link href="/projects" className={`${buttonQuiet} mt-5`}>
              Back to your projects
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { project, papers, gaps, proposals, drafts } = detail;
  const chosenProposal = proposals.find(
    (proposal) => proposal.decision === "accepted"
  );

  return (
    <div className="mx-auto max-w-6xl">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10 flex flex-wrap items-end justify-between gap-6 border-b border-white/10 pb-8"
      >
        <div className="min-w-0">
          <p className={`${sectionLabel} mb-3`}>Research project</p>
          <h1 className="max-w-3xl font-display text-2xl font-light leading-snug md:text-3xl">
            {project.question}
          </h1>
          <p className={`${microLabel} mt-3`}>
            {papers.length} papers · {formatDollars(project.costDollars)} so far
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`${pill} ${
              project.status === "waiting"
                ? "border-accent/50 text-accent"
                : project.status === "failed"
                  ? "border-verdict-retracted/50 text-verdict-retracted"
                  : project.status === "finished"
                    ? "border-verdict-supported/50 text-verdict-supported"
                    : "border-white/20 text-muted-foreground"
            }`}
          >
            {stageLabels[project.stage] ?? project.stage}
          </span>

          <Link href="/projects" className={buttonQuiet}>
            All projects
          </Link>
        </div>
      </motion.header>

      {drafts.length === 0 ? null : (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12 flex flex-wrap items-center justify-between gap-6 border border-verdict-supported/40 px-6 py-5"
        >
          <div className="flex items-center gap-3">
            <CheckIcon className="size-5 shrink-0 text-verdict-supported" />
            <div>
              <p className="font-display text-lg font-light">
                The draft is ready
              </p>
              <p className={`${microLabel} mt-1`}>
                {drafts[0].figureCount} figures · {drafts[0].tableCount} tables ·{" "}
                {drafts[0].excludedCitations.length} sources left out
              </p>
            </div>
          </div>

          <Link
            href={`/projects/${projectId}/draft?draftId=${drafts[0].draftId}`}
            className={buttonSecondary}
          >
            Read the draft
          </Link>
        </motion.section>
      )}

      {isBusy || state.errorMessage !== null ? (
        <section className="mb-12">
          <ProjectProgress stream={state} />
        </section>
      ) : null}

      {isBusy ? null : (
        <section className="mb-14">
          {project.stage === "awaiting-gap-decision" ? (
            <GapGate gaps={gaps} isBusy={isBusy} onDecide={decideGaps} />
          ) : project.stage === "awaiting-proposal-decision" ? (
            <ProposalGate
              proposals={proposals}
              isBusy={isBusy}
              onChoose={chooseProposal}
            />
          ) : project.stage === "awaiting-method-decision" &&
            chosenProposal !== undefined ? (
            <MethodGate
              proposal={chosenProposal}
              isBusy={isBusy}
              onApprove={approveMethod}
              onSendBack={() => {
                void sendMethodBack();
              }}
            />
          ) : project.status === "failed" ? (
            <div className="flex gap-4 border border-verdict-retracted/40 px-6 py-5">
              <ProblemIcon className="size-5 shrink-0 translate-y-0.5 text-verdict-retracted" />
              <div>
                <p className="font-display text-lg font-light">
                  This project stopped at {stageLabels[project.stage] ?? project.stage}
                </p>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  Nothing was lost. Everything decided so far is saved, so you
                  can start a new project from the same question without paying
                  for the earlier steps twice.
                </p>
              </div>
            </div>
          ) : null}
        </section>
      )}

      {isBusy || project.stage.startsWith("awaiting-") ? null : (
        <DecisionHistory gaps={gaps} proposals={proposals} />
      )}

      <section className="border-t border-white/10 pt-10">
        <p className={`${sectionLabel} mb-5`}>
          The papers behind this project
        </p>

        {papers.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No papers are attached yet.
          </p>
        ) : (
          <ul className="grid gap-2 md:grid-cols-2">
            {papers.map((paper) => (
              <li key={paper.documentId}>
                <Link
                  href={`/knowledge/${paper.documentId}`}
                  className="block border border-white/10 px-5 py-4 transition-colors hover:border-white/25"
                >
                  <span className="block font-display text-base leading-snug">
                    {paper.title}
                  </span>
                  <span className={`${microLabel} mt-2 block`}>
                    {paper.addedBy === "knowledge"
                      ? "from your knowledge base · checked in full"
                      : "found by search · summary only"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
