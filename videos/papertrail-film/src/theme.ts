export const theme = {
  ground: "#121212",
  raised: "#181818",
  ink: "#fafafa",
  muted: "#a1a1a1",
  faint: "#6b6b6b",
  rule: "rgba(255,255,255,0.12)",
  accent: "#2563eb",
  good: "#22c55e",
  warn: "#eab308",
  bad: "#ef4444",
  serif: "Georgia, 'Times New Roman', serif",
  sans: "-apple-system, 'Segoe UI', Roboto, sans-serif",
  mono: "ui-monospace, 'Cascadia Mono', Menlo, Consolas, monospace",
} as const;

export const fps = 30;

export const beats = {
  hook: { from: 0, to: 3.4 },
  problem: { from: 3.4, to: 54.8 },
  whatItDoes: { from: 54.8, to: 80.6 },
  architecture: { from: 80.6, to: 168.4 },
  demo: { from: 168.4, to: 423.8 },
  proof: { from: 423.8, to: 465.8 },
  close: { from: 465.8, to: 478.6 },
} as const;

export const seconds = (value: number) => Math.round(value * fps);
