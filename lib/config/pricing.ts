export const dollarsPerMillionInputTokens = 2.5;

export const dollarsPerMillionOutputTokens = 10;

export const dollarsPerDocumentPage = 0.01;

export function calculateModelDollars(
  tokensIn: number,
  tokensOut: number
): number {
  const inputDollars = (tokensIn / 1_000_000) * dollarsPerMillionInputTokens;
  const outputDollars = (tokensOut / 1_000_000) * dollarsPerMillionOutputTokens;
  return roundToSixPlaces(inputDollars + outputDollars);
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
