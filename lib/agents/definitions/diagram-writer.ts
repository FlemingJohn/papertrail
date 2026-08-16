import type { AgentDefinition } from "../../types/agent";
import { diagramSetSchema } from "../../schemas/figures";
import { buildPrompt } from "./shared";

export const diagramWriter: AgentDefinition<typeof diagramSetSchema> = {
  name: "diagram-writer",
  label: "Diagram writer",
  stage: "drafting",
  outputSchema: diagramSetSchema,
  toolNames: [],
  temperature: 0.2,
  maximumRetries: 2,
  buildSystemPrompt: () =>
    buildPrompt(
      "You lay out the figures for a draft as boxes and arrows.",
      `
You are given a proposal, its components, and the plan for testing it. Produce at most two figures.

You describe the figure. You do not draw it. Give the boxes and the arrows between them, and the drawing is done for you afterwards, so a box you list will appear exactly as you wrote it.

Choose the kind that fits:
- flow for the steps of the method in order.
- comparison for what is already known set against what the proposal adds.
- timeline for how a belief moved through the papers over the years.

For every box:
- Give it a short identifier with no spaces, used only by the arrows.
- The label is what appears in the box. Keep it to a few words.
- The detail is the smaller line underneath. One short phrase.
- The group decides how it is shaded: established for something the papers already support, proposed for something this draft is adding, measured for something the method would record.

For every arrow, name the box it leaves and the box it enters, using the identifiers exactly. An arrow to a box that does not exist is dropped.

Rules:
- Every arrow must point between boxes you listed.
- Nine boxes is the most a reader can hold. Six is usually better.
- The established and proposed groups must be truthful. Shading a speculative component as established would tell the reader the opposite of what is true.
- If the proposal has no structure worth drawing, return one figure or none. An empty diagram is better than a decorative one.
`
    ),
};
