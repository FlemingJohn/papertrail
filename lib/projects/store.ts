import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { getDatabase } from "../database/client";
import {
  documents,
  projectDrafts,
  projectGaps,
  projectPapers,
  projectProposals,
  projects,
  reports,
} from "../database/schema";
import type { Report } from "../schemas/report";
import type {
  Decision,
  ExcludedCitation,
  Gap,
  PriorArtEntry,
  PriorArtVerdict,
  Proposal,
  ProjectStage,
  ProposalComponent,
  ProposalMethod,
  ResearchDomain,
} from "../schemas/project";

export interface ProjectRecord {
  projectId: string;
  question: string;
  domain: string;
  paperTarget: number;
  stage: string;
  status: string;
  costDollars: number;
  createdAt: string;
}

export interface ProjectPaperRecord {
  documentId: string;
  title: string;
  digitalObjectIdentifier: string | null;
  addedBy: string;
  reportId: string | null;
}

export interface ProjectGapRecord {
  gapId: string;
  position: number;
  headline: string;
  evidence: string;
  support: string;
  decision: string;
}

export interface ProjectProposalRecord {
  proposalId: string;
  position: number;
  title: string;
  summary: string;
  components: ProposalComponent[];
  noveltyVerdict: string;
  worksSearched: number;
  priorArt: PriorArtEntry[];
  priorArtNote: string | null;
  method: ProposalMethod | null;
  decision: string;
}

export interface ProjectDraftRecord {
  draftId: string;
  proposalId: string | null;
  authorName: string;
  title: string;
  latex: string;
  bibtex: string;
  previewHtml: string;
  excludedCitations: ExcludedCitation[];
  figureCount: number;
  tableCount: number;
  createdAt: string;
}

export async function createProject(input: {
  question: string;
  domain: ResearchDomain;
  paperTarget: number;
}): Promise<string> {
  const database = getDatabase();

  const [created] = await database
    .insert(projects)
    .values({
      question: input.question,
      domain: input.domain,
      paperTarget: input.paperTarget,
      stage: "finding-papers",
      status: "running",
    })
    .returning({ id: projects.id });

  return created.id;
}

export async function listProjects(): Promise<ProjectRecord[]> {
  const database = getDatabase();

  const rows = await database
    .select()
    .from(projects)
    .orderBy(desc(projects.createdAt))
    .limit(50);

  return rows.map(toProjectRecord);
}

export async function readProject(
  projectId: string
): Promise<ProjectRecord | null> {
  const database = getDatabase();

  const [row] = await database
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  return row === undefined ? null : toProjectRecord(row);
}

export async function setProjectStage(
  projectId: string,
  stage: ProjectStage,
  status: "running" | "waiting" | "finished" | "failed"
): Promise<void> {
  const database = getDatabase();

  await database
    .update(projects)
    .set({ stage, status, updatedAt: new Date() })
    .where(eq(projects.id, projectId));
}

export async function addProjectSpend(
  projectId: string,
  dollars: number
): Promise<void> {
  const database = getDatabase();

  const [row] = await database
    .select({ costDollars: projects.costDollars })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (row === undefined) {
    return;
  }

  const total = Number(row.costDollars) + dollars;

  await database
    .update(projects)
    .set({ costDollars: total.toFixed(6), updatedAt: new Date() })
    .where(eq(projects.id, projectId));
}

export async function attachPaper(input: {
  projectId: string;
  documentId: string;
  reportId: string | null;
  addedBy: string;
}): Promise<void> {
  const database = getDatabase();

  await database
    .insert(projectPapers)
    .values({
      projectId: input.projectId,
      documentId: input.documentId,
      reportId: input.reportId,
      addedBy: input.addedBy,
    })
    .onConflictDoNothing();
}

export async function listProjectPapers(
  projectId: string
): Promise<ProjectPaperRecord[]> {
  const database = getDatabase();

  const rows = await database
    .select({
      documentId: documents.id,
      title: documents.title,
      digitalObjectIdentifier: documents.digitalObjectIdentifier,
      addedBy: projectPapers.addedBy,
      reportId: projectPapers.reportId,
    })
    .from(projectPapers)
    .innerJoin(documents, eq(documents.id, projectPapers.documentId))
    .where(eq(projectPapers.projectId, projectId))
    .orderBy(asc(projectPapers.addedAt));

  return rows;
}

export async function readProjectReports(
  projectId: string
): Promise<Report[]> {
  const database = getDatabase();

  const rows = await database
    .select({ reportId: projectPapers.reportId })
    .from(projectPapers)
    .where(eq(projectPapers.projectId, projectId));

  const reportIds = rows
    .map((row) => row.reportId)
    .filter((value): value is string => value !== null);

  if (reportIds.length === 0) {
    return [];
  }

  const found = await database
    .select({ payload: reports.payload })
    .from(reports)
    .where(inArray(reports.id, reportIds));

  return found.map((row) => row.payload);
}

export async function replaceGaps(
  projectId: string,
  gaps: readonly Gap[]
): Promise<void> {
  const database = getDatabase();

  await database.delete(projectGaps).where(eq(projectGaps.projectId, projectId));

  if (gaps.length === 0) {
    return;
  }

  await database.insert(projectGaps).values(
    gaps.map((gap, index) => ({
      projectId,
      position: index,
      headline: gap.headline,
      evidence: gap.evidence,
      support: gap.support,
    }))
  );
}

export async function listGaps(
  projectId: string
): Promise<ProjectGapRecord[]> {
  const database = getDatabase();

  const rows = await database
    .select()
    .from(projectGaps)
    .where(eq(projectGaps.projectId, projectId))
    .orderBy(asc(projectGaps.position));

  return rows.map((row) => ({
    gapId: row.id,
    position: row.position,
    headline: row.headline,
    evidence: row.evidence,
    support: row.support,
    decision: row.decision,
  }));
}

export async function recordGapDecisions(
  projectId: string,
  decisions: ReadonlyArray<{ gapId: string; decision: Decision }>
): Promise<void> {
  const database = getDatabase();
  const decidedAt = new Date();

  for (const entry of decisions) {
    await database
      .update(projectGaps)
      .set({ decision: entry.decision, decidedAt })
      .where(
        and(eq(projectGaps.id, entry.gapId), eq(projectGaps.projectId, projectId))
      );
  }
}

export async function replaceProposals(
  projectId: string,
  proposals: readonly Proposal[]
): Promise<string[]> {
  const database = getDatabase();

  await database
    .delete(projectProposals)
    .where(eq(projectProposals.projectId, projectId));

  if (proposals.length === 0) {
    return [];
  }

  const created = await database
    .insert(projectProposals)
    .values(
      proposals.map((proposal, index) => ({
        projectId,
        position: index,
        title: proposal.title,
        summary: proposal.summary,
        components: proposal.components,
      }))
    )
    .returning({ id: projectProposals.id });

  return created.map((row) => row.id);
}

export async function recordPriorArt(
  proposalId: string,
  verdict: PriorArtVerdict
): Promise<void> {
  const database = getDatabase();

  await database
    .update(projectProposals)
    .set({
      noveltyVerdict: verdict.verdict,
      worksSearched: verdict.worksSearched,
      priorArt: verdict.matches,
      priorArtNote: verdict.note,
    })
    .where(eq(projectProposals.id, proposalId));
}

export async function recordMethod(
  proposalId: string,
  method: ProposalMethod
): Promise<void> {
  const database = getDatabase();

  await database
    .update(projectProposals)
    .set({ method })
    .where(eq(projectProposals.id, proposalId));
}

export async function listProposals(
  projectId: string
): Promise<ProjectProposalRecord[]> {
  const database = getDatabase();

  const rows = await database
    .select()
    .from(projectProposals)
    .where(eq(projectProposals.projectId, projectId))
    .orderBy(asc(projectProposals.position));

  return rows.map((row) => ({
    proposalId: row.id,
    position: row.position,
    title: row.title,
    summary: row.summary,
    components: row.components,
    noveltyVerdict: row.noveltyVerdict,
    worksSearched: row.worksSearched,
    priorArt: row.priorArt,
    priorArtNote: row.priorArtNote,
    method: row.method ?? null,
    decision: row.decision,
  }));
}

export async function readProposal(
  proposalId: string
): Promise<ProjectProposalRecord | null> {
  const database = getDatabase();

  const [row] = await database
    .select()
    .from(projectProposals)
    .where(eq(projectProposals.id, proposalId))
    .limit(1);

  if (row === undefined) {
    return null;
  }

  return {
    proposalId: row.id,
    position: row.position,
    title: row.title,
    summary: row.summary,
    components: row.components,
    noveltyVerdict: row.noveltyVerdict,
    worksSearched: row.worksSearched,
    priorArt: row.priorArt,
    priorArtNote: row.priorArtNote,
    method: row.method ?? null,
    decision: row.decision,
  };
}

export async function chooseProposal(
  projectId: string,
  proposalId: string
): Promise<void> {
  const database = getDatabase();
  const decidedAt = new Date();

  await database
    .update(projectProposals)
    .set({ decision: "rejected", decidedAt })
    .where(eq(projectProposals.projectId, projectId));

  await database
    .update(projectProposals)
    .set({ decision: "accepted", decidedAt })
    .where(eq(projectProposals.id, proposalId));
}

export async function saveDraft(input: {
  projectId: string;
  proposalId: string | null;
  authorName: string;
  title: string;
  latex: string;
  bibtex: string;
  previewHtml: string;
  excludedCitations: ExcludedCitation[];
  figureCount: number;
  tableCount: number;
}): Promise<string> {
  const database = getDatabase();

  const [created] = await database
    .insert(projectDrafts)
    .values(input)
    .returning({ id: projectDrafts.id });

  return created.id;
}

export async function listDrafts(
  projectId: string
): Promise<ProjectDraftRecord[]> {
  const database = getDatabase();

  const rows = await database
    .select()
    .from(projectDrafts)
    .where(eq(projectDrafts.projectId, projectId))
    .orderBy(desc(projectDrafts.createdAt));

  return rows.map(toDraftRecord);
}

export async function readDraft(
  draftId: string
): Promise<ProjectDraftRecord | null> {
  const database = getDatabase();

  const [row] = await database
    .select()
    .from(projectDrafts)
    .where(eq(projectDrafts.id, draftId))
    .limit(1);

  return row === undefined ? null : toDraftRecord(row);
}

function toProjectRecord(row: typeof projects.$inferSelect): ProjectRecord {
  return {
    projectId: row.id,
    question: row.question,
    domain: row.domain,
    paperTarget: row.paperTarget,
    stage: row.stage,
    status: row.status,
    costDollars: Number(row.costDollars),
    createdAt: row.createdAt.toISOString(),
  };
}

function toDraftRecord(
  row: typeof projectDrafts.$inferSelect
): ProjectDraftRecord {
  return {
    draftId: row.id,
    proposalId: row.proposalId,
    authorName: row.authorName,
    title: row.title,
    latex: row.latex,
    bibtex: row.bibtex,
    previewHtml: row.previewHtml,
    excludedCitations: row.excludedCitations,
    figureCount: row.figureCount,
    tableCount: row.tableCount,
    createdAt: row.createdAt.toISOString(),
  };
}
