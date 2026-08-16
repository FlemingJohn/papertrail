import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { cuePlan } from "./cue-plan.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));

const captions = JSON.parse(
  fs.readFileSync(path.join(here, "captions.json"), "utf8")
);

function normalise(value) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const spokenWords = captions.map((caption) => normalise(caption.text));

function findPhrase(phrase) {
  const wanted = phrase
    .split(/\s+/)
    .map(normalise)
    .filter((word) => word.length > 0);

  if (wanted.length === 0) {
    return null;
  }

  for (let start = 0; start + wanted.length <= spokenWords.length; start += 1) {
    let matched = true;

    for (let offset = 0; offset < wanted.length; offset += 1) {
      if (spokenWords[start + offset] !== wanted[offset]) {
        matched = false;
        break;
      }
    }

    if (matched) {
      return {
        startMs: captions[start].startMs,
        endMs: captions[start + wanted.length - 1].endMs,
        wordIndex: start,
      };
    }
  }

  return null;
}

const cues = [];
const missing = [];

for (const entry of cuePlan) {
  const found = findPhrase(entry.phrase);

  if (found === null) {
    missing.push(entry);
    continue;
  }

  cues.push({
    id: entry.id,
    label: entry.label ?? null,
    phrase: entry.phrase,
    startMs: Math.round(found.startMs),
    endMs: Math.round(found.endMs),
  });
}

if (missing.length > 0) {
  console.error("These phrases are not in the narration, so they cannot be cued:");
  for (const entry of missing) {
    console.error(`  ${entry.id}: "${entry.phrase}"`);
  }
  console.error("Fix the phrase in cue-plan.mjs so it matches narration.txt exactly.");
  process.exit(1);
}

cues.sort((first, second) => first.startMs - second.startMs);

for (let index = 0; index < cues.length; index += 1) {
  const next = cues[index + 1];
  cues[index].windowMs = next === undefined ? null : next.startMs - cues[index].startMs;
}

const narrationEndMs = captions[captions.length - 1].endMs;

fs.writeFileSync(
  path.join(here, "cues.json"),
  `${JSON.stringify({ narrationEndMs: Math.round(narrationEndMs), cues }, null, 2)}\n`
);

const format = (ms) => {
  const total = Math.round(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};

console.log(`narration ends at ${format(narrationEndMs)}`);
console.log(`${cues.length} cues resolved:`);

for (const cue of cues) {
  const window = cue.windowMs === null ? "to the end" : `${(cue.windowMs / 1000).toFixed(1)}s`;
  console.log(`  ${format(cue.startMs)}  ${cue.id.padEnd(18)} window ${window}`);
}
