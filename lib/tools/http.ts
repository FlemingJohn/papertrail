interface RequestOptions {
  searchParameters?: Record<string, string | number | undefined>;
  headers?: Record<string, string>;
}

const retryableStatuses = new Set([429, 500, 502, 503, 504]);

const maximumAttempts = 4;

const baseBackoffMilliseconds = 800;

const maximumBackoffMilliseconds = 8000;

const worthWaitingMilliseconds = 30000;

function buildTarget(url: string, options: RequestOptions): URL {
  const target = new URL(url);

  if (options.searchParameters !== undefined) {
    for (const [key, value] of Object.entries(options.searchParameters)) {
      if (value !== undefined) {
        target.searchParams.set(key, String(value));
      }
    }
  }

  return target;
}

function readRetryAfter(response: Response): number | null {
  const header = response.headers.get("retry-after");

  if (header === null) {
    return null;
  }

  const seconds = Number(header);

  if (Number.isFinite(seconds)) {
    return seconds * 1000;
  }

  const when = Date.parse(header);

  if (Number.isNaN(when)) {
    return null;
  }

  return Math.max(when - Date.now(), 0);
}

function describeDuration(milliseconds: number): string {
  const totalMinutes = Math.round(milliseconds / 60000);

  if (totalMinutes < 60) {
    return `${totalMinutes} ${totalMinutes === 1 ? "minute" : "minutes"}`;
  }

  const hours = Math.round(totalMinutes / 60);
  return `${hours} ${hours === 1 ? "hour" : "hours"}`;
}

function waitFor(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function requestWithBackoff(
  url: string,
  options: RequestOptions,
  accept: string | null
): Promise<Response> {
  const target = buildTarget(url, options);
  const headers =
    accept === null
      ? options.headers
      : { Accept: accept, ...options.headers };

  let lastStatus = 0;

  for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
    const response = await fetch(target, { headers });

    if (response.ok) {
      return response;
    }

    lastStatus = response.status;

    if (!retryableStatuses.has(response.status) || attempt === maximumAttempts) {
      break;
    }

    const suggested = readRetryAfter(response);

    if (suggested !== null && suggested > worthWaitingMilliseconds) {
      throw new Error(
        `${target.hostname} has no request budget left and will not accept another call for ${describeDuration(suggested)}. This lookup was left unchecked rather than guessed. The budget resets on their schedule, not ours.`
      );
    }

    const backoff =
      suggested ??
      Math.min(
        baseBackoffMilliseconds * 2 ** (attempt - 1),
        maximumBackoffMilliseconds
      );

    await waitFor(backoff);
  }

  if (lastStatus === 429) {
    throw new Error(
      `${target.hostname} is rate limiting this deployment. It was asked ${maximumAttempts} times and kept refusing, so this lookup was left unchecked rather than guessed.`
    );
  }

  throw new Error(
    `Request to ${target.hostname} failed with status ${lastStatus}`
  );
}

export async function requestJson<Value>(
  url: string,
  options: RequestOptions = {}
): Promise<Value> {
  const response = await requestWithBackoff(url, options, "application/json");
  return (await response.json()) as Value;
}

export async function requestText(
  url: string,
  options: RequestOptions = {}
): Promise<string> {
  const response = await requestWithBackoff(url, options, null);
  return await response.text();
}
