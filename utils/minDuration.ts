/**
 * Utility to manage preloader display time.
 * With the lightweight TikTok-style preloader, artificial 3.5-second pauses
 * have been removed so the UI responds instantly to real data fetching.
 */

export const PRELOADER_MIN_DURATION_MS = 0;

/**
 * Waits for the remaining duration to ensure at least minMs has elapsed since startTime.
 * Legacy 3500ms holds are capped by PRELOADER_MIN_DURATION_MS so screens load instantaneously.
 */
export async function waitRemainingMs(
  startTime: number,
  minMs: number = PRELOADER_MIN_DURATION_MS
): Promise<void> {
  const targetMs = Math.min(minMs, PRELOADER_MIN_DURATION_MS);
  if (targetMs <= 0) return;

  const elapsed = Date.now() - startTime;
  const remaining = Math.max(0, targetMs - elapsed);
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
