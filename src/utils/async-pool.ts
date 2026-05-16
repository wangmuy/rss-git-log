export async function asyncPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
  yieldBetween?: () => Promise<void>
): Promise<R[]> {
  const results: R[] = [];
  let i = 0;

  async function next(): Promise<void> {
    const idx = i++;
    if (idx >= items.length) return;
    results[idx] = await fn(items[idx]);
    if (yieldBetween) await yieldBetween();
    await next();
  }

  const workers = Array(Math.min(concurrency, items.length)).fill(null).map(() => next());
  await Promise.all(workers);
  return results;
}
