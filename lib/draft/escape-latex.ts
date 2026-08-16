const replacements: ReadonlyArray<readonly [RegExp, string]> = [
  [/\\/g, "\\textbackslash{}"],
  [/&/g, "\\&"],
  [/%/g, "\\%"],
  [/\$/g, "\\$"],
  [/#/g, "\\#"],
  [/_/g, "\\_"],
  [/\{/g, "\\{"],
  [/\}/g, "\\}"],
  [/~/g, "\\textasciitilde{}"],
  [/\^/g, "\\textasciicircum{}"],
];

export function escapeLatex(value: string): string {
  let escaped = value;

  for (const [pattern, replacement] of replacements) {
    escaped = escaped.replace(pattern, replacement);
  }

  return escaped;
}

export interface CitationRewriteResult {
  text: string;
  removedKeys: string[];
}

export function escapeLatexKeepingCitations(
  value: string,
  allowedKeys: ReadonlySet<string>
): CitationRewriteResult {
  const parts = value.split(/(\[[A-Za-z0-9:_,\s-]+\])/g);
  const removedKeys: string[] = [];

  const text = parts
    .map((part) => {
      const match = /^\[([A-Za-z0-9:_,\s-]+)\]$/.exec(part);

      if (match === null) {
        return escapeLatex(part);
      }

      const keys = match[1]
        .split(",")
        .map((key) => key.trim())
        .filter((key) => key.length > 0);

      const kept = keys.filter((key) => allowedKeys.has(key));
      const dropped = keys.filter((key) => !allowedKeys.has(key));

      removedKeys.push(...dropped);

      if (kept.length === 0) {
        return "\\textbf{[unverified citation removed]}";
      }

      return `\\cite{${kept.join(",")}}`;
    })
    .join("");

  return { text, removedKeys };
}
