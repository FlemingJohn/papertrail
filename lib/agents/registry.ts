import { changeFinder } from "./definitions/change-finder";
import { changeRater } from "./definitions/change-rater";
import { claimFinder } from "./definitions/claim-finder";
import { confidenceRater } from "./definitions/confidence-rater";
import { conflictExplainer } from "./definitions/conflict-explainer";
import { conflictFinder } from "./definitions/conflict-finder";
import { methodChecker } from "./definitions/method-checker";
import { methodWriter } from "./definitions/method-writer";
import { numberJudge } from "./definitions/number-judge";
import { numberReaderOne } from "./definitions/number-reader-one";
import { numberReaderTwo } from "./definitions/number-reader-two";
import { paperPicker } from "./definitions/paper-picker";
import { reportWriter } from "./definitions/report-writer";
import { reviewEvidence } from "./definitions/review-evidence";
import { reviewMethod } from "./definitions/review-method";
import { reviewOriginality } from "./definitions/review-originality";
import { reviewStatistics } from "./definitions/review-statistics";
import { reviewSummary } from "./definitions/review-summary";
import { searchPlanner } from "./definitions/search-planner";
import { sourceChallenger } from "./definitions/source-challenger";
import { sourceFinder } from "./definitions/source-finder";
import { sourceJudge } from "./definitions/source-judge";
import { sourceSupporter } from "./definitions/source-supporter";
import { sourceTracer } from "./definitions/source-tracer";

export const agents = {
  claimFinder,
  searchPlanner,
  paperPicker,
  sourceFinder,
  sourceChallenger,
  sourceSupporter,
  sourceJudge,
  sourceTracer,
  numberReaderOne,
  numberReaderTwo,
  numberJudge,
  methodWriter,
  methodChecker,
  conflictFinder,
  conflictExplainer,
  reviewStatistics,
  reviewOriginality,
  reviewMethod,
  reviewEvidence,
  reviewSummary,
  confidenceRater,
  reportWriter,
  changeFinder,
  changeRater,
} as const;

export const agentCount = Object.keys(agents).length;

export const agentLabels: Record<string, string> = Object.fromEntries(
  Object.values(agents).map((agent) => [agent.name, agent.label])
);

export function getAgentLabel(name: string): string {
  return agentLabels[name] ?? name;
}
