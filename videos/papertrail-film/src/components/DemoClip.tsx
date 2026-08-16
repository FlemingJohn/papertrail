import React from "react";
import { AbsoluteFill, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Video } from "@remotion/media";
import { theme } from "../theme";

export const DemoClip: React.FC<{
  file: string;
  durationInFrames: number;
  zoom?: number;
}> = ({ file, durationInFrames, zoom = 1.04 }) => {
  const frame = useCurrentFrame();

  const fadeIn = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const fadeOut = interpolate(
    frame,
    [durationInFrames - 12, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: theme.ground }}>
      <AbsoluteFill
        style={{
          opacity: Math.min(fadeIn, fadeOut),
          scale: interpolate(frame, [0, durationInFrames], [1, zoom], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            output: "perceptual-scale",
          }),
        }}
      >
        <Video src={staticFile(file)} style={{ width: "100%", height: "100%" }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
