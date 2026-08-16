import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AbsoluteFill,
  Sequence,
  staticFile,
  useCurrentFrame,
  useDelayRender,
  useVideoConfig,
} from "remotion";
import type { Caption, TikTokPage } from "@remotion/captions";
import { createTikTokStyleCaptions } from "@remotion/captions";
import { theme } from "../theme";

const switchEveryMs = 1300;

const CaptionPage: React.FC<{ page: TikTokPage }> = ({ page }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const nowMs = (frame / fps) * 1000;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: 72,
      }}
    >
      <div
        style={{
          maxWidth: 1480,
          textAlign: "center",
          fontFamily: theme.sans,
          fontSize: 42,
          lineHeight: 1.3,
          whiteSpace: "pre",
          backgroundColor: "rgba(8,8,8,0.86)",
          border: `1px solid rgba(255,255,255,0.08)`,
          padding: "18px 36px",
          borderRadius: 5,
        }}
      >
        {page.tokens.map((token, index) => {
          const isSpoken = nowMs >= token.fromMs - page.startMs;

          return (
            <span
              key={`${token.fromMs}-${index}`}
              style={{ color: isSpoken ? theme.ink : theme.faint }}
            >
              {token.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const Captions: React.FC = () => {
  const { fps } = useVideoConfig();
  const [captions, setCaptions] = useState<Caption[] | null>(null);
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const [handle] = useState(() => delayRender());

  const load = useCallback(async () => {
    try {
      const response = await fetch(staticFile("captions.json"));
      setCaptions((await response.json()) as Caption[]);
      continueRender(handle);
    } catch (error) {
      cancelRender(error);
    }
  }, [continueRender, cancelRender, handle]);

  useEffect(() => {
    void load();
  }, [load]);

  const pages = useMemo(() => {
    if (captions === null) {
      return [];
    }

    return createTikTokStyleCaptions({
      captions,
      combineTokensWithinMilliseconds: switchEveryMs,
    }).pages;
  }, [captions]);

  if (captions === null) {
    return null;
  }

  return (
    <AbsoluteFill>
      {pages.map((page, index) => {
        const next = pages[index + 1] ?? null;
        const startFrame = (page.startMs / 1000) * fps;
        const endFrame = Math.min(
          next === null ? Infinity : (next.startMs / 1000) * fps,
          startFrame + (switchEveryMs / 1000) * fps
        );
        const durationInFrames = endFrame - startFrame;

        if (durationInFrames <= 0) {
          return null;
        }

        return (
          <Sequence
            key={page.startMs}
            from={Math.round(startFrame)}
            durationInFrames={Math.round(durationInFrames)}
          >
            <CaptionPage page={page} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
