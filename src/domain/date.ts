export function todayISODate(): string {
  return formatISODate(new Date());
}

function formatISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Adds (or subtracts, for a negative delta) whole days to a yyyy-mm-dd
// date, handling month/year rollover via the Date object rather than
// string math.
export function addDaysISO(date: string, delta: number): string {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + delta);
  return formatISODate(d);
}

// The 7 trailing days ending at (and including) `date`, oldest first - used
// by the Home screen's weekly calendar strip. A trailing window rather than
// a calendar (Mon-Sun) week, since most of those days will have real
// check-in history to show, unlike upcoming days which have no data yet.
export function getTrailingWeek(date: string): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    days.push(addDaysISO(date, -i));
  }
  return days;
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function weekdayLabel(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  return WEEKDAY_LABELS[d.getDay()];
}

export function dayOfMonth(date: string): number {
  return new Date(`${date}T00:00:00`).getDate();
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Deterministic, locale-independent display format (avoids relying on
// toLocaleString(), whose output can vary by platform/ICU data).
export function formatEventTimestamp(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${MONTH_LABELS[d.getMonth()]} ${d.getDate()}, ${hh}:${mm}`;
}

// Day Detail screen's header, e.g. "Tue, Jul 28".
export function formatDateHeading(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  return `${weekdayLabel(date)}, ${MONTH_LABELS[d.getMonth()]} ${d.getDate()}`;
}
