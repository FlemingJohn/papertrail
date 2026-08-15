export async function mapWithLimit<Item, Result>(
  items: readonly Item[],
  limit: number,
  handle: (item: Item, index: number) => Promise<Result>
): Promise<Result[]> {
  if (items.length === 0) {
    return [];
  }

  const results = new Array<Result>(items.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (true) {
      const currentIndex = nextIndex;
      nextIndex += 1;

      if (currentIndex >= items.length) {
        return;
      }

      results[currentIndex] = await handle(items[currentIndex], currentIndex);
    }
  }

  const workerCount = Math.min(limit, items.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  return results;
}
