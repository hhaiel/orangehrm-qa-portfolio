/** Date helpers that keep leave tests valid whenever they run. Dates are local, formatted yyyy-mm-dd. */

export function toIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function today(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;
const isWorkingDay = (d: Date, holidays: string[]) => !isWeekend(d) && !holidays.includes(toIso(d));

export function addDays(iso: string, days: number): string {
  const d = parseIso(iso);
  d.setDate(d.getDate() + days);
  return toIso(d);
}

function assertInPeriod(iso: string, periodEnd: string, what: string) {
  if (iso > periodEnd) throw new Error(`${what} (${iso}) falls after the leave period ends (${periodEnd}).`);
}

/**
 * The first working day (Mon–Fri, not a holiday) at least `minDaysAhead` days from today.
 * Throws if it falls after `periodEnd`, so a test never applies outside the leave period.
 */
export function upcomingWorkingDay(minDaysAhead: number, holidays: string[], periodEnd: string): string {
  const d = today();
  d.setDate(d.getDate() + minDaysAhead);
  while (!isWorkingDay(d, holidays)) d.setDate(d.getDate() + 1);
  const iso = toIso(d);
  assertInPeriod(iso, periodEnd, 'Upcoming working day');
  return iso;
}

/** The first given weekday (0 = Sun … 6 = Sat) at least `minDaysAhead` days from today. */
export function upcomingWeekday(weekday: number, minDaysAhead: number, periodEnd: string): string {
  const d = today();
  d.setDate(d.getDate() + minDaysAhead);
  while (d.getDay() !== weekday) d.setDate(d.getDate() + 1);
  const iso = toIso(d);
  assertInPeriod(iso, periodEnd, 'Upcoming weekday');
  return iso;
}

/** The most recent working day before today, inside the leave period. */
export function previousWorkingDay(holidays: string[], periodStart: string): string {
  const d = today();
  do d.setDate(d.getDate() - 1);
  while (!isWorkingDay(d, holidays));
  const iso = toIso(d);
  if (iso < periodStart) throw new Error(`No working day before today in the current leave period (${periodStart}).`);
  return iso;
}

/** The first of two consecutive working days, starting the search on `fromIso`. */
export function twoConsecutiveWorkingDays(fromIso: string, holidays: string[], periodEnd: string): [string, string] {
  const d = parseIso(fromIso);
  for (;;) {
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    if (isWorkingDay(d, holidays) && isWorkingDay(next, holidays)) {
      const pair: [string, string] = [toIso(d), toIso(next)];
      assertInPeriod(pair[1], periodEnd, 'Two consecutive working days');
      return pair;
    }
    d.setDate(d.getDate() + 1);
  }
}

/** Number of working days in a date range (both ends included). */
export function countWorkingDays(startIso: string, endIso: string, holidays: string[]): number {
  let count = 0;
  for (let d = parseIso(startIso); toIso(d) <= endIso; d.setDate(d.getDate() + 1)) {
    if (isWorkingDay(d, holidays)) count++;
  }
  return count;
}

/** The end date of a range that starts on `startIso` and contains exactly `workingDays` working days. */
export function endOfWorkingDays(startIso: string, workingDays: number, holidays: string[]): string {
  const d = parseIso(startIso);
  let counted = 0;
  for (;;) {
    if (isWorkingDay(d, holidays)) counted++;
    if (counted === workingDays) return toIso(d);
    d.setDate(d.getDate() + 1);
  }
}
