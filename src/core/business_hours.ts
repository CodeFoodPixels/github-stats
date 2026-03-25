/**
 * Calculate business hours between two timestamps.
 * Counts all weekday hours (24h Mon–Fri), skips Sat/Sun entirely.
 * Ported from ghpr.sh lines 51–62.
 */
export function businessHours(start: Date, end: Date): number {
  if (end <= start) return 0;

  let totalMs = 0;
  const current = new Date(start);

  while (current < end) {
    const nextDay = new Date(current);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    nextDay.setUTCHours(0, 0, 0, 0);

    const segmentEnd = nextDay > end ? end : nextDay;
    const dayOfWeek = current.getUTCDay();

    // Mon=1..Fri=5, skip Sat=6 and Sun=0
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      totalMs += segmentEnd.getTime() - current.getTime();
    }

    current.setTime(segmentEnd.getTime());
  }

  return totalMs / (1000 * 60 * 60);
}
