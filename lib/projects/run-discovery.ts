import type { RunEvent } from "../types/stream";
import type { Report } from "../schemas/report";
import { runAgent } from "../agents/run-agent";
import { evidenceMapper } from "../agents/definitions/evidence-mapper";
import { gapFinder } from "../agents/definitions/gap-finder";
import { EventStream, streamWhileRunning } from "./event-stream";
import { gatherPapers, type GatheredPaper } from "./gather-papers";
import { SpendTracker } from "./spend-tracker";
import {
  addProjectSpend,
  listProjectPapers,
  readProjectReports,
  replaceGaps,
  setProjectStage,
} from "./store";

export interface DiscoveryInput {
  projectId: string;
  question: string;
  paperTarget: number;
}

export function runDiscovery(input: DiscoveryInput): AsyncGenerator<RunEvent> {
  const stream = new EventStream();

  return streamWhileRunning(stream, async () => {
    stream.emit({
      type: "project-started",
      projectId: input.projectId,
      question: input.question,
    });

    stream.emit({
      type: "stage-changed",
      stage: "gathering-papers",
      label: "Finding papers",
      completedStages: 0,
      totalStages: 3,
    });

    await setProjectStage(input.projectId, "finding-papers", "running");

    const gathered = await gatherPapers({
      projectId: input.projectId,
      question: input.question,
      paperTarget: input.paperTarget,
      writer: stream,
    });

    if (gathered.papers.length === 0) {
      await setProjectStage(input.projectId, "finding-papers", "failed");
      throw new Error(
        "The search found no papers with readable summaries for this question. Try wording it the way a database search would be worded."
      );
    }

    stream.emit({
      type: "activity",
      level: gathered.retractedCount > 0 ? "problem" : "success",
      message: `${gathered.papers.length} papers kept`,
      detail:
        gathered.retractedCount === 0
          ? "None of them is recorded as retracted."
          : `${gathered.retractedCount} retracted ${gathered.retractedCount === 1 ? "paper was" : "papers were"} left out before any reading happened.`,
    });

    const tracker = new SpendTracker(stream);
    const reports = await readProjectReports(input.projectId);
    const knowledgeBasePapers = (
      await listProjectPapers(input.projectId)
    ).filter((paper) => paper.addedBy === "knowledge");

    stream.emit({
      type: "stage-changed",
      stage: "mapping-evidence",
      label: "Mapping what is settled",
      completedStages: 1,
      totalStages: 3,
    });

    await setProjectStage(input.projectId, "mapping-evidence", "running");

    const mapOutcome = await runAgent(evidenceMapper, {
      runIdentifier: input.projectId,
      subject: "these papers",
      userPrompt: describePapers(input.question, gathered.papers, reports),
      writer: stream,
    });

    if (!mapOutcome.successful) {
      await setProjectStage(input.projectId, "mapping-evidence", "failed");
      throw new Error(
        `The papers could not be mapped: ${mapOutcome.failure.message}`
      );
    }

    tracker.add(
      mapOutcome.value.tokensIn,
      mapOutcome.value.tokensOut,
      mapOutcome.value.cachedTokensIn
    );

    const evidenceMap = mapOutcome.value.output;

    stream.emit({
      type: "stage-changed",
      stage: "finding-gaps",
      label: "Finding what is missing",
      completedStages: 2,
      totalStages: 3,
    });

    await setProjectStage(input.projectId, "finding-gaps", "running");

    const conflicts = reports.flatMap((report) => report.conflicts);
    const failedChecks = reports.flatMap((report) =>
      report.citationChecks
        .filter(
          (check) =>
            check.judgement.verdict !== "supported" &&
            check.judgement.verdict !== "partly-supported"
        )
        .map(
          (check) =>
            `${check.marker} ${check.judgement.verdict}: ${check.judgement.reasoning}`
        )
    );

    const gapOutcome = await runAgent(gapFinder, {
      runIdentifier: input.projectId,
      subject: "this set of papers",
      userPrompt: [
        `Research question: ${input.question}`,
        `Papers in this set: ${gathered.papers.length}${
          knowledgeBasePapers.length === 0
            ? ""
            : `, of which ${knowledgeBasePapers.length} were checked in full`
        }`,
        "",
        "What these papers have settled:",
        evidenceMap.established
          .map(
            (belief) =>
              `- ${belief.claim} (${belief.paperCount} papers say this, ${belief.verifiedCount} survived checking, agreement is ${belief.strength})`
          )
          .join("\n") || "- Nothing was settled across these papers.",
        "",
        `Note from the mapping: ${evidenceMap.note}`,
        "",
        "Open disagreements found in the checked papers:",
        conflicts
          .map((conflict) => `- ${conflict.question}`)
          .join("\n") || "- None were recorded.",
        "",
        "Statements that failed their citation check:",
        failedChecks.slice(0, 20).join("\n") || "- None were recorded.",
        "",
        "Paper summaries:",
        gathered.papers
          .map(
            (paper) =>
              `- ${paper.title} (${paper.publicationYear ?? "year unknown"}): ${paper.abstract.slice(0, 700)}`
          )
          .join("\n"),
      ].join("\n"),
      writer: stream,
    });

    if (!gapOutcome.successful) {
      await setProjectStage(input.projectId, "finding-gaps", "failed");
      throw new Error(
        `The gaps could not be worked out: ${gapOutcome.failure.message}`
      );
    }

    tracker.add(
      gapOutcome.value.tokensIn,
      gapOutcome.value.tokensOut,
      gapOutcome.value.cachedTokensIn
    );

    await replaceGaps(input.projectId, gapOutcome.value.output.gaps);
    await addProjectSpend(input.projectId, tracker.dollars());
    await setProjectStage(input.projectId, "awaiting-gap-decision", "waiting");

    stream.emit({
      type: "project-gate",
      projectId: input.projectId,
      stage: "awaiting-gap-decision",
      heading: "Your turn",
      message:
        gapOutcome.value.output.gaps.length === 0
          ? "No genuine gap came out of these papers. Read the note, then either widen the question or add papers of your own."
          : `${gapOutcome.value.output.gaps.length} openings came out of these papers. Nothing goes further until you decide which of them are real.`,
    });

    stream.emit({
      type: "project-finished",
      projectId: input.projectId,
      stage: "awaiting-gap-decision",
      draftId: null,
    });
  });
}

function describePapers(
  question: string,
  papers: readonly GatheredPaper[],
  reports: readonly Report[]
): string {
  const checkedStatements = reports.flatMap((report) =>
    report.citationChecks.map(
      (check) =>
        `- [${report.paperTitle}] ${check.marker} was checked and came back ${check.judgement.verdict}: ${check.judgement.reasoning}`
    )
  );

  return [
    `Research question: ${question}`,
    "",
    "Papers:",
    papers
      .map(
        (paper, index) =>
          `${index + 1}. ${paper.title} (${paper.publicationYear ?? "year unknown"})\n${paper.abstract.slice(0, 1400)}`
      )
      .join("\n\n"),
    "",
    "Statements from these papers that were already checked against their sources:",
    checkedStatements.slice(0, 40).join("\n") ||
      "None of these papers has been checked in full yet, so no verdicts are available.",
  ].join("\n");
}
