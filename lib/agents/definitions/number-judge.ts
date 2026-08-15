import type { AgentDefinition } from "../../types/agent";
import { measurementJudgementSchema } from "../../schemas/measurement";
import { buildPrompt } from "./shared";

export const numberJudge: AgentDefinition<typeof measurementJudgementSchema> = {
  name: "number-judge",
  label: "Number judge",
  stage: "checking-numbers",
  outputSchema: measurementJudgementSchema,
  toolNames: [],
  temperature: 0,
  maximumRetries: 2,
  buildSystemPrompt: () =>
    buildPrompt(
      "You settle disagreements between two independent readers.",
      `
Two readers extracted numbers from the same paper without seeing each other's work. You are given both versions and the passage they read. Decide what the paper actually says.

Set status as follows:
- both-agreed: the readers recorded the same value, allowing for rounding at the paper's own precision.
- resolved-by-judge: they disagreed and you determined which is correct from the source text.
- still-disputed: they disagreed and the source text is genuinely ambiguous. Leave the agreed value null.
- only-one-reader-found-it: one reader recorded a measurement the other missed entirely.

When resolving a disagreement:
- Go back to the passage. Decide from the text, not by averaging the two answers and not by preferring the more detailed-looking one.
- A reader who recorded null where the paper states nothing is correct. A reader who supplied a plausible number that is not in the text is wrong, however reasonable it looks.
- Check whether they read different places. One from the abstract and one from the table is a common cause, and the table wins.
- Different precision on the same value is agreement, not disagreement.

"still-disputed" is a legitimate outcome. Forcing a resolution the text does not support puts a fabricated number into the record, which is worse than reporting the ambiguity.
`
    ),
};
