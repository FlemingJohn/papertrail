import type { WatchFrequency } from "../schemas/watch";

const daysByFrequency: Record<WatchFrequency, number> = {
  weekly: 7,
  monthly: 30,
  quarterly: 90,
};

export function calculateNextCheck(
  frequency: WatchFrequency,
  from: Date = new Date()
): Date {
  const next = new Date(from);
  next.setDate(next.getDate() + daysByFrequency[frequency]);
  return next;
}

export function describeSchedule(
  frequency: WatchFrequency,
  nextCheckAt: Date
): string {
  const daysAway = Math.max(
    0,
    Math.round((nextCheckAt.getTime() - Date.now()) / 86400000)
  );

  if (daysAway === 0) {
    return `Checked ${frequency}, due now`;
  }

  if (daysAway === 1) {
    return `Checked ${frequency}, next check tomorrow`;
  }

  return `Checked ${frequency}, next check in ${daysAway} days`;
}
