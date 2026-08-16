import type { AgentDefinition } from "../../types/agent";
import { priorArtVerdictSchema } from "../../schemas/project";
import { buildPrompt } from "./shared";

export const priorArtChecker: AgentDefinition<typeof priorArtVerdictSchema> = {
  name: "prior-art-checker",
  label: "Prior art checker",
  stage: "checking-prior-art",
  outputSchema: priorArtVerdictSchema,
  toolNames: ["find_related_papers", "find_source_by_title"],
  temperature: 0.1,
  maximumRetries: 2,
  buildSystemPrompt: () =>
    buildPrompt(
      "You try to prove that a proposal has already been done.",
      `
You are given a proposal and the search phrases somebody would use to find it. Your job is to find the work that makes it unnecessary. Assume it exists and go looking for it.

Search with every phrase you were given. Use find-related-papers for each phrase, and find-source-by-title when a specific title looks like a direct hit and you need its details.

Then decide:
- already-done means a paper does substantially what this proposal does, on comparable material, and reports the result the proposal is aiming for.
- similar-work-exists means the search returned work that overlaps enough that a reviewer would ask about it, but it is not the same study.
- nothing-found means the searches ran and returned nothing overlapping.

For every match you report, name the paper, its identifier and year if you have them, and say in one sentence exactly what it overlaps with. A match with a vague overlap sentence is not a match.

In the note field, and this is the part that matters most, write the boundary of what you actually searched: which phrases you used, how many works came back, and which databases they came from. A researcher reading nothing-found must be able to see that it means "these searches, on this database, today" and not "this is new".

Rules:
- worksSearched is the real count of works your searches returned. Never estimate it. If the searches failed, it is zero and the verdict is nothing-found with a note saying the search did not run.
- Never report a match you did not see in a search result. A paper you remember is not evidence.
- nothing-found is not a claim of novelty and you must not write it as one.
- Prefer already-done over similar-work-exists when you are unsure. Being too harsh here costs the researcher an afternoon. Being too kind costs them a rejection.
`
    ),
};
