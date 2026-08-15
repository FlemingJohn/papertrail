import { END, START, StateGraph } from "@langchain/langgraph";
import { runState } from "./state";
import { readPaper } from "./nodes/read-paper";
import { findClaims } from "./nodes/find-claims";
import { gatherPapers } from "./nodes/gather-papers";
import { checkCitations } from "./nodes/check-citations";
import { checkNumbers } from "./nodes/check-numbers";
import { checkMethods } from "./nodes/check-methods";
import { findConflicts } from "./nodes/find-conflicts";
import { reviewPaper } from "./nodes/review-paper";
import { writeReport } from "./nodes/write-report";

export function buildGraph() {
  return new StateGraph(runState)
    .addNode("read-paper", readPaper)
    .addNode("find-claims", findClaims)
    .addNode("gather-papers", gatherPapers)
    .addNode("check-citations", checkCitations)
    .addNode("check-numbers", checkNumbers)
    .addNode("check-methods", checkMethods)
    .addNode("find-conflicts", findConflicts)
    .addNode("review-paper", reviewPaper)
    .addNode("write-report", writeReport)

    .addEdge(START, "read-paper")
    .addEdge("read-paper", "find-claims")

    .addEdge("find-claims", "gather-papers")
    .addEdge("find-claims", "check-citations")
    .addEdge("find-claims", "check-numbers")
    .addEdge("find-claims", "check-methods")

    .addEdge("gather-papers", "find-conflicts")
    .addEdge("check-numbers", "find-conflicts")
    .addEdge("check-citations", "find-conflicts")
    .addEdge("check-methods", "find-conflicts")

    .addEdge("find-conflicts", "review-paper")

    .addEdge("review-paper", "write-report")
    .addEdge("write-report", END)

    .compile();
}
