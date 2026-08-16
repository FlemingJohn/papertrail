import React from "react";
import { CalculateMetadataFunction, Composition, staticFile } from "remotion";
import { Film, type FilmProps } from "./Film";
import { fps, seconds } from "./theme";

const calculateMetadata: CalculateMetadataFunction<FilmProps> = async () => {
  const response = await fetch(staticFile("film.json"));
  const data = (await response.json()) as FilmProps;

  return {
    props: data,
    durationInFrames: seconds(data.narrationSeconds + 1.5),
  };
};

export const PaperTrailFilm: React.FC = () => {
  return (
    <Composition
      id="PaperTrailFilm"
      component={Film}
      durationInFrames={seconds(480)}
      fps={fps}
      width={1920}
      height={1080}
      defaultProps={{ clips: [], narrationSeconds: 478.6 }}
      calculateMetadata={calculateMetadata}
    />
  );
};
