import type { RunEvent } from "../types/stream";
import { runAgent } from "../agents/run-agent";
import { methodDesigner } from "../agents/definitions/method-designer";
import { flushProjectToolCalls } from "../tools/tool-log";
import { EventStream, streamWhileRunning } from "./event-stream";
import { SpendTracker } from "./spend-tracker";
import {
  addProjectSpend,
  listProposals,
  readProjectReports,
  recordMethod,
  setProjectStage,
} from "./store";

export interface MethodInput {
  projectId: string;
  question: string;
}

export function runMethod(input: MethodInput): AsyncGenerator<RunEvent> {
  const stream = new EventStream();

  return streamWhileRunning(stream, async () => {
    const proposals = await listProposals(input.projectId);
    const chosen = proposals.find(
      (proposal) => proposal.decision === "accepted"
    );

    if (chosen === undefined) {
      throw new Error(
        "No proposal has been chosen, so there is no plan to design. Go back and choose one."
      );
    }

    const tracker = new SpendTracker(stream);
    const reports = await readProjectReports(input.projectId);

    stream.emit({
      type: "stage-changed",
      stage: "designing-method",
      label: "Designing the test",
      completedStages: 0,
      totalStages: 1,
    });

    await setProjectStage(input.projectId, "designing-method", "running");

    const methodOutcome = await runAgent(methodDesigner, {
      runIdentifier: input.projectId,
      subject: chosen.title,
      userPrompt: [
        `Research question: ${input.question}`,
        "",
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
        "What the search for existing work found:",
        chosen.priorArt.length === 0
          ? "Nothing overlapping was returned."
          : chosen.priorArt
              .map(
                (entry) =>
                  `- ${entry.title} (${entry.publicationYear ?? "year unknown"}): ${entry.overlap}`
              )
              .join("\n"),
        "",
        "Methods used by the papers behind this project:",
        reports
          .map((report) =>
            report.methodProtocol === null
              ? null
              : `- ${report.paperTitle}: ${report.methodProtocol.steps
                  .map((step) => step.action)
                  .join("; ")}`
          )
          .filter((line): line is string => line !== null)
          .join("\n") ||
          "None of these papers has a recorded protocol, so no established procedure is available to follow.",
      ].join("\n"),
      writer: stream,
    });

    if (!methodOutcome.successful) {
      await setProjectStage(input.projectId, "designing-method", "failed");
      throw new Error(
        `The plan could not be designed: ${methodOutcome.failure.message}`
      );
    }

    tracker.add(
      methodOutcome.value.tokensIn,
      methodOutcome.value.tokensOut,
      methodOutcome.value.cachedTokensIn
    );

    const method = methodOutcome.value.output;
    await recordMethod(chosen.proposalId, method);
    await addProjectSpend(input.projectId, tracker.dollars());
    await flushProjectToolCalls(input.projectId);
    await setProjectStage(
      input.projectId,
      "awaiting-method-decision",
      "waiting"
    );

    stream.emit({
      type: "activity",
      level: method.isCostVerified ? "success" : "warning",
      message: method.isCostVerified
        ? "The cost estimate is carried from a paper that reported it"
        : "The cost estimate is unverified",
      detail: method.estimatedCost,
    });

    stream.emit({
      type: "project-gate",
      projectId: input.projectId,
      stage: "awaiting-method-decision",
      heading: "Your turn",
      message:
        "Read the steps and the falsifying result. Nothing is written until you approve this plan.",
    });

    stream.emit({
      type: "project-finished",
      projectId: input.projectId,
      stage: "awaiting-method-decision",
      draftId: null,
    });
  });
}
