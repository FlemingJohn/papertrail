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
import { segments } from "./segments.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));

const baseUrl = process.env.DEMO_BASE_URL ?? "http://localhost:3000";

const viewport = { width: 1920, height: 1080 };

const leadMilliseconds = 700;

const { cues } = JSON.parse(fs.readFileSync(path.join(here, "cues.json"), "utf8"));

const cueById = new Map(cues.map((cue) => [cue.id, cue]));

const pointer = { x: viewport.width / 2, y: 300 };

let segmentStartMs = 0;

let startedAt = 0;

const drifts = [];

function elapsed() {
  return Date.now() - startedAt;
}

function offsetOf(cueId) {
  const cue = cueById.get(cueId);

  if (cue === undefined) {
    throw new Error(`No cue named ${cueId}`);
  }

  return cue.startMs - segmentStartMs;
}

async function waitForCue(page, cueId, { lead = leadMilliseconds } = {}) {
  const target = Math.max(0, offsetOf(cueId) - lead);
  const remaining = target - elapsed();

  if (remaining > 0) {
    await page.waitForTimeout(remaining);
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
    .evaluate(([a, b]) => window.__papertrailCursorMove?.(a, b), [x, y])
    .catch(() => undefined);
}

async function moveHuman(page, targetX, targetY) {
  const startX = pointer.x;
  const startY = pointer.y;
  const distance = Math.hypot(targetX - startX, targetY - startY);

  if (distance < 2) {
    return;
  }

  const steps = Math.max(22, Math.min(54, Math.round(distance / 12)));
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
    await page.waitForTimeout(15 + Math.random() * 10);
  }

  await moveCursor(page, targetX, targetY);
  await page.mouse.move(targetX, targetY);

  pointer.x = targetX;
  pointer.y = targetY;
}

async function reachFor(page, locator, description) {
  await locator.waitFor({ state: "visible", timeout: 20000 });
  await locator.scrollIntoViewIfNeeded().catch(() => undefined);
  await page.waitForTimeout(220);

  const box = await locator.boundingBox();

  if (box === null) {
    throw new Error(`Could not find ${description} on screen`);
  }

  await moveHuman(
    page,
    box.x + box.width / 2 + (Math.random() - 0.5) * box.width * 0.2,
    box.y + box.height / 2 + (Math.random() - 0.5) * box.height * 0.2
  );
}

async function pressHere(page, settleMs = 620) {
  await page.waitForTimeout(settleMs + Math.random() * 200);
  await page.evaluate(() => window.__papertrailCursorPress?.(true));
  await page.mouse.down();
  await page.waitForTimeout(95);
  await page.mouse.up();
  await page.evaluate(() => window.__papertrailCursorPress?.(false));
  await page.waitForTimeout(520);
}

async function clickHuman(page, locator, description) {
  await reachFor(page, locator, description);
  await pressHere(page);
}

async function typeHuman(page, locator, text, description, paceMs = 68) {
  await reachFor(page, locator, description);
  await pressHere(page, 240);
  await locator.fill("");

  for (const character of text) {
    await page.keyboard.type(character);
    await page.waitForTimeout(paceMs + Math.random() * paceMs);
  }

  await page.waitForTimeout(280);
}

async function scrollAndHold(page, distance, holdMs = 2400) {
  const nudges = Math.max(3, Math.round(Math.abs(distance) / 130));
  const perNudge = distance / nudges;

  for (let index = 0; index < nudges; index += 1) {
    await page.mouse.wheel(0, perNudge);
    await page.waitForTimeout(90 + Math.random() * 70);
  }

  await page.waitForTimeout(holdMs);
}

async function setStep(page, text) {
  await page
    .evaluate((value) => window.__papertrailSetStep?.(value), text)
    .catch(() => undefined);
}

async function settleOverlay(page, label = null) {
  await page.evaluate(installOverlay).catch(() => undefined);
  await moveCursor(page, pointer.x, pointer.y);

  if (label !== null) {
    await setStep(page, label);
  }
}

async function goTo(page, target, { waitFor = null, label = null } = {}) {
  await page.goto(`${baseUrl}${target}`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("load").catch(() => undefined);

  if (waitFor !== null) {
    await page
      .locator(waitFor)
      .first()
      .waitFor({ state: "visible", timeout: 30000 })
      .catch(() => undefined);
  }

  await page.waitForTimeout(600);
  await settleOverlay(page, label);
}

async function signInQuietly(context) {
  const page = await context.newPage();
  await page.goto(`${baseUrl}/sign-in`, { waitUntil: "domcontentloaded" });
  await page.locator("#email").fill(judgeEmail);
  await page.locator("#password").fill(judgePassword);
  await page.getByRole("button", { name: /sign in/i }).first().click();
  await page.waitForURL(/\/knowledge/, { timeout: 20000 }).catch(() => undefined);
  await page.close();
}

const actions = {
  "01-sign-in": async (page, shot) => {
    await settleOverlay(page, cueById.get("open-sign-in").label);
    await shot("form");

    await waitForCue(page, "type-email", { lead: 2400 });
    await typeHuman(page, page.locator("#email"), judgeEmail, "email field", 42);
    await typeHuman(page, page.locator("#password"), judgePassword, "password", 82);
    await page.evaluate(() => window.__papertrailRevealPassword?.());
    await page.waitForTimeout(800);
    await shot("credentials");

    await waitForCue(page, "submit-sign-in");
    await clickHuman(
      page,
      page.getByRole("button", { name: /sign in/i }).first(),
      "sign in button"
    );
    await page.waitForURL(/\/knowledge/, { timeout: 12000 }).catch(() => undefined);
    await page.waitForTimeout(900);
    await settleOverlay(page);
    await shot("signed-in");
  },

  "02-your-papers": async (page, shot) => {
    await settleOverlay(page, cueById.get("open-knowledge").label);
    await shot("papers");

    await waitForCue(page, "open-paper", { lead: 2600 });
    await clickHuman(
      page,
      page.locator("a[href^='/knowledge/']").first(),
      "the first paper"
    );
    await page.waitForTimeout(1800);
    await settleOverlay(page, cueById.get("open-paper").label);
    await shot("inside-paper");

    await scrollAndHold(page, 420, 1500);
    await scrollAndHold(page, 420, 1400);
    await shot("paper-scrolled");
  },

  "03-report-sections": async (page, shot) => {
    await settleOverlay(page, cueById.get("open-report").label);
    await clickHuman(
      page,
      page.locator("a[href^='/reports/']").first(),
      "the stored report"
    );
    await page.waitForTimeout(1700);
    await settleOverlay(page, cueById.get("open-report").label);
    await shot("summary");

    const walk = [
      { cue: "tab-citations", name: /^citations/i },
      { cue: "tab-numbers", name: /^numbers/i },
      { cue: "tab-methods", name: /^methods/i },
      { cue: "tab-conflicts", name: /^conflicts/i },
      { cue: "tab-review", name: /^review/i },
      { cue: "tab-cost", name: /^cost/i },
    ];

    for (const stop of walk) {
      await waitForCue(page, stop.cue, { lead: 2600 });
      await clickHuman(
        page,
        page.getByRole("link", { name: stop.name }).first(),
        `${stop.cue} tab`
      );
      await page.waitForTimeout(1100);
      await settleOverlay(page, cueById.get(stop.cue).label);
      await shot(stop.cue.replace("tab-", ""));
    }
  },

  "04-failed-citation": async (page, shot) => {
    await settleOverlay(page, cueById.get("open-citations").label);
    await shot("citations");

    await scrollAndHold(page, 500, 1400);

    const problem = page
      .getByRole("button", { name: /not supported|wrong source|could not check|retracted/i })
      .first();

    if ((await problem.count()) > 0) {
      await clickHuman(page, problem, "a citation that failed");
      await page.waitForTimeout(1600);
      await shot("verdict-open");
    } else {
      await scrollAndHold(page, 400, 1400);
      await shot("citations-list");
    }

    await waitForCue(page, "trace-to-paper", { lead: 1200 });
    const seeIt = page.getByRole("link", { name: /see it in the paper/i }).first();

    if ((await seeIt.count()) > 0) {
      await clickHuman(page, seeIt, "see it in the paper");
      await page.waitForTimeout(2200);
      await settleOverlay(page, "STEP 4 OF 6 · TRACED TO THE PAGE");
      await shot("traced");
      await scrollAndHold(page, 420, 1600);
    } else {
      await scrollAndHold(page, 520, 1600);
      await shot("traced-fallback");
    }

    await scrollAndHold(page, 420, 1500);
  },

  "05-the-project": async (page, shot) => {
    await settleOverlay(page, cueById.get("start-project").label);
    await shot("projects");

    await waitForCue(page, "show-gaps", { lead: 3200 });
    await clickHuman(
      page,
      page.locator("a[href^='/projects/']").first(),
      "the research project"
    );
    await page.waitForTimeout(2400);
    await settleOverlay(page, cueById.get("show-gaps").label);
    await shot("gaps");

    await scrollAndHold(page, 340, 1800);
    await shot("gap-detail");
    await scrollAndHold(page, 300, 1600);
  },

  "06-prior-art": async (page, shot) => {
    await goTo(page, `/projects/${projectIdentifier}`, {
      waitFor: "text=/papers behind this project/i",
      label: "STEP 5 OF 6 · DOES IT ALREADY EXIST",
    });
    await scrollAndHold(page, 640, 1700);
    await shot("proposals");

    await scrollAndHold(page, 420, 1700);
    await shot("components");

    await waitForCue(page, "show-prior-art", { lead: 1500 });
    await scrollAndHold(page, 460, 1900);
    await shot("prior-art");

    await scrollAndHold(page, 420, 1900);
    await shot("prior-art-detail");

    await scrollAndHold(page, 420, 1900);
    await shot("papers-behind");
  },

  "07-the-draft": async (page, shot) => {
    await goTo(page, `/projects/${projectIdentifier}/draft?draftId=${draftIdentifier}`, {
      waitFor: ".draft-preview",
      label: cueById.get("open-draft").label,
    });
    await shot("draft");

    await waitForCue(page, "scroll-draft", { lead: 900 });
    await scrollAndHold(page, 620, 1700);
    await shot("draft-body");
    await scrollAndHold(page, 700, 1700);
    await shot("draft-figure");
    await scrollAndHold(page, 700, 1700);
    await shot("draft-table");
    await scrollAndHold(page, 700, 1500);
    await setStep(page, null);
    await page.waitForTimeout(700);
  },
};

async function recordSegment(segment) {
  const outDir = path.join(here, "capture", segment.id);
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(path.join(outDir, "shots"), { recursive: true });

  segmentStartMs = cueById.get(segment.startCue).startMs;

  const endMs = cueById.get(segment.endCue).startMs;
  const plannedSeconds = (endMs - segmentStartMs) / 1000;

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    recordVideo: { dir: path.join(outDir, "video"), size: viewport },
    colorScheme: "dark",
  });

  if (segment.signedIn) {
    await signInQuietly(context);
  }

  const page = await context.newPage();

  let shotNumber = 0;
  const shot = async (name) => {
    shotNumber += 1;
    await page.screenshot({
      path: path.join(outDir, "shots", `${String(shotNumber).padStart(2, "0")}-${name}.png`),
    });
  };

  if (segment.openAt !== null) {
    await page.goto(`${baseUrl}${segment.openAt}`, { waitUntil: "domcontentloaded" });

    if (segment.waitFor !== null) {
      await page
        .locator(segment.waitFor)
        .first()
        .waitFor({ state: "visible", timeout: 30000 })
        .catch(() => undefined);
    }
  } else {
    await page.goto(`${baseUrl}/projects`, { waitUntil: "domcontentloaded" });
  }

  await page.waitForTimeout(900);
  await settleOverlay(page);
  await page.waitForTimeout(400);

  drifts.length = 0;
  startedAt = Date.now();

  await actions[segment.id](page, shot);

  const heldFor = elapsed();
  const shortfall = plannedSeconds * 1000 - heldFor;

  if (shortfall > 0) {
    await page.waitForTimeout(shortfall);
  }

  const recordedSeconds = elapsed() / 1000;
  const warmUpBefore = Date.now();

  await context.close();
  await browser.close();

  const videoDir = path.join(outDir, "video");
  const videoName = fs.readdirSync(videoDir).find((n) => n.endsWith(".webm"));

  fs.writeFileSync(
    path.join(outDir, "segment.json"),
    `${JSON.stringify(
      {
        id: segment.id,
        startsAtSec: Number((segmentStartMs / 1000).toFixed(3)),
        plannedSeconds: Number(plannedSeconds.toFixed(3)),
        recordedSeconds: Number(recordedSeconds.toFixed(3)),
        video: videoName ?? null,
        drifts: [...drifts],
      },
      null,
      2
    )}\n`
  );

  const status = drifts.length === 0 ? "on time" : `${drifts.length} late`;
  console.log(
    `  ${segment.id}  planned ${plannedSeconds.toFixed(1)}s  recorded ${recordedSeconds.toFixed(1)}s  ${status}`
  );

  for (const drift of drifts) {
    console.log(`      ${drift.cueId} late by ${drift.lateBy}ms`);
  }

  void warmUpBefore;
}

async function run() {
  const wanted = process.argv[2] ?? null;
  const chosen =
    wanted === null
      ? segments
      : segments.filter((segment) => segment.id.includes(wanted));

  if (chosen.length === 0) {
    console.error(`No segment matches "${wanted}"`);
    process.exit(1);
  }

  console.log(`recording ${chosen.length} segment${chosen.length === 1 ? "" : "s"}`);

  for (const segment of chosen) {
    await recordSegment(segment);
  }

  console.log("done");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
