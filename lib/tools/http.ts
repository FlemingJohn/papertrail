interface RequestOptions {
  searchParameters?: Record<string, string | number | undefined>;
  headers?: Record<string, string>;
}

export async function requestJson<Value>(
  url: string,
  options: RequestOptions = {}
): Promise<Value> {
  const target = new URL(url);

  if (options.searchParameters !== undefined) {
    for (const [key, value] of Object.entries(options.searchParameters)) {
      if (value !== undefined) {
        target.searchParams.set(key, String(value));
      }
    }
  }

  const response = await fetch(target, {
    headers: {
      Accept: "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Request to ${target.hostname} failed with status ${response.status}`
    );
  }

  return (await response.json()) as Value;
}

export async function requestText(
  url: string,
  options: RequestOptions = {}
): Promise<string> {
  const target = new URL(url);

  if (options.searchParameters !== undefined) {
    for (const [key, value] of Object.entries(options.searchParameters)) {
      if (value !== undefined) {
        target.searchParams.set(key, String(value));
      }
    }
  }

  const response = await fetch(target, { headers: options.headers });

  if (!response.ok) {
    throw new Error(
      `Request to ${target.hostname} failed with status ${response.status}`
    );
  }

  return await response.text();
}
