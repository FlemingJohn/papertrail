# The demo film

Two folders. The first records the product, the second composes the film around it.

Nothing here is faked. The screen recording is the real application, signed in with
the judge account, reading the real database.

## What is in the repository, and what is not

Committed: every script, the narration script, the voiced audio, the word timings,
and the cue sheet.

Ignored: `capture/` (111 MB of raw recordings and screenshots), `public/clips/`
(25 MB of trimmed clips) and the rendered film. All three are rebuilt by the steps
below, so there is no reason to carry them.

## Rebuilding it

The application must be running on `localhost:3000` with the seeded project in the
database, because the recorder films whatever is really there.

```bash
cd videos/papertrail-demo
npm install
npx playwright install chromium

python generate-narration.py   # voice the script, emit word-level timings
node build-cues.mjs            # anchor each demo action to a phrase in the voice
node record-segment.mjs        # record all seven segments
node build-film-assets.mjs     # trim each take and copy it into the film

cd ../papertrail-film
npm install
npx remotion studio            # preview
npx remotion render PaperTrailFilm out/papertrail-demo.mp4 --concurrency=4
```

`record-segment.mjs` takes an optional filter, so a single segment can be
re-shot without touching the others:

```bash
node record-segment.mjs 03-report
```

## Why the voice is generated first

The cursor has to arrive as the narrator describes the click, not after it. Voicing
the script first gives every word a timestamp; the recorder then holds each action
until its phrase is due and starts moving 700ms early, the way a hand does.

Recording first and narrating afterwards, which is the more obvious order, leaves
the two free to drift apart.

## Why it is recorded in segments

A single take is four minutes, and lateness accumulates: one slow page load throws
off everything after it. Each segment starts fresh at its own cue time, so a
mistake costs twenty seconds and only that segment is re-shot.
