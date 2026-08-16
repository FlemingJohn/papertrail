import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Frame, Display } from "../components/Frame";
import { theme } from "../theme";

export const Hook: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <Frame eyebrow="PaperTrail">
      <Display size={92}>Every claim, traced.</Display>
      <div
        style={{
          fontFamily: theme.mono,
          fontSize: 24,
          letterSpacing: 4,
          color: theme.muted,
          marginTop: 40,
          opacity: interpolate(frame, [30, 55], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        FLEMING JOHN
      </div>
    </Frame>
  );
};
