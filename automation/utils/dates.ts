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

const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;

/**
 * The first working day (Mon–Fri, not a holiday) at least `minDaysAhead` days from today.
 * Throws if it falls after `periodEnd`, so a test never applies outside the leave period.
 */
export function upcomingWorkingDay(minDaysAhead: number, holidays: string[], periodEnd: string): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + minDaysAhead);
  while (isWeekend(d) || holidays.includes(toIso(d))) d.setDate(d.getDate() + 1);
  const iso = toIso(d);
  if (iso > periodEnd) {
    throw new Error(`No working day ${minDaysAhead}+ days ahead inside the leave period (ends ${periodEnd}).`);
  }
  return iso;
}

/** The end date of a range that starts on `startIso` and contains exactly `workingDays` working days. */
export function endOfWorkingDays(startIso: string, workingDays: number, holidays: string[]): string {
  const d = parseIso(startIso);
  let counted = 0;
  for (;;) {
    if (!isWeekend(d) && !holidays.includes(toIso(d))) counted++;
    if (counted === workingDays) return toIso(d);
    d.setDate(d.getDate() + 1);
  }
}
