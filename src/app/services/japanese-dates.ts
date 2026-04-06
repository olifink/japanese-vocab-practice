export interface WeekdayEntry {
  japanese: string;
  english: string;
  jsDay: number; // 0 = Sunday (JS Date convention)
}

export interface MonthEntry {
  number: number;
  japanese: string;
  english: string;
}

export interface DayEntry {
  number: number;
  japanese: string;
}

// Monday-first order, matching natural Japanese week learning order
export const WEEKDAYS: WeekdayEntry[] = [
  { japanese: '月曜日', english: 'Monday', jsDay: 1 },
  { japanese: '火曜日', english: 'Tuesday', jsDay: 2 },
  { japanese: '水曜日', english: 'Wednesday', jsDay: 3 },
  { japanese: '木曜日', english: 'Thursday', jsDay: 4 },
  { japanese: '金曜日', english: 'Friday', jsDay: 5 },
  { japanese: '土曜日', english: 'Saturday', jsDay: 6 },
  { japanese: '日曜日', english: 'Sunday', jsDay: 0 },
];

export const MONTHS: MonthEntry[] = [
  { number: 1, japanese: '1月', english: 'January' },
  { number: 2, japanese: '2月', english: 'February' },
  { number: 3, japanese: '3月', english: 'March' },
  { number: 4, japanese: '4月', english: 'April' },
  { number: 5, japanese: '5月', english: 'May' },
  { number: 6, japanese: '6月', english: 'June' },
  { number: 7, japanese: '7月', english: 'July' },
  { number: 8, japanese: '8月', english: 'August' },
  { number: 9, japanese: '9月', english: 'September' },
  { number: 10, japanese: '10月', english: 'October' },
  { number: 11, japanese: '11月', english: 'November' },
  { number: 12, japanese: '12月', english: 'December' },
];

export const DAYS: DayEntry[] = Array.from({ length: 31 }, (_, i) => ({
  number: i + 1,
  japanese: `${i + 1}日`,
}));

export function getWeekdayEntry(jsDay: number): WeekdayEntry | undefined {
  return WEEKDAYS.find(w => w.jsDay === jsDay);
}
