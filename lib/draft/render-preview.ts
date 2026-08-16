import type { DiagramSpec, TableSpec } from "../schemas/figures";
import type { DraftSections, ExcludedCitation } from "../schemas/project";
import type { BibliographyEntry } from "./build-bibliography";
import { escapeHtml, escapeHtmlKeepingCitations } from "./escape-html";
import { renderDiagramSvg } from "./render-svg";

export interface PreviewInput {
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

export function renderPreviewHtml(input: PreviewInput): string {
  const labelByKey = new Map(
    input.entries.map((entry, index) => [entry.citationKey, String(index + 1)])
  );

  const write = (value: string): string =>
    escapeHtmlKeepingCitations(value, labelByKey)
      .split(/\n{2,}/)
      .map((paragraph) => `<p>${paragraph.replace(/\n/g, " ")}</p>`)
      .join("");

  const parts: string[] = [
    `<header class="draft-head">`,
    `<h1>${escapeHtml(input.title)}</h1>`,
    `<p class="byline">${escapeHtml(input.authorName)}</p>`,
    `</header>`,
    `<section class="abstract"><h2>Abstract</h2>${write(input.sections.abstract)}</section>`,
    `<section><h2>The question</h2>${write(input.question)}</section>`,
    `<section><h2>What is already established</h2>${write(input.sections.whatIsEstablished)}</section>`,
  ];

  if (input.tables[0] !== undefined) {
    parts.push(renderTable(input.tables[0], 1));
  }

  parts.push(
    `<section><h2>Where the evidence disagrees</h2>${write(input.sections.whatIsContested)}</section>`
  );

  if (input.tables[1] !== undefined) {
    parts.push(renderTable(input.tables[1], 2));
  }

  parts.push(
    `<section><h2>The proposal</h2>${write(input.sections.theProposal)}</section>`
  );

  if (input.diagrams[0] !== undefined) {
    parts.push(renderFigure(input.diagrams[0], 1));
  }

  if (input.tables[2] !== undefined) {
    parts.push(renderTable(input.tables[2], 3));
  }

  parts.push(
    `<section><h2>How it would be tested</h2>${write(input.sections.howItWouldBeTested)}</section>`
  );

  if (input.diagrams[1] !== undefined) {
    parts.push(renderFigure(input.diagrams[1], 2));
  }

  parts.push(
    `<section><h2>What could go wrong</h2>${write(input.sections.threats)}</section>`,
    renderLimits(input),
    renderReferences(input.entries)
  );

  return parts.join("");
}

function renderTable(spec: TableSpec, number: number): string {
  const header = spec.columns
    .map((column) => `<th>${escapeHtml(column)}</th>`)
    .join("");

  const body = spec.rows
    .map((row) => {
      const cells: string[] = [];

      for (let index = 0; index < spec.columns.length; index += 1) {
        const value = row[index];
        cells.push(
          `<td>${
            value === undefined || value.trim().length === 0
              ? '<span class="missing">not reported</span>'
              : escapeHtml(value)
          }</td>`
        );
      }

      return `<tr>${cells.join("")}</tr>`;
    })
    .join("");

  const footnote =
    spec.footnote.trim().length === 0
      ? ""
      : `<p class="footnote">${escapeHtml(spec.footnote)}</p>`;

  return [
    '<figure class="table-block">',
    `<figcaption>Table ${number}. ${escapeHtml(spec.caption)}</figcaption>`,
    "<div class=\"table-scroll\">",
    `<table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table>`,
    "</div>",
    footnote,
    "</figure>",
  ].join("");
}

function renderFigure(spec: DiagramSpec, number: number): string {
  const svg = renderDiagramSvg(spec);

  if (svg.length === 0) {
    return "";
  }

  return [
    '<figure class="diagram-block">',
    svg,
    `<figcaption>Figure ${number}. ${escapeHtml(spec.caption)}</figcaption>`,
    "</figure>",
  ].join("");
}

function renderLimits(input: PreviewInput): string {
  const excluded =
    input.excludedCitations.length === 0
      ? "<p>Every source behind this draft survived checking.</p>"
      : [
          `<p>The following ${input.excludedCitations.length === 1 ? "source was" : "sources were"} deliberately left out of the bibliography:</p>`,
          "<ul>",
          ...input.excludedCitations.map(
            (entry) =>
              `<li><span class="excluded-name">${escapeHtml(entry.reference)}</span> — ${escapeHtml(entry.reason)}</li>`
          ),
          "</ul>",
        ].join("");

  return [
    '<section class="limits">',
    "<h2>Limits of the search behind this draft</h2>",
    `<p>This draft was written from ${input.entries.length} ${input.entries.length === 1 ? "source" : "sources"} whose citations were checked against the cited text. The search for existing work covered ${input.worksSearched} ${input.worksSearched === 1 ? "work" : "works"}. ${escapeHtml(input.priorArtNote)}</p>`,
    excluded,
    "</section>",
  ].join("");
}

function renderReferences(entries: readonly BibliographyEntry[]): string {
  if (entries.length === 0) {
    return [
      '<section class="references">',
      "<h2>References</h2>",
      "<p>No citation in this draft survived checking, so the bibliography is empty.</p>",
      "</section>",
    ].join("");
  }

  const items = entries
    .map((entry, index) => {
      const authors =
        entry.authors.length === 0
          ? "Unknown"
          : entry.authors.slice(0, 4).join(", ") +
            (entry.authors.length > 4 ? ", and others" : "");

      const year =
        entry.publicationYear === null ? "n.d." : String(entry.publicationYear);

      const identifier =
        entry.digitalObjectIdentifier === null
          ? ""
          : ` <span class="doi">${escapeHtml(entry.digitalObjectIdentifier)}</span>`;

      return `<li><span class="marker">[${index + 1}]</span> ${escapeHtml(authors)} (${escapeHtml(year)}). ${escapeHtml(entry.title)}.${identifier}</li>`;
    })
    .join("");

  return [
    '<section class="references">',
    "<h2>References</h2>",
    `<ol class="reference-list">${items}</ol>`,
    "</section>",
  ].join("");
}
