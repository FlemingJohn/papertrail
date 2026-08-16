import { calculateModelDollars } from "../config/pricing";
import type { RunEventWriter } from "../types/stream";

export interface SpendTotals {
  tokensIn: number;
  tokensOut: number;
  cachedTokensIn: number;
  dollars: number;
}

export class SpendTracker {
  private tokensIn = 0;

  private tokensOut = 0;

  private cachedTokensIn = 0;

  private readonly writer: RunEventWriter | null;

  constructor(writer: RunEventWriter | null) {
    this.writer = writer;
  }

  add(tokensIn: number, tokensOut: number, cachedTokensIn = 0): void {
    this.tokensIn += tokensIn;
    this.tokensOut += tokensOut;
    this.cachedTokensIn += cachedTokensIn;

    this.writer?.emit({
      type: "spend-updated",
      totalDollars: this.dollars(),
      tokensIn: this.tokensIn,
      tokensOut: this.tokensOut,
      activeAgentCount: 0,
    });
  }

  dollars(): number {
    return calculateModelDollars(
      this.tokensIn,
      this.tokensOut,
      this.cachedTokensIn
    );
  }

  totals(): SpendTotals {
    return {
      tokensIn: this.tokensIn,
      tokensOut: this.tokensOut,
      cachedTokensIn: this.cachedTokensIn,
      dollars: this.dollars(),
    };
  }
}
