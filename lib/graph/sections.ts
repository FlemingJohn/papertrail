import type { TextBlock } from "../schemas/document";

export type SectionKind =
  | "front-matter"
  | "abstract"
  | "introduction"
  | "background"
  | "methods"
  | "results"
  | "discussion"
  | "conclusion"
  | "references"
  | "back-matter";

interface HeadingRule {
  kind: SectionKind;
  pattern: RegExp;
}

const headingRules: HeadingRule[] = [
  { kind: "abstract", pattern: /^abstract\b/i },
  { kind: "introduction", pattern: /^(\d+\.?\s*)?introduction\b/i },
  {
    kind: "background",
    pattern: /^(\d+\.?\s*)?(background|related work|prior work|literature)\b/i,
  },
  {
    kind: "methods",
    pattern:
      /^(\d+\.?\s*)?(methods?|materials and methods|methodology|experimental|model architecture|approach|implementation)\b/i,
  },
  {
    kind: "results",
    pattern:
      /^(\d+\.?\s*)?(results?|findings|experiments?|evaluation|training|analysis)\b/i,
  },
  { kind: "discussion", pattern: /^(\d+\.?\s*)?discussion\b/i },
  {
    kind: "conclusion",
    pattern: /^(\d+\.?\s*)?(conclusions?|summary|future work)\b/i,
  },
  {
    kind: "references",
    pattern: /^(references|bibliography|works cited|literature cited)\b/i,
  },
  {
    kind: "back-matter",
    pattern:
      /^(acknowledge?ments?|funding|author contributions|conflicts? of interest|competing interests|supplementary|appendix|declaration)/i,
  },
];

export interface IndexedBlock {
  index: number;
  block: TextBlock;
  kind: SectionKind;
}

export function splitIntoSections(blocks: TextBlock[]): IndexedBlock[] {
  let currentKind: SectionKind = "front-matter";

  return blocks.map((block, index) => {
    if (block.role === "sectionHeading" || block.role === "title") {
      const heading = block.text.trim();
      const matched = headingRules.find((rule) => rule.pattern.test(heading));

      if (matched !== undefined) {
        currentKind = matched.kind;
      }
    }

    return { index, block, kind: currentKind };
  });
}

export function selectKinds(
  indexed: IndexedBlock[],
  kinds: readonly SectionKind[]
): IndexedBlock[] {
  return indexed.filter((entry) => kinds.includes(entry.kind));
}

export const kindsForClaims: readonly SectionKind[] = [
  "front-matter",
  "abstract",
  "introduction",
  "background",
  "methods",
  "results",
  "discussion",
  "conclusion",
];

export const kindsForNumbers: readonly SectionKind[] = [
  "abstract",
  "results",
  "discussion",
  "conclusion",
];

export const kindsForMethods: readonly SectionKind[] = ["methods"];

export function summariseSections(indexed: IndexedBlock[]): string {
  const counts = new Map<SectionKind, number>();

  for (const entry of indexed) {
    counts.set(entry.kind, (counts.get(entry.kind) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([kind, count]) => `${kind} ${count}`)
    .join(", ");
}
