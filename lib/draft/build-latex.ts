import type { DiagramSpec, TableSpec } from "../schemas/figures";
import type { DraftSections, ExcludedCitation } from "../schemas/project";
import type { BibliographyEntry } from "./build-bibliography";
import { escapeLatex, escapeLatexKeepingCitations } from "./escape-latex";
import { renderLatexTable } from "./render-table";
import { renderTikzFigure, tikzPreamble } from "./render-tikz";

export interface DraftInput {
  title: string;
  authorName: string;
  question: string;
  sections: DraftSections;
  tables: readonly TableSpec[];
  diagrams: readonly DiagramSpec[];
  entries: readonly BibliographyEntry[];
  excludedCitations: readonly ExcludedCitation[];
  priorArtNote: string;
  worksSearched: number;
}

export interface DraftOutput {
  latex: string;
  removedCitationKeys: string[];
}

export function buildLatexDocument(input: DraftInput): DraftOutput {
  const allowedKeys = new Set(input.entries.map((entry) => entry.citationKey));
  const removedCitationKeys: string[] = [];

  const write = (value: string): string => {
    const result = escapeLatexKeepingCitations(value, allowedKeys);
    removedCitationKeys.push(...result.removedKeys);
    return result.text;
  };

  const figures = input.diagrams.map((diagram, index) =>
    renderTikzFigure(diagram, `diagram${index + 1}`)
  );

  const tables = input.tables.map((table, index) =>
    renderLatexTable(table, `table${index + 1}`)
  );

  const body: string[] = [
    "\\begin{abstract}",
    write(input.sections.abstract),
    "\\end{abstract}",
    "",
    "\\section{The question}",
    write(input.question),
    "",
    "\\section{What is already established}",
    write(input.sections.whatIsEstablished),
  ];

  if (tables[0] !== undefined && tables[0].length > 0) {
    body.push("", tables[0]);
  }

  body.push(
    "",
    "\\section{Where the evidence disagrees}",
    write(input.sections.whatIsContested)
  );

  if (tables[1] !== undefined && tables[1].length > 0) {
    body.push("", tables[1]);
  }

  body.push("", "\\section{The proposal}", write(input.sections.theProposal));

  if (figures[0] !== undefined && figures[0].length > 0) {
    body.push("", figures[0]);
  }

  if (tables[2] !== undefined && tables[2].length > 0) {
    body.push("", tables[2]);
  }

  body.push(
    "",
    "\\section{How it would be tested}",
    write(input.sections.howItWouldBeTested)
  );

  if (figures[1] !== undefined && figures[1].length > 0) {
    body.push("", figures[1]);
  }

  body.push(
    "",
    "\\section{What could go wrong}",
    write(input.sections.threats),
    "",
    "\\section{Limits of the search behind this draft}",
    buildLimitsSection(input)
  );

  const preamble = [
    "\\documentclass[11pt]{article}",
    "\\usepackage[utf8]{inputenc}",
    "\\usepackage[T1]{fontenc}",
    "\\usepackage[margin=1in]{geometry}",
    "\\usepackage{booktabs}",
    "\\usepackage{xcolor}",
    "\\usepackage{hyperref}",
    "\\usepackage{abstract}",
    tikzPreamble,
    "",
    `\\title{${escapeLatex(input.title)}}`,
    `\\author{${escapeLatex(input.authorName)}}`,
    "\\date{\\today}",
  ].join("\n");

  const closing =
    input.entries.length === 0
      ? [
          "\\section*{References}",
          "No citation in this draft survived checking, so the bibliography is empty.",
        ].join("\n")
      : [
          "\\bibliographystyle{plain}",
          "\\bibliography{verified}",
        ].join("\n");

  const latex = [
    preamble,
    "",
    "\\begin{document}",
    "\\maketitle",
    "",
    body.join("\n"),
    "",
    closing,
    "",
    "\\end{document}",
    "",
  ].join("\n");

  return { latex, removedCitationKeys: [...new Set(removedCitationKeys)] };
}

function buildLimitsSection(input: DraftInput): string {
  const lines: string[] = [
    `This draft was written from ${input.entries.length} ${
      input.entries.length === 1 ? "source" : "sources"
    } whose citations were checked against the cited text. The search for existing work behind the proposal covered ${input.worksSearched} ${
      input.worksSearched === 1 ? "work" : "works"
    }. ${escapeLatex(input.priorArtNote)}`,
  ];

  if (input.excludedCitations.length > 0) {
    lines.push(
      "",
      `The following ${
        input.excludedCitations.length === 1 ? "source was" : "sources were"
      } deliberately left out of the bibliography:`,
      "",
      "\\begin{itemize}",
      ...input.excludedCitations.map(
        (excluded) =>
          `  \\item ${escapeLatex(excluded.reference)} --- ${escapeLatex(excluded.reason)}`
      ),
      "\\end{itemize}"
    );
  }

  return lines.join("\n");
}
