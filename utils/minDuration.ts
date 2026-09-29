/**
 * Utility to guarantee minimum preloader display time (3.5 seconds)
 * so users can always experience the complete botanical growth cycle.
 */

export const PRELOADER_MIN_DURATION_MS = 3500;

/**
 * Waits for the remaining duration to ensure at least minMs has elapsed since startTime.
 */
export async function waitRemainingMs(
  startTime: number,
  minMs: number = PRELOADER_MIN_DURATION_MS
): Promise<void> {
  const elapsed = Date.now() - startTime;
  const remaining = Math.max(0, minMs - elapsed);
  if (remaining > 0) {
    await new Promise((resolve) => setTimeout(resolve, remaining));
  }
}

/**
 * Wraps an async operation and ensures it takes at least minMs before resolving or rejecting.
 */
export async function withMinDuration<T>(
  action: () => Promise<T>,
  minMs: number = PRELOADER_MIN_DURATION_MS
): Promise<T> {
  const start = Date.now();
  try {
    const res = await action();
    await waitRemainingMs(start, minMs);
    return res;
  } catch (err) {
    await waitRemainingMs(start, minMs);
    throw err;
  }
}
