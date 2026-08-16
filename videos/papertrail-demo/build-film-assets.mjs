import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { segments } from "./segments.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));

const captureDir = path.join(here, "capture");

const filmPublic = path.join(here, "..", "papertrail-film", "public");

function probeDuration(file) {
  const raw = execFileSync("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=nw=1:nk=1",
    file,
  ]);

  return Number.parseFloat(raw.toString().trim());
}

fs.mkdirSync(path.join(filmPublic, "clips"), { recursive: true });

const built = [];

for (const segment of segments) {
  const folder = path.join(captureDir, segment.id);
  const detailFile = path.join(folder, "segment.json");

  if (!fs.existsSync(detailFile)) {
    console.log(`  ${segment.id}: not recorded yet, skipping`);
    continue;
  }

  const detail = JSON.parse(fs.readFileSync(detailFile, "utf8"));
  const videoDir = path.join(folder, "video");

  const candidates = fs
    .readdirSync(videoDir)
    .filter((name) => name.endsWith(".webm"))
    .map((name) => {
      const file = path.join(videoDir, name);
      return { file, duration: probeDuration(file) };
    })
    .sort((first, second) => second.duration - first.duration);

  if (candidates.length === 0) {
    console.log(`  ${segment.id}: no video file, skipping`);
    continue;
  }

  const sourceFile = candidates[0].file;
  const sourceDuration = candidates[0].duration;
  const leadIn = Math.max(0, sourceDuration - detail.recordedSeconds);
  const outputFile = path.join(filmPublic, "clips", `${segment.id}.mp4`);

  execFileSync("ffmpeg", [
    "-y",
    "-ss",
    leadIn.toFixed(3),
    "-i",
    sourceFile,
    "-an",
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-crf",
    "18",
    "-preset",
    "medium",
    "-movflags",
    "+faststart",
    outputFile,
  ]);

  const clipDuration = probeDuration(outputFile);

  built.push({
    id: segment.id,
    file: `clips/${segment.id}.mp4`,
    startsAtSec: detail.startsAtSec,
    durationSec: Number(clipDuration.toFixed(3)),
  });

  console.log(
    `  ${segment.id}  starts ${detail.startsAtSec.toFixed(1)}s  ${clipDuration.toFixed(1)}s  (trimmed ${leadIn.toFixed(1)}s lead-in)`
  );
}

fs.copyFileSync(
  path.join(here, "narration.mp3"),
  path.join(filmPublic, "narration.mp3")
);

fs.copyFileSync(
  path.join(here, "captions.json"),
  path.join(filmPublic, "captions.json")
);

fs.copyFileSync(
  path.join(here, "..", "..", "docs", "architecture.svg"),
  path.join(filmPublic, "architecture.svg")
);

const captions = JSON.parse(
  fs.readFileSync(path.join(here, "captions.json"), "utf8")
);

const narrationSeconds = captions[captions.length - 1].endMs / 1000;

fs.writeFileSync(
  path.join(filmPublic, "film.json"),
  `${JSON.stringify(
    {
      narrationSeconds: Number(narrationSeconds.toFixed(3)),
      clips: built,
    },
    null,
    2
  )}\n`
);

console.log(`\nnarration ${narrationSeconds.toFixed(1)}s · ${built.length} clips ready`);
