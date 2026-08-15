export type FailureCode =
  | "invalid-input"
  | "not-found"
  | "rate-limited"
  | "timed-out"
  | "behind-paywall"
  | "upstream-error"
  | "model-refused"
  | "invalid-model-output"
  | "storage-error"
  | "database-error"
  | "configuration-error";

export interface Failure {
  code: FailureCode;
  message: string;
  isRecoverable: boolean;
  cause?: unknown;
}

export type Outcome<Value> =
  | { successful: true; value: Value }
  | { successful: false; failure: Failure };

export function succeed<Value>(value: Value): Outcome<Value> {
  return { successful: true, value };
}

export function fail<Value = never>(
  code: FailureCode,
  message: string,
  isRecoverable = true,
  cause?: unknown
): Outcome<Value> {
  return { successful: false, failure: { code, message, isRecoverable, cause } };
}

export const recoverableCodes: readonly FailureCode[] = [
  "not-found",
  "rate-limited",
  "timed-out",
  "behind-paywall",
  "upstream-error",
];

export function describeFailure(failure: Failure): string {
  const explanations: Record<FailureCode, string> = {
    "invalid-input": "The request was not in the expected shape.",
    "not-found": "Nothing matching was found.",
    "rate-limited": "The external service asked us to slow down.",
    "timed-out": "The external service took too long to respond.",
    "behind-paywall": "The full text is not publicly available.",
    "upstream-error": "An external service returned an error.",
    "model-refused": "The language model declined to answer.",
    "invalid-model-output": "The language model returned an unexpected shape.",
    "storage-error": "The file could not be read or written.",
    "database-error": "The database rejected the operation.",
    "configuration-error": "A required setting is missing or wrong.",
  };
  return explanations[failure.code];
}
