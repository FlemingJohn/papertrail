import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Frame } from "../components/Frame";
import { theme } from "../theme";

const jobs = [
  {
    at: 30,
    number: "01",
    title: "Check a paper you already have",
    body: "Which claims hold up, which do not, and which it could not check at all.",
    tone: theme.accent,
  },
  {
    at: 250,
    number: "02",
    title: "Start from a question you have not answered",
    body: "It reads the field, finds what nobody has settled, and helps you draft.",
    tone: theme.warn,
  },
];

export const WhatItDoes: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <Frame eyebrow="Two jobs">
      <div style={{ display: "flex", gap: 70, maxWidth: 1560 }}>
        {jobs.map((job) => {
          const appear = interpolate(frame, [job.at, job.at + 28], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          return (
            <div
              key={job.number}
              style={{
                flex: 1,
                opacity: appear,
                translate: interpolate(
                  frame,
                  [job.at, job.at + 28],
                  ["0px 26px", "0px 0px"],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                ),
                borderTop: `2px solid ${job.tone}`,
                paddingTop: 26,
              }}
            >
              <div
                style={{
                  fontFamily: theme.mono,
                  fontSize: 20,
                  letterSpacing: 6,
                  color: job.tone,
                  marginBottom: 18,
                }}
              >
                {job.number}
              </div>
              <div
                style={{
                  fontFamily: theme.serif,
                  fontSize: 46,
                  lineHeight: 1.18,
                  marginBottom: 18,
                }}
              >
                {job.title}
              </div>
              <div style={{ fontSize: 27, color: theme.muted, lineHeight: 1.5 }}>
                {job.body}
              </div>
            </div>
          );
        })}
      </div>
    </Frame>
  );
};
