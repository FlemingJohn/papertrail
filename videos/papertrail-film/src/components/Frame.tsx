import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";

export const Frame: React.FC<{
  eyebrow?: string;
  children: React.ReactNode;
}> = ({ eyebrow, children }) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.ground,
        color: theme.ink,
        fontFamily: theme.sans,
        padding: "96px 120px",
        justifyContent: "center",
      }}
    >
      {eyebrow === undefined ? null : (
        <div
          style={{
            fontFamily: theme.mono,
            fontSize: 20,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: theme.muted,
            marginBottom: 34,
            opacity: interpolate(frame, [0, 18], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          {eyebrow}
        </div>
      )}

      {children}

      <div
        style={{
          position: "absolute",
          left: 120,
          bottom: 84,
          height: 2,
          backgroundColor: theme.accent,
          width: interpolate(frame, [10, 46], [0, 240], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />
    </AbsoluteFill>
  );
};

export const Display: React.FC<{
  children: React.ReactNode;
  delay?: number;
  size?: number;
}> = ({ children, delay = 0, size = 76 }) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        fontFamily: theme.serif,
        fontStyle: "italic",
        fontSize: size,
        lineHeight: 1.16,
        maxWidth: 1400,
        textWrap: "balance",
        opacity: interpolate(frame, [delay, delay + 22], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        translate: interpolate(
          frame,
          [delay, delay + 26],
          ["0px 26px", "0px 0px"],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }
        ),
      }}
    >
      {children}
    </div>
  );
};
