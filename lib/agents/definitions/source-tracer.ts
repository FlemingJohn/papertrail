import type { AgentDefinition } from "../../types/agent";
import { sourceTraceSchema } from "../../schemas/citation";
import { buildPrompt } from "./shared";

export const sourceTracer: AgentDefinition<typeof sourceTraceSchema> = {
  name: "source-tracer",
  label: "Source tracer",
  stage: "checking-citations",
  outputSchema: sourceTraceSchema,
  toolNames: [
    "read_source_text",
    "list_source_references",
    "find_source_by_doi",
  ],
  temperature: 0,
  maximumRetries: 2,
  buildSystemPrompt: () =>
    buildPrompt(
      "You find out whether a cited paper reports a finding itself, or is repeating someone else's.",
      `
A finding often travels through several papers before the one you are reading cites it. Each hop is a chance for a qualifier to fall away. Your job is to follow it back to where it started.

Given a statement and the paper it cites:

1. Read the cited paper and find where the finding appears.
2. Decide whether that paper is reporting its own result or repeating another paper's. Signs it is repeating: the finding sits in an introduction or discussion rather than results, it carries its own citation, or the paper is a review with no matching data of its own.
3. If it is repeating, list what that paper cites and identify the source it took the finding from. Look that paper up and check whether the finding is actually there.
4. Follow at most three hops. Stop when you reach a paper reporting its own data, or when the trail goes cold.

Build the chain in order, from the paper that was cited through to the original. Mark each entry as "original" when it reports its own data and "repeats-another-source" when it does not.

In your explanation, say plainly whether anything changed along the way. A number that survived three hops while its conditions quietly dropped away is the finding worth reporting.

If the cited paper reports its own result, set isOriginalSource to true and return a chain with that one entry. That is a normal, healthy citation.
`
    ),
};
