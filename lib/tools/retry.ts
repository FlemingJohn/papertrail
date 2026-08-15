export async function withTimeout<Value>(
  operation: Promise<Value>,
  timeoutMilliseconds: number
): Promise<Value> {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMilliseconds}ms`));
    }, timeoutMilliseconds);
  });

  try {
    return await Promise.race([operation, timeoutPromise]);
  } finally {
    if (timeoutHandle !== undefined) {
      clearTimeout(timeoutHandle);
    }
  }
}

export async function withRetry<Value>(
  createOperation: () => Promise<Value>,
  attempts: number
): Promise<Value> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= attempts; attempt += 1) {
    try {
      return await createOperation();
    } catch (error) {
      lastError = error;

      if (attempt === attempts || !shouldRetry(error)) {
        break;
      }

      const backoffMilliseconds = Math.min(2 ** attempt * 500, 8000);
      await delay(backoffMilliseconds);
    }
  }

  throw lastError;
}

function shouldRetry(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  if (message.includes("timed out")) {
    return true;
  }
  if (message.includes("rate limit") || message.includes("429")) {
    return true;
  }
  if (message.includes("503") || message.includes("502") || message.includes("504")) {
    return true;
  }
  if (message.includes("econnreset") || message.includes("fetch failed")) {
    return true;
  }

  return false;
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
