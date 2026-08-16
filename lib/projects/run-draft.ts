import type { RunEvent } from "../types/stream";
import { runAgent } from "../agents/run-agent";
import { diagramWriter } from "../agents/definitions/diagram-writer";
import { paperWriter } from "../agents/definitions/paper-writer";
import { tableWriter } from "../agents/definitions/table-writer";
import { buildBibliography } from "../draft/build-bibliography";
import { buildLatexDocument } from "../draft/build-latex";
import { renderPreviewHtml } from "../draft/render-preview";
import { collectSources } from "./collect-sources";
import { EventStream, streamWhileRunning } from "./event-stream";
import { SpendTracker } from "./spend-tracker";
import {
  addProjectSpend,
  listProjectPapers,
  listProposals,
  readProjectReports,
  saveDraft,
  setProjectStage,
} from "./store";

export interface DraftInput {
  projectId: string;
  question: string;
  authorName: string;
}

export function runDraft(input: DraftInput): AsyncGenerator<RunEvent> {
  const stream = new EventStream();

  return streamWhileRunning(stream, async () => {
    const proposals = await listProposals(input.projectId);
    const chosen = proposals.find(
      (proposal) => proposal.decision === "accepted"
    );

    if (chosen === undefined) {
      throw new Error(
        "No proposal has been chosen, so there is nothing to write up."
      );
    }

    if (chosen.method === null) {
      throw new Error(
        "The plan for testing this proposal has not been designed yet."
      );
    }

    const tracker = new SpendTracker(stream);
    const papers = await listProjectPapers(input.projectId);
    const reports = await readProjectReports(input.projectId);

    stream.emit({
      type: "stage-changed",
      stage: "drafting",
      label: "Building the bibliography",
      completedStages: 0,
      totalStages: 3,
    });

    await setProjectStage(input.projectId, "drafting", "running");

    const candidates = await collectSources({
      projectId: input.projectId,
      papers,
      reports,
    });

    const bibliography = buildBibliography(candidates);

    stream.emit({
      type: "activity",
      level: bibliography.excluded.length > 0 ? "warning" : "success",
      message: `${bibliography.entries.length} sources passed into the bibliography`,
      detail:
        bibliography.excluded.length === 0
          ? "Every source behind this draft survived checking."
          : `${bibliography.excluded.length} ${bibliography.excluded.length === 1 ? "source was" : "sources were"} left out because the check on ${bibliography.excluded.length === 1 ? "it" : "them"} did not hold.`,
    });

    const sourceList = bibliography.entries
      .map(
        (entry) =>
          `- [${entry.citationKey}] ${entry.title} (${entry.publicationYear ?? "year unknown"})`
      )
      .join("\n");

    const proposalDescription = [
      `Proposal: ${chosen.title}`,
      chosen.summary,
      "",
      "What it rests on:",
      chosen.components
        .map(
          (component) =>
            `- ${component.statement} (${component.support}, traces to ${component.tracesTo})`
        )
        .join("\n"),
      "",
      "Plan for testing it:",
      chosen.method.steps.map((step, index) => `${index + 1}. ${step}`).join("\n"),
      "",
      `What is measured: ${chosen.method.whatIsMeasured.join("; ")}`,
      `What would show it is wrong: ${chosen.method.whatWouldFalsifyIt}`,
    ].join("\n");

    stream.emit({
      type: "stage-changed",
      stage: "drafting",
      label: "Building tables and figures",
      completedStages: 1,
      totalStages: 3,
    });

    const [tableOutcome, diagramOutcome] = await Promise.all([
      runAgent(tableWriter, {
        runIdentifier: input.projectId,
        subject: chosen.title,
        userPrompt: [
          `Research question: ${input.question}`,
          "",
          proposalDescription,
          "",
          "Papers behind this project:",
          papers.map((paper) => `- ${paper.title}`).join("\n"),
          "",
          "Citation checks already carried out on these papers:",
          reports
            .flatMap((report) =>
              report.citationChecks.map(
                (check) =>
                  `- [${report.paperTitle}] ${check.marker} came back ${check.judgement.verdict}`
              )
            )
            .slice(0, 40)
            .join("\n") || "- None of these papers has been checked in full.",
          "",
          "Disagreements found between these papers:",
          reports
            .flatMap((report) => report.conflicts)
            .map((conflict) => `- ${conflict.question}`)
            .join("\n") || "- None were recorded.",
        ].join("\n"),
        writer: stream,
      }),
      runAgent(diagramWriter, {
        runIdentifier: input.projectId,
        subject: chosen.title,
        userPrompt: proposalDescription,
        writer: stream,
      }),
    ]);

    if (tableOutcome.successful) {
      tracker.add(
        tableOutcome.value.tokensIn,
        tableOutcome.value.tokensOut,
        tableOutcome.value.cachedTokensIn
      );
    }

    if (diagramOutcome.successful) {
      tracker.add(
        diagramOutcome.value.tokensIn,
        diagramOutcome.value.tokensOut,
        diagramOutcome.value.cachedTokensIn
      );
    }

    const tables = tableOutcome.successful
      ? tableOutcome.value.output.tables
      : [];
    const diagrams = diagramOutcome.successful
      ? diagramOutcome.value.output.diagrams
      : [];

    stream.emit({
      type: "stage-changed",
      stage: "drafting",
      label: "Writing the draft",
      completedStages: 2,
      totalStages: 3,
    });

    const writeOutcome = await runAgent(paperWriter, {
      runIdentifier: input.projectId,
      subject: chosen.title,
      userPrompt: [
        `Research question: ${input.question}`,
        "",
        proposalDescription,
        "",
        "The only sources you may cite, with the exact key to use for each:",
        sourceList || "There are no citable sources. Cite nothing.",
        "",
        "Sources deliberately left out of the bibliography, which you must not cite:",
        bibliography.excluded
          .map((excluded) => `- ${excluded.reference}: ${excluded.reason}`)
          .join("\n") || "- None.",
        "",
        "What the search for existing work covered:",
        `${chosen.worksSearched} works were searched. Verdict: ${chosen.noveltyVerdict}. ${chosen.priorArtNote ?? ""}`,
        "",
        "Overlapping work the search returned:",
        chosen.priorArt
          .map(
            (entry) =>
              `- ${entry.title} (${entry.publicationYear ?? "year unknown"}): ${entry.overlap}`
          )
          .join("\n") || "- None.",
        "",
        `Cost estimate for the plan: ${chosen.method.estimatedCost} (${chosen.method.isCostVerified ? "carried from a paper that reported it" : "unverified estimate"})`,
        "",
        "Write a citation as the key inside square brackets, for example [smith2020learning]. Use only keys from the list above.",
      ].join("\n"),
      writer: stream,
    });

    if (!writeOutcome.successful) {
      await setProjectStage(input.projectId, "drafting", "failed");
      throw new Error(
        `The draft could not be written: ${writeOutcome.failure.message}`
      );
    }

    tracker.add(
      writeOutcome.value.tokensIn,
      writeOutcome.value.tokensOut,
      writeOutcome.value.cachedTokensIn
    );

    const draftPayload = {
      title: chosen.title,
      authorName: input.authorName,
      question: input.question,
      sections: writeOutcome.value.output,
      tables,
      diagrams,
      entries: bibliography.entries,
      excludedCitations: bibliography.excluded,
      priorArtNote:
        chosen.priorArtNote ??
        "The search for existing work did not record what it covered.",
      worksSearched: chosen.worksSearched,
    };

    const document = buildLatexDocument(draftPayload);
    const previewHtml = renderPreviewHtml(draftPayload);

    if (document.removedCitationKeys.length > 0) {
      stream.emit({
        type: "activity",
        level: "problem",
        message: `${document.removedCitationKeys.length} invented ${document.removedCitationKeys.length === 1 ? "citation was" : "citations were"} removed from the draft`,
        detail: `The writer tried to cite ${document.removedCitationKeys.join(", ")}, which ${document.removedCitationKeys.length === 1 ? "is not" : "are not"} in the checked bibliography. Each one was replaced with a visible marker rather than left in place.`,
      });
    }

    const draftId = await saveDraft({
      projectId: input.projectId,
      proposalId: chosen.proposalId,
      authorName: input.authorName,
      title: chosen.title,
      latex: document.latex,
      bibtex: bibliography.bibtex,
      previewHtml,
      excludedCitations: bibliography.excluded,
      figureCount: diagrams.length,
      tableCount: tables.length,
    });

    await addProjectSpend(input.projectId, tracker.dollars());
    await setProjectStage(input.projectId, "finished", "finished");

    stream.emit({
      type: "project-finished",
      projectId: input.projectId,
      stage: "finished",
      draftId,
    });
  });
}
