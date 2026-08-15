import { tool } from "@langchain/core/tools";
import type { StructuredToolInterface } from "@langchain/core/tools";
import type { ToolContext } from "../types/tool";
import { getToolsByName } from "../tools/registry";

export function buildLangChainTools(
  toolNames: readonly string[],
  context: ToolContext
): StructuredToolInterface[] {
  return getToolsByName(toolNames).map((registered) =>
    tool(
      async (input: unknown) => {
        const outcome = await registered.run(input, context);

        if (outcome.successful) {
          return JSON.stringify(outcome.value);
        }

        return JSON.stringify({
          toolFailed: true,
          reason: outcome.failure.code,
          message: outcome.failure.message,
          guidance:
            "This lookup did not succeed. Do not invent a result. Record what you could not verify and continue.",
        });
      },
      {
        name: registered.name,
        description: registered.description,
        schema: registered.inputSchema,
      }
    )
  );
}
