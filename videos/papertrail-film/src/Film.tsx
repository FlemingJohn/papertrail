import React from "react";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import { beats, fps, seconds, theme } from "./theme";
import { Hook } from "./beats/Hook";
import { Problem } from "./beats/Problem";
import { WhatItDoes } from "./beats/WhatItDoes";
import { Architecture } from "./beats/Architecture";
import { Proof } from "./beats/Proof";
import { Close } from "./beats/Close";
import { DemoClip } from "./components/DemoClip";
import { Captions } from "./components/Captions";

export interface Clip {
  id: string;
  file: string;
  startsAtSec: number;
  durationSec: number;
}

export type FilmProps = {
  clips: Clip[];
  narrationSeconds: number;
  [key: string]: unknown;
};

const span = (beat: { from: number; to: number }) => ({
  from: seconds(beat.from),
  durationInFrames: seconds(beat.to - beat.from),
});

export const Film: React.FC<FilmProps> = ({ clips }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: theme.ground }}>
      <Audio src={staticFile("narration.mp3")} />

      <Sequence {...span(beats.hook)}>
        <Hook />
      </Sequence>

      <Sequence {...span(beats.problem)}>
        <Problem />
      </Sequence>

      <Sequence {...span(beats.whatItDoes)}>
        <WhatItDoes />
      </Sequence>

      <Sequence {...span(beats.architecture)}>
        <Architecture />
      </Sequence>

      {clips.map((clip) => (
        <Sequence
          key={clip.id}
          from={seconds(clip.startsAtSec)}
          durationInFrames={seconds(clip.durationSec)}
        >
          <DemoClip
            file={clip.file}
            durationInFrames={seconds(clip.durationSec)}
          />
        </Sequence>
      ))}

      <Sequence {...span(beats.proof)}>
        <Proof />
      </Sequence>

      <Sequence {...span(beats.close)}>
        <Close />
      </Sequence>

      <Captions />
    </AbsoluteFill>
  );
};

export const filmFps = fps;
