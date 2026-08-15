import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { ZodObject, ZodRawShape } from "zod";
import { allTools } from "../lib/tools/registry";
import { describeFailure } from "../lib/types/failure";

const server = new McpServer({
  name: "papertrail",
  version: "0.1.0",
});

for (const registered of allTools) {
  if (!registered.availableToAgents) {
    continue;
  }

  const shape = (registered.inputSchema as ZodObject<ZodRawShape>).shape;

  server.registerTool(
    registered.name,
    {
      title: registered.name.replace(/_/g, " "),
      description: registered.description,
      inputSchema: shape,
    },
    async (input) => {
      const outcome = await registered.run(input, {
        runIdentifier: null,
        nodeName: "mcp",
        agentName: null,
      });

      if (outcome.successful) {
        return {
          content: [
            { type: "text", text: JSON.stringify(outcome.value, null, 2) },
          ],
        };
      }

      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `${describeFailure(outcome.failure)} ${outcome.failure.message}`,
          },
        ],
      };
    }
  );
}

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error: unknown) => {
  process.stderr.write(
    `PaperTrail MCP server failed to start: ${error instanceof Error ? error.message : String(error)}\n`
  );
  process.exit(1);
});
