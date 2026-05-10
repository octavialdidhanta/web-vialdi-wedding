/** Kalender Asia/Jakarta untuk filter rentang dashboard traffic (selaras RPC `AT TIME ZONE 'Asia/Jakarta'`). */

export type TrafficDatePreset =
  | "today"
  | "yesterday"
  | "last7"
  | "last14"
  | "last28"
  | "last30"
  | "thisWeek"
  | "lastWeek"
  | "thisMonth"
  | "lastMonth"
  | "maximum"
  | "custom";

export const TRAFFIC_DATE_PRESET_LABELS: Record<TrafficDatePreset, string> = {
  today: "Today",
  yesterday: "Yesterday",
  last7: "Last 7 days",
  last14: "Last 14 days",
  last28: "Last 28 days",
  last30: "Last 30 days",
  thisWeek: "This week",
  lastWeek: "Last week",
  thisMonth: "This month",
  lastMonth: "Last month",
  maximum: "Maximum",
  custom: "Custom",
};

export const TRAFFIC_DATE_PRESET_ORDER: TrafficDatePreset[] = [
  "today",
  "yesterday",
  "last7",
  "last14",
  "last28",
  "last30",
  "thisWeek",
  "lastWeek",
  "thisMonth",
  "lastMonth",
  "maximum",
  "custom",
];

export function jakartaTodayYmd(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** yyyy-mm-dd di timezone Jakarta untuk instant `d` (untuk konversi dari Date picker). */
export function dateToJakartaYmd(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function jakartaYmdToLocalDate(ymd: string): Date {
  return new Date(`${ymd}T12:00:00+07:00`);
}

export function jakartaYmdAddDays(ymd: string, deltaDays: number): string {
  const d = jakartaYmdToLocalDate(ymd);
  d.setTime(d.getTime() + deltaDays * 86_400_000);
  return dateToJakartaYmd(d);
}

/** Rentang inklusif: hari ini dan (n - 1) hari sebelumnya → total n hari kalender Jakarta. */
export function jakartaLastNDaysInclusive(todayYmd: string, n: number): { from: string; to: string } {
  if (n < 1) {
    return { from: todayYmd, to: todayYmd };
  }
  return { from: jakartaYmdAddDays(todayYmd, -(n - 1)), to: todayYmd };
}

function weekdayShortJakarta(ymd: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    weekday: "short",
  }).format(jakartaYmdToLocalDate(ymd));
}

/** Hari sejak Senin (0 = Senin … 6 = Minggu) di kalender Jakarta. */
export function jakartaDaysSinceMonday(ymd: string): number {
  const short = weekdayShortJakarta(ymd);
  const map: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  };
  return map[short] ?? 0;
}

export function jakartaStartOfWeekMonday(ymd: string): string {
  return jakartaYmdAddDays(ymd, -jakartaDaysSinceMonday(ymd));
}

/** Minggu ISO (Sen–Min) yang sedang berjalan: Senin … hari ini. */
export function jakartaThisWeekRange(todayYmd: string): { from: string; to: string } {
  const monday = jakartaStartOfWeekMonday(todayYmd);
  return { from: monday, to: todayYmd };
}

/** Minggu kalender penuh sebelumnya (Senin … Minggu) di Jakarta. */
export function jakartaLastWeekRange(todayYmd: string): { from: string; to: string } {
  const thisMonday = jakartaStartOfWeekMonday(todayYmd);
  const lastSunday = jakartaYmdAddDays(thisMonday, -1);
  const lastMonday = jakartaYmdAddDays(lastSunday, -6);
  return { from: lastMonday, to: lastSunday };
}

export function jakartaThisMonthRange(todayYmd: string): { from: string; to: string } {
  const from = `${todayYmd.slice(0, 7)}-01`;
  return { from, to: todayYmd };
}

export function jakartaLastMonthRange(todayYmd: string): { from: string; to: string } {
  const y = Number(todayYmd.slice(0, 4));
  const m = Number(todayYmd.slice(5, 7));
  const prevM = m === 1 ? 12 : m - 1;
  const prevY = m === 1 ? y - 1 : y;
  const from = `${prevY}-${String(prevM).padStart(2, "0")}-01`;
  const lastDay = new Date(prevY, prevM, 0).getDate();
  const to = `${prevY}-${String(prevM).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { from, to };
}

export function computeTrafficPresetRange(
  preset: TrafficDatePreset,
  todayYmd: string,
  maximumBounds: { min: string; max: string } | null,
): { from: string; to: string } {
  switch (preset) {
    case "today":
      return { from: todayYmd, to: todayYmd };
    case "yesterday": {
      const y = jakartaYmdAddDays(todayYmd, -1);
      return { from: y, to: y };
    }
    case "last7":
      return jakartaLastNDaysInclusive(todayYmd, 7);
    case "last14":
      return jakartaLastNDaysInclusive(todayYmd, 14);
    case "last28":
      return jakartaLastNDaysInclusive(todayYmd, 28);
    case "last30":
      return jakartaLastNDaysInclusive(todayYmd, 30);
    case "thisWeek":
      return jakartaThisWeekRange(todayYmd);
    case "lastWeek":
      return jakartaLastWeekRange(todayYmd);
    case "thisMonth":
      return jakartaThisMonthRange(todayYmd);
    case "lastMonth":
      return jakartaLastMonthRange(todayYmd);
    case "maximum": {
      if (maximumBounds?.min && maximumBounds?.max) {
        return { from: maximumBounds.min, to: maximumBounds.max };
      }
      return { from: todayYmd, to: todayYmd };
    }
    case "custom":
    default:
      return jakartaLastNDaysInclusive(todayYmd, 30);
  }
}
