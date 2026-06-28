/**
 * Race a promise (or Supabase thenable) against a timeout so a stalled network
 * request — or, more importantly, a Supabase call that hangs *before* `fetch`
 * is ever reached while waiting on the auth navigator-lock — can never leave the
 * UI stuck on a spinner forever.
 *
 * The global `fetch` wrapper in `integrations/supabase/client.ts` only aborts
 * the network request itself; it does NOT cover the lock-acquisition step, which
 * is exactly where chat loads/sends were freezing. Wrapping the call here closes
 * that gap by rejecting after `ms`, which lets React Query surface an error
 * state (and retry) instead of hanging in `isPending` indefinitely.
 */
export async function withTimeout<T>(
  promise: PromiseLike<T>,
  ms: number,
  label = 'Request',
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${Math.round(ms / 1000)}s. Please try again.`)),
      ms,
    );
  });
  try {
    return await Promise.race([Promise.resolve(promise), timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
