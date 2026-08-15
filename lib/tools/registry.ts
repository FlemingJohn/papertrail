import type { RegisteredTool } from "../types/tool";
import { readDocument } from "./azure/read-document";
import { checkRetraction } from "./external/check-retraction";
import { findRelatedPapers } from "./external/find-related-papers";
import { findSourceByDoi } from "./external/find-source-by-doi";
import { findSourceByTitle } from "./external/find-source-by-title";
import { listSourceReferences } from "./external/list-source-references";
import { readSourceText } from "./external/read-source-text";
import { upsertDocument } from "./database/upsert-document";
import { finishRunRecord, startRunRecord } from "./database/save-run";
import { saveReport } from "./database/save-report";
import { findRecentReports } from "./database/find-recent-reports";
import { saveWatch, stopWatch } from "./database/save-watch";
import { findDueWatches, listWatches } from "./database/list-watches";
import { saveWatchCheck } from "./database/save-watch-check";
import { findWatchHistory } from "./database/find-watch-history";

export const allTools: readonly RegisteredTool[] = [
  readDocument,
  findSourceByDoi,
  findSourceByTitle,
  checkRetraction,
  readSourceText,
  listSourceReferences,
  findRelatedPapers,
  upsertDocument,
  startRunRecord,
  finishRunRecord,
  saveReport,
  findRecentReports,
  saveWatch,
  stopWatch,
  listWatches,
  findDueWatches,
  saveWatchCheck,
  findWatchHistory,
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
  database_upsert_document: "Recording the paper",
  database_start_run: "Starting the run record",
  database_finish_run: "Closing the run record",
  database_save_report: "Storing the report",
  database_find_recent_reports: "Reading earlier reports",
  database_save_watch: "Saving watch settings",
  database_stop_watch: "Removing the watch",
  database_list_watches: "Listing watched papers",
  database_find_due_watches: "Finding checks that are due",
  database_save_watch_check: "Storing the comparison",
  database_find_watch_history: "Reading the check history",
};

export function getToolLabel(name: string): string {
  return toolLabels[name] ?? name;
}
