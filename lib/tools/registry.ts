import type { RegisteredTool } from "../types/tool";
import { readDocument } from "./azure/read-document";
import { checkRetraction } from "./external/check-retraction";
import { findRelatedPapers } from "./external/find-related-papers";
import { findSourceByDoi } from "./external/find-source-by-doi";
import { findSourceByTitle } from "./external/find-source-by-title";
import { listSourceReferences } from "./external/list-source-references";
import { readSourceText } from "./external/read-source-text";

export const allTools: readonly RegisteredTool[] = [
  readDocument,
  findSourceByDoi,
  findSourceByTitle,
  checkRetraction,
  readSourceText,
  listSourceReferences,
  findRelatedPapers,
] as readonly RegisteredTool[];

const toolsByName = new Map<string, RegisteredTool>(
  allTools.map((tool) => [tool.name, tool])
);

export function getToolByName(name: string): RegisteredTool | null {
  return toolsByName.get(name) ?? null;
}

export function getToolsByName(names: readonly string[]): RegisteredTool[] {
  const selected: RegisteredTool[] = [];

  for (const name of names) {
    const tool = toolsByName.get(name);

    if (tool === undefined) {
      throw new Error(
        `Unknown tool "${name}". Available tools: ${[...toolsByName.keys()].join(", ")}`
      );
    }

    selected.push(tool);
  }

  return selected;
}

export function getAgentAvailableTools(): RegisteredTool[] {
  return allTools.filter((tool) => tool.availableToAgents);
}

export const toolLabels: Record<string, string> = {
  read_document: "Reading the PDF",
  find_source_by_doi: "Looking up source by DOI",
  find_source_by_title: "Searching for source by title",
  check_retraction: "Checking retraction status",
  read_source_text: "Reading the cited paper",
  list_source_references: "Listing what the source cites",
  find_related_papers: "Searching for related papers",
};

export function getToolLabel(name: string): string {
  return toolLabels[name] ?? name;
}
