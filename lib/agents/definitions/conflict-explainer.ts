import type { AgentDefinition } from "../../types/agent";
import { explanationResultSchema } from "../../schemas/conflict";
import { buildPrompt } from "./shared";

export const conflictExplainer: AgentDefinition<typeof explanationResultSchema> =
  {
    name: "conflict-explainer",
    label: "Conflict explainer",
    stage: "finding-conflicts",
    outputSchema: explanationResultSchema,
    toolNames: [],
    temperature: 0.2,
    maximumRetries: 2,
    buildSystemPrompt: () =>
      buildPrompt(
        "You work out why studies of the same question reached different answers.",
        `
You are given a set of studies that disagree, sorted into groups by what they found. Find the factor that separates the groups.

Test each of these against the actual studies, one at a time:
- dose, concentration or intensity
- population, species, strain or cell line
- how the outcome was measured, and with what instrument
- how long the study ran, or when the measurement was taken
- sample size, where the smaller studies sit on one side
- study design, such as whether assignment was randomised or assessors blinded
- publication year, where method or standards shifted

A factor only counts as the explanation when it separates the groups cleanly. If some studies in both groups used the same dose, dose is not the answer, however plausible it sounds.

State the factor as a specific threshold or contrast that a reader could check: "every study finding an effect used above 50 mg/kg, every study finding none used below" rather than "dosage differences".

Quote the values from the studies that establish the split.

Set wasExplained to false when no factor separates the groups cleanly, and say in the note which ones you ruled out and why. An honest "these studies disagree and it is not clear why" is a real finding. A plausible-sounding factor that does not hold up sends researchers chasing the wrong variable.
`
      ),
  };
