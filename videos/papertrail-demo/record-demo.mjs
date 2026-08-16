import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { installOverlay } from "./cursor-overlay.mjs";
import {
  draftIdentifier,
  judgeEmail,
  judgePassword,
  projectIdentifier,
} from "./cue-plan.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));

const baseUrl = process.env.DEMO_BASE_URL ?? "http://localhost:3000";

const leadMilliseconds = 700;

const viewport = { width: 1920, height: 1080 };

const { cues } = JSON.parse(fs.readFileSync(path.join(here, "cues.json"), "utf8"));

const cueById = new Map(cues.map((cue) => [cue.id, cue]));

const firstCueMs = cues[0].startMs;

const pointer = { x: viewport.width / 2, y: 260 };

let startedAt = 0;

const drifts = [];

const deadRanges = [];

function elapsed() {
  return Date.now() - startedAt;
}

function timelineMs(cueId) {
  const cue = cueById.get(cueId);

  if (cue === undefined) {
    throw new Error(`No cue named ${cueId}`);
  }

  return cue.startMs - firstCueMs;
}

async function waitForCue(page, cueId, { lead = leadMilliseconds } = {}) {
  const target = Math.max(0, timelineMs(cueId) - lead);
  const remaining = target - elapsed();

  if (remaining > 0) {
    const keepVisible = Math.min(remaining, 1500);
    const idle = remaining - keepVisible;

    if (idle > 0) {
      const from = elapsed();
      await page.waitForTimeout(idle);
      deadRanges.push([from / 1000, elapsed() / 1000]);
    }

    await page.waitForTimeout(keepVisible);
    return;
  }

  if (remaining < -400) {
    drifts.push({ cueId, lateBy: Math.round(-remaining) });
  }
}

function easeInOutCubic(value) {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

async function moveCursor(page, x, y) {
  await page
    .evaluate(
      ([nextX, nextY]) => window.__papertrailCursorMove?.(nextX, nextY),
      [x, y]
    )
    .catch(() => undefined);
}

async function moveHuman(page, targetX, targetY) {
  const startX = pointer.x;
  const startY = pointer.y;
  const distance = Math.hypot(targetX - startX, targetY - startY);

  if (distance < 2) {
    return;
  }

  const steps = Math.max(18, Math.min(46, Math.round(distance / 14)));
  const arc = (Math.random() - 0.5) * Math.min(120, distance * 0.22);
  const middleX = (startX + targetX) / 2 - (targetY - startY) * 0.12;
  const middleY = (startY + targetY) / 2 + arc;

  for (let step = 1; step <= steps; step += 1) {
    const progress = easeInOutCubic(step / steps);
    const inverse = 1 - progress;

    const x =
      inverse * inverse * startX +
      2 * inverse * progress * middleX +
      progress * progress * targetX +
      (Math.random() - 0.5) * 1.6;

    const y =
      inverse * inverse * startY +
      2 * inverse * progress * middleY +
      progress * progress * targetY +
      (Math.random() - 0.5) * 1.6;

    await moveCursor(page, x, y);
    await page.mouse.move(x, y);
    await page.waitForTimeout(10 + Math.random() * 8);
  }

  await moveCursor(page, targetX, targetY);
  await page.mouse.move(targetX, targetY);

  pointer.x = targetX;
  pointer.y = targetY;
}

async function reachFor(page, locator, description) {
  await locator.waitFor({ state: "visible", timeout: 25000 });
  await locator.scrollIntoViewIfNeeded();
  await page.waitForTimeout(220);

  const box = await locator.boundingBox();

  if (box === null) {
    throw new Error(`Could not find ${description} on screen`);
  }

  const targetX = box.x + box.width / 2 + (Math.random() - 0.5) * box.width * 0.2;
  const targetY = box.y + box.height / 2 + (Math.random() - 0.5) * box.height * 0.2;

  await moveHuman(page, targetX, targetY);
}

async function pressHere(page) {
  await page.waitForTimeout(520 + Math.random() * 180);
  await page.evaluate(() => window.__papertrailCursorPress?.(true));
  await page.mouse.down();
  await page.waitForTimeout(95);
  await page.mouse.up();
  await page.evaluate(() => window.__papertrailCursorPress?.(false));
  await page.waitForTimeout(420);
}

async function clickHuman(page, locator, description) {
  await reachFor(page, locator, description);
  await pressHere(page);
}

async function typeHuman(page, locator, text, description) {
  await reachFor(page, locator, description);
  await pressHere(page);
  await locator.fill("");

  for (const character of text) {
    await page.keyboard.type(character);
    await page.waitForTimeout(68 + Math.random() * 72);
  }

  await page.waitForTimeout(360);
}

async function setStep(page, text) {
  await page
    .evaluate((value) => window.__papertrailSetStep?.(value), text)
    .catch(() => undefined);
}

async function settleOverlay(page) {
  await page.evaluate(installOverlay).catch(() => undefined);
  await moveCursor(page, pointer.x, pointer.y);
}

async function goTo(page, target) {
  await page.goto(`${baseUrl}${target}`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("load").catch(() => undefined);
  await page.waitForTimeout(700);
  await settleOverlay(page);
}

async function run() {
  const recordingsDir = path.join(here, "capture", "recordings");
  const shotsDir = path.join(here, "capture", "shots");

  fs.rmSync(path.join(here, "capture"), { recursive: true, force: true });
  fs.mkdirSync(recordingsDir, { recursive: true });
  fs.mkdirSync(shotsDir, { recursive: true });

  let shotNumber = 0;

  const browser = await chromium.launch({ headless: true });

  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    recordVideo: { dir: recordingsDir, size: viewport },
    colorScheme: "dark",
    reducedMotion: "no-preference",
  });

  const page = await context.newPage();

  const shot = async (name) => {
    shotNumber += 1;
    await page.screenshot({
      path: path.join(shotsDir, `${String(shotNumber).padStart(2, "0")}-${name}.png`),
    });
  };

  await page.goto(`${baseUrl}/sign-in`, { waitUntil: "domcontentloaded" });
  await settleOverlay(page);
  await page.waitForTimeout(600);

  startedAt = Date.now();

  await setStep(page, cueById.get("open-sign-in").label);
  await waitForCue(page, "open-sign-in", { lead: 0 });
  await shot("sign-in");

  await waitForCue(page, "type-email");
  await page.evaluate(() => window.__papertrailRevealPassword?.());
  await typeHuman(page, page.locator("#email"), judgeEmail, "email field");
  await typeHuman(page, page.locator("#password"), judgePassword, "password field");
  await shot("credentials");

  await waitForCue(page, "submit-sign-in");
  await clickHuman(
    page,
    page.getByRole("button", { name: /sign in/i }).first(),
    "sign in button"
  );
  await page.waitForURL(/\/knowledge/, { timeout: 25000 }).catch(() => undefined);
  await page.waitForTimeout(900);
  await settleOverlay(page);
  await shot("signed-in");

  await setStep(page, cueById.get("open-knowledge").label);
  await waitForCue(page, "open-knowledge");
  await goTo(page, "/knowledge");
  await shot("knowledge");

  await setStep(page, cueById.get("open-report").label);
  await waitForCue(page, "open-report");
  await goTo(page, "/reports");
  await clickHuman(
    page,
    page.locator("a[href^='/reports/']").first(),
    "the stored report"
  );
  await page.waitForTimeout(1200);
  await settleOverlay(page);
  await shot("report");

  await setStep(page, cueById.get("open-citations").label);
  await waitForCue(page, "open-citations");
  await shot("citations");

  await waitForCue(page, "trace-to-paper");
  await shot("traced");

  await setStep(page, cueById.get("start-project").label);
  await waitForCue(page, "start-project");
  await goTo(page, "/projects");
  await shot("projects");

  await setStep(page, cueById.get("show-gaps").label);
  await waitForCue(page, "show-gaps");
  await goTo(page, `/projects/${projectIdentifier}`);
  await shot("gaps");

  await setStep(page, cueById.get("show-proposals").label);
  await waitForCue(page, "show-proposals");
  await shot("proposals");

  await waitForCue(page, "show-prior-art");
  await shot("prior-art");

  await setStep(page, cueById.get("open-draft").label);
  await waitForCue(page, "open-draft");
  await goTo(page, `/projects/${projectIdentifier}/draft?draftId=${draftIdentifier}`);
  await shot("draft");

  await waitForCue(page, "scroll-draft");
  await page.mouse.wheel(0, 900);
  await page.waitForTimeout(1400);
  await page.mouse.wheel(0, 900);
  await page.waitForTimeout(1400);
  await shot("draft-figures");

  await waitForCue(page, "end-demo");
  await setStep(page, null);
  await page.waitForTimeout(900);

  const recordedSeconds = elapsed() / 1000;

  await context.close();
  await browser.close();

  const videoFile = fs
    .readdirSync(recordingsDir)
    .find((name) => name.endsWith(".webm"));

  fs.writeFileSync(
    path.join(here, "capture", "timeline.json"),
    `${JSON.stringify(
      {
        offsetMs: firstCueMs,
        recordedSeconds,
        deadRanges,
        drifts,
        video: videoFile ?? null,
      },
      null,
      2
    )}\n`
  );

  console.log(`recorded ${recordedSeconds.toFixed(1)}s into ${videoFile}`);
  console.log(`demo begins at ${(firstCueMs / 1000).toFixed(1)}s of the narration`);
  console.log(`dead ranges: ${deadRanges.length}`);

  if (drifts.length === 0) {
    console.log("every cue landed on time");
  } else {
    console.log("cues that ran late:");
    for (const drift of drifts) {
      console.log(`  ${drift.cueId} late by ${drift.lateBy}ms`);
    }
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
