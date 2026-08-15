const thinkingFieldPattern = /"thinking"\s*:\s*"/;

export class ThinkingExtractor {
  private buffer = "";
  private valueStartIndex = -1;
  private emittedLength = 0;
  private isComplete = false;

  public consume(chunk: string): string {
    if (this.isComplete) {
      return "";
    }

    this.buffer += chunk;

    if (this.valueStartIndex === -1) {
      const match = thinkingFieldPattern.exec(this.buffer);

      if (match === null) {
        return "";
      }

      this.valueStartIndex = match.index + match[0].length;
    }

    const rawValue = this.buffer.slice(this.valueStartIndex);
    const closingIndex = findUnescapedQuote(rawValue);

    const readable =
      closingIndex === -1 ? rawValue : rawValue.slice(0, closingIndex);

    if (closingIndex !== -1) {
      this.isComplete = true;
    }

    const decoded = decodeJsonString(readable);

    if (decoded.length <= this.emittedLength) {
      return "";
    }

    const delta = decoded.slice(this.emittedLength);
    this.emittedLength = decoded.length;

    return delta;
  }

  public getFullText(): string {
    if (this.valueStartIndex === -1) {
      return "";
    }

    const rawValue = this.buffer.slice(this.valueStartIndex);
    const closingIndex = findUnescapedQuote(rawValue);

    return decodeJsonString(
      closingIndex === -1 ? rawValue : rawValue.slice(0, closingIndex)
    );
  }
}

function findUnescapedQuote(value: string): number {
  for (let index = 0; index < value.length; index += 1) {
    if (value[index] !== '"') {
      continue;
    }

    let backslashCount = 0;
    let lookBack = index - 1;

    while (lookBack >= 0 && value[lookBack] === "\\") {
      backslashCount += 1;
      lookBack -= 1;
    }

    if (backslashCount % 2 === 0) {
      return index;
    }
  }

  return -1;
}

function decodeJsonString(value: string): string {
  let trimmed = value;

  while (trimmed.endsWith("\\")) {
    trimmed = trimmed.slice(0, -1);
  }

  try {
    return JSON.parse(`"${trimmed}"`) as string;
  } catch {
    return trimmed
      .replace(/\\n/g, "\n")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\");
  }
}
