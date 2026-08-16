import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Frame } from "../components/Frame";
import { theme } from "../theme";

const points = [
  { at: 40, title: "Citations drift", body: "A qualifier falls off, the number survives." },
  { at: 150, title: "Sources get retracted", body: "Nobody tells the people who already cited them." },
  { at: 330, title: "Numbers get transcribed wrong", body: "Almost nobody extracts them twice." },
  { at: 560, title: "Methods omit what you would need", body: "Not maliciously. They are simply assumed." },
];

export const Problem: React.FC = () => {
  const frame = useCurrentFrame();

  const cost = interpolate(frame, [1180, 1230], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <Frame eyebrow="The problem">
      <div style={{ display: "flex", flexDirection: "column", gap: 34, maxWidth: 1500 }}>
        {points.map((point) => {
          const appear = interpolate(frame, [point.at, point.at + 26], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          return (
            <div
              key={point.title}
              style={{
                opacity: appear,
                translate: interpolate(
                  frame,
                  [point.at, point.at + 26],
                  ["0px 22px", "0px 0px"],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                ),
                borderTop: `1px solid ${theme.rule}`,
                paddingTop: 20,
              }}
            >
              <div style={{ fontFamily: theme.serif, fontSize: 46, marginBottom: 8 }}>
                {point.title}
              </div>
              <div style={{ fontSize: 27, color: theme.muted }}>{point.body}</div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 54,
          opacity: cost,
          scale: interpolate(frame, [1180, 1230], [0.94, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            output: "perceptual-scale",
          }),
        }}
      >
        <span style={{ fontFamily: theme.serif, fontSize: 74, color: theme.warn }}>
          Twenty minutes
        </span>
        <span style={{ fontSize: 30, color: theme.muted, marginLeft: 20 }}>
          per citation. So it never gets done.
        </span>
      </div>
    </Frame>
  );
};
