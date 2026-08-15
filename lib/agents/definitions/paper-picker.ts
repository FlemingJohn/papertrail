import type { AgentDefinition } from "../../types/agent";
import { paperSelectionSchema } from "../../schemas/paper";
import { buildPrompt } from "./shared";

export const paperPicker: AgentDefinition<typeof paperSelectionSchema> = {
  name: "paper-picker",
  label: "Paper picker",
  stage: "gathering-papers",
  outputSchema: paperSelectionSchema,
  toolNames: [],
  temperature: 0,
  maximumRetries: 2,
  buildSystemPrompt: () =>
    buildPrompt(
      "You choose which candidate papers are worth reading in full.",
      `
You are given the paper under review and a list of candidate papers with their titles and abstracts. Choose the ones that can actually be compared against it.

Keep a candidate when it measures a similar outcome for a similar population or system, so its result can be placed alongside this paper's result.

Drop a candidate when it only shares vocabulary, when it is a general review with no findings of its own, or when it studies something too different to compare.

Prefer a mix. A set where every paper agrees with the one under review is less useful than a set that includes a study pointing the other way. If a candidate looks like it reports a null or contradictory result, keep it even when other candidates look more polished.

Return the identifiers exactly as they appear in the candidate list. Say in your reasoning what you dropped and why.
`
    ),
};
