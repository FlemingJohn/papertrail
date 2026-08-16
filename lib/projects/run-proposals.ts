import type { RunEvent } from "../types/stream";
import { runAgent } from "../agents/run-agent";
import { noveltyMaker } from "../agents/definitions/novelty-maker";
import { priorArtChecker } from "../agents/definitions/prior-art-checker";
import { flushProjectToolCalls } from "../tools/tool-log";
import { EventStream, streamWhileRunning } from "./event-stream";
import { SpendTracker } from "./spend-tracker";
import {
  addProjectSpend,
  listGaps,
  listProjectPapers,
  listProposals,
  readProjectReports,
  recordPriorArt,
  replaceProposals,
  setProjectStage,
} from "./store";

export interface ProposalInput {
  projectId: string;
  question: string;
}

export function runProposals(input: ProposalInput): AsyncGenerator<RunEvent> {
  const stream = new EventStream();

  return streamWhileRunning(stream, async () => {
    const gaps = await listGaps(input.projectId);
    const accepted = gaps.filter((gap) => gap.decision === "accepted");

    if (accepted.length === 0) {
      throw new Error(
        "No gap was accepted, so there is nothing to build a proposal on. Go back and accept at least one."
      );
    }

    const tracker = new SpendTracker(stream);
    const papers = await listProjectPapers(input.projectId);
    const reports = await readProjectReports(input.projectId);

    stream.emit({
      type: "stage-changed",
      stage: "proposing",
      label: "Making proposals",
      completedStages: 0,
      totalStages: 2,
    });

    await setProjectStage(input.projectId, "proposing", "running");

    const proposalOutcome = await runAgent(noveltyMaker, {
      runIdentifier: input.projectId,
      subject: "the accepted gaps",
      userPrompt: [
        `Research question: ${input.question}`,
        "",
        "Gaps the researcher accepted:",
        accepted
          .map(
            (gap) =>
              `- ${gap.headline} (support: ${gap.support})\n  Evidence: ${gap.evidence}`
          )
          .join("\n"),
        "",
        "Gaps the researcher rejected, which you must not build on:",
        gaps
          .filter((gap) => gap.decision === "rejected")
          .map((gap) => `- ${gap.headline}`)
          .join("\n") || "- None were rejected.",
        "",
        "Papers behind this project:",
        papers.map((paper) => `- ${paper.title}`).join("\n"),
        "",
        "Disagreements found while checking these papers:",
        reports
          .flatMap((report) => report.conflicts)
          .map((conflict) => `- ${conflict.question}`)
          .join("\n") || "- None were recorded.",
      ].join("\n"),
      writer: stream,
    });

    if (!proposalOutcome.successful) {
      await setProjectStage(input.projectId, "proposing", "failed");
      throw new Error(
        `No proposal could be made: ${proposalOutcome.failure.message}`
      );
    }

    tracker.add(
      proposalOutcome.value.tokensIn,
      proposalOutcome.value.tokensOut,
      proposalOutcome.value.cachedTokensIn
    );

    const drafted = proposalOutcome.value.output.proposals;

    if (drafted.length === 0) {
      await setProjectStage(input.projectId, "proposing", "failed");
      throw new Error(
        "No proposal came out of the accepted gaps. The gaps may be too broad to build something testable on."
      );
    }

    const proposalIds = await replaceProposals(input.projectId, drafted);

    stream.emit({
      type: "stage-changed",
      stage: "checking-prior-art",
      label: "Checking whether it already exists",
      completedStages: 1,
      totalStages: 2,
    });

    await setProjectStage(input.projectId, "checking-prior-art", "running");

    for (let index = 0; index < drafted.length; index += 1) {
      const proposal = drafted[index];
      const proposalId = proposalIds[index];

      if (proposalId === undefined) {
        continue;
      }

      const priorArtOutcome = await runAgent(priorArtChecker, {
        runIdentifier: input.projectId,
        subject: proposal.title,
        userPrompt: [
          `Proposal: ${proposal.title}`,
          "",
          proposal.summary,
          "",
          "What it rests on:",
          proposal.components
            .map(
              (component) =>
                `- ${component.statement} (${component.support}, traces to ${component.tracesTo})`
            )
            .join("\n"),
          "",
          "Search with these phrases:",
          proposal.searchPhrases.map((phrase) => `- ${phrase}`).join("\n"),
        ].join("\n"),
        writer: stream,
      });

      if (!priorArtOutcome.successful) {
        stream.emit({
          type: "activity",
          level: "warning",
          message: `The search for existing work did not finish for "${proposal.title}"`,
          detail: `${priorArtOutcome.failure.message} This proposal is unchecked, not new.`,
        });
        continue;
      }

      tracker.add(
        priorArtOutcome.value.tokensIn,
        priorArtOutcome.value.tokensOut,
        priorArtOutcome.value.cachedTokensIn
      );

      const verdict = priorArtOutcome.value.output;
      await recordPriorArt(proposalId, verdict);

      stream.emit({
        type: "activity",
        level:
          verdict.verdict === "already-done"
            ? "problem"
            : verdict.verdict === "similar-work-exists"
              ? "warning"
              : "success",
        message:
          verdict.verdict === "already-done"
            ? `Already done: ${proposal.title}`
            : verdict.verdict === "similar-work-exists"
              ? `Close work exists: ${proposal.title}`
              : `Nothing overlapping found: ${proposal.title}`,
        detail: `${verdict.worksSearched} works were searched. ${verdict.note}`,
      });
    }

    await addProjectSpend(input.projectId, tracker.dollars());
    await flushProjectToolCalls(input.projectId);
    await setProjectStage(
      input.projectId,
      "awaiting-proposal-decision",
      "waiting"
    );

    const stored = await listProposals(input.projectId);
    const survivors = stored.filter(
      (proposal) => proposal.noveltyVerdict !== "already-done"
    );

    stream.emit({
      type: "project-gate",
      projectId: input.projectId,
      stage: "awaiting-proposal-decision",
      heading: "Your turn",
      message:
        survivors.length === 0
          ? "Every proposal already exists in the literature. That is a real answer, and it saved the work. Go back to the gaps and pick a different one."
          : `${stored.length} proposals were made and searched for. Choose the one to take forward, or reject all of them.`,
    });

    stream.emit({
      type: "project-finished",
      projectId: input.projectId,
      stage: "awaiting-proposal-decision",
      draftId: null,
    });
  });
}
