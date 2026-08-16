export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function escapeHtmlKeepingCitations(
  value: string,
  labelByKey: ReadonlyMap<string, string>
): string {
  const parts = value.split(/(\[[A-Za-z0-9:_,\s-]+\])/g);

  return parts
    .map((part) => {
      const match = /^\[([A-Za-z0-9:_,\s-]+)\]$/.exec(part);

      if (match === null) {
        return escapeHtml(part);
      }

      const labels = match[1]
        .split(",")
        .map((key) => labelByKey.get(key.trim()))
        .filter((label): label is string => label !== undefined);

      if (labels.length === 0) {
        return '<span class="removed">[unverified citation removed]</span>';
      }

      return `<span class="citation">[${escapeHtml(labels.join(", "))}]</span>`;
    })
    .join("");
}
