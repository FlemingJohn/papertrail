interface UsageTotals {
  tokensIn: number;
  tokensOut: number;
  cachedTokensIn: number;
}

const totalsByRun = new Map<string, UsageTotals>();

const maximumRuns = 50;

export function recordUsage(
  runIdentifier: string,
  tokensIn: number,
  tokensOut: number,
  cachedTokensIn: number
): void {
  const existing = totalsByRun.get(runIdentifier);

  if (existing === undefined) {
    if (totalsByRun.size >= maximumRuns) {
      const oldest = totalsByRun.keys().next().value;
      if (oldest !== undefined) {
        totalsByRun.delete(oldest);
      }
    }

    totalsByRun.set(runIdentifier, {
      tokensIn,
      tokensOut,
      cachedTokensIn,
    });
    return;
  }

  existing.tokensIn += tokensIn;
  existing.tokensOut += tokensOut;
  existing.cachedTokensIn += cachedTokensIn;
}

export function readUsage(runIdentifier: string): UsageTotals {
  return (
    totalsByRun.get(runIdentifier) ?? {
      tokensIn: 0,
      tokensOut: 0,
      cachedTokensIn: 0,
    }
  );
}

export function clearUsage(runIdentifier: string): void {
  totalsByRun.delete(runIdentifier);
}
