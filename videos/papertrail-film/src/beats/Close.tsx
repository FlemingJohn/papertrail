import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Frame, Display } from "../components/Frame";
import { theme } from "../theme";

export const Close: React.FC = () => {
  const frame = useCurrentFrame();

  const details = interpolate(frame, [60, 100], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <Frame eyebrow="PaperTrail">
      <Display size={70}>
        Thirty-two agents that check whether a paper holds up, and then help you
        write one that does.
      </Display>

      <div style={{ display: "flex", gap: 80, marginTop: 58, opacity: details }}>
        <div>
          <div
            style={{
              fontFamily: theme.mono,
              fontSize: 17,
              letterSpacing: 5,
              color: theme.faint,
              marginBottom: 14,
            }}
          >
            SIGN IN AND TRY IT
          </div>
          <div style={{ fontFamily: theme.mono, fontSize: 30, color: theme.ink }}>
            judge@papertrail.app
          </div>
          <div
            style={{
              fontFamily: theme.mono,
              fontSize: 30,
              color: theme.ink,
              marginTop: 8,
            }}
          >
            PaperTrail2026
          </div>
        </div>

        <div>
          <div
            style={{
              fontFamily: theme.mono,
              fontSize: 17,
              letterSpacing: 5,
              color: theme.faint,
              marginBottom: 14,
            }}
          >
            THE CODE
          </div>
          <div style={{ fontFamily: theme.mono, fontSize: 26, color: theme.accent }}>
            github.com/FlemingJohn/papertrail
          </div>
          <div
            style={{
              fontFamily: theme.mono,
              fontSize: 18,
              color: theme.muted,
              marginTop: 12,
              letterSpacing: 2,
            }}
          >
            LANGGRAPH · GPT-4o · AZURE · NEXT.JS · SUPABASE
          </div>
        </div>
      </div>
    </Frame>
  );
};
