import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Frame } from "../components/Frame";
import { theme } from "../theme";

const rows = [
  { at: 120, kind: "Real retractions", score: "3 of 3", tone: theme.good },
  { at: 170, kind: "Fabricated identifiers", score: "2 of 2", tone: theme.good },
  { at: 220, kind: "Genuine citations", score: "3 of 4", tone: theme.warn },
  { at: 270, kind: "Mismatched claims", score: "3 of 3", tone: theme.good },
];

export const Proof: React.FC = () => {
  const frame = useCurrentFrame();

  const total = interpolate(frame, [360, 400], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const costIn = interpolate(frame, [900, 950], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <Frame eyebrow="Does it work">
      <div style={{ display: "flex", gap: 90, alignItems: "flex-start" }}>
        <div style={{ flex: 1, maxWidth: 860 }}>
          {rows.map((row) => (
            <div
              key={row.kind}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                borderBottom: `1px solid ${theme.rule}`,
                padding: "18px 0",
                opacity: interpolate(frame, [row.at, row.at + 22], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              <span style={{ fontSize: 30 }}>{row.kind}</span>
              <span
                style={{
                  fontFamily: theme.mono,
                  fontSize: 28,
                  color: row.tone,
                }}
              >
                {row.score}
              </span>
            </div>
          ))}

          <div
            style={{
              marginTop: 40,
              opacity: total,
              scale: interpolate(frame, [360, 400], [0.86, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                output: "perceptual-scale",
              }),
            }}
          >
            <span style={{ fontFamily: theme.serif, fontSize: 108 }}>11</span>
            <span style={{ fontSize: 40, color: theme.muted }}> of 12 correct</span>
          </div>

          <div style={{ fontSize: 25, color: theme.muted, marginTop: 14, opacity: total }}>
            The one it missed said “could not check” rather than guessing.
          </div>
        </div>

        <div style={{ width: 520, opacity: costIn }}>
          <div
            style={{
              borderLeft: `2px solid ${theme.accent}`,
              paddingLeft: 28,
              marginBottom: 44,
            }}
          >
            <div style={{ fontFamily: theme.serif, fontSize: 68 }}>$0.14</div>
            <div style={{ fontSize: 24, color: theme.muted, marginTop: 6 }}>
              to run the whole evaluation
            </div>
          </div>

          <div style={{ borderLeft: `2px solid ${theme.good}`, paddingLeft: 28 }}>
            <div style={{ fontFamily: theme.serif, fontSize: 68 }}>$0.13</div>
            <div style={{ fontSize: 24, color: theme.muted, marginTop: 6 }}>
              a question taken all the way to a draft
            </div>
          </div>
        </div>
      </div>
    </Frame>
  );
};
