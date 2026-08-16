export const dollarsPerMillionInputTokens = 2.5;

export const dollarsPerMillionOutputTokens = 10;

export const dollarsPerDocumentPage = 0.01;

export const cachedInputDiscount = 0.5;

export function calculateModelDollars(
  tokensIn: number,
  tokensOut: number,
  cachedTokensIn = 0
): number {
  const freshTokensIn = Math.max(0, tokensIn - cachedTokensIn);
  const freshDollars =
    (freshTokensIn / 1_000_000) * dollarsPerMillionInputTokens;
  const cachedDollars =
    (cachedTokensIn / 1_000_000) *
    dollarsPerMillionInputTokens *
    cachedInputDiscount;
  const outputDollars = (tokensOut / 1_000_000) * dollarsPerMillionOutputTokens;
  return roundToSixPlaces(freshDollars + cachedDollars + outputDollars);
}

export function calculateDocumentDollars(pageCount: number): number {
  return roundToSixPlaces(pageCount * dollarsPerDocumentPage);
}

function roundToSixPlaces(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

export function formatDollars(value: number): string {
  if (value < 0.01) {
    return `$${value.toFixed(4)}`;
  }
  return `$${value.toFixed(2)}`;
}
