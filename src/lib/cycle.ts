// Pure helper (no server imports) so dashboard components can use it too.
/** Progress inside the current payment cycle: 0..size; an exact multiple shows a full "8/8" until the next lesson. */
export function cycleProgress(completed: number, size: number) {
  if (completed <= 0) return 0;
  return completed % size === 0 ? size : completed % size;
}
