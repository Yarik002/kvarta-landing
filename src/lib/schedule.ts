/**
 * Расписание обжарки: четверг — обжарка, пятница — развозка,
 * заказы на партию принимаем до среды 20:00 (Минск, UTC+3, без перехода на летнее время).
 *
 * Считаем на сервере при рендере страницы (ISR раз в час), поэтому на странице
 * всегда актуальные даты без клиентского JS.
 */

const MINSK_OFFSET_MS = 3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const ROAST_WEEKDAY = 4; // четверг (0 — воскресенье)
const ROAST_CUTOFF_HOUR = 20;

export interface RoastSchedule {
  /** Четверг ближайшей обжарки, 8:00 по Минску. */
  roastDate: Date;
  /** Пятница развозки, 9:00 по Минску. */
  deliveryDate: Date;
  /** Среда 20:00, дедлайн заказов на эту обжарку. */
  orderDeadline: Date;
  /** Календарных дней до обжарки: 0 — сегодня. */
  daysUntilRoast: number;
  isRoastToday: boolean;
  /** «22 октября» */
  roastDateLabel: string;
  /** «23 октября» */
  deliveryDateLabel: string;
  /** «21 октября» */
  orderDeadlineLabel: string;
}

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  timeZone: "Europe/Minsk",
});

interface MinskParts {
  year: number;
  month: number;
  day: number;
  weekday: number;
  hour: number;
}

function getMinskParts(date: Date): MinskParts {
  const shifted = new Date(date.getTime() + MINSK_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
    weekday: shifted.getUTCDay(),
    hour: shifted.getUTCHours(),
  };
}

/** Момент времени по календарной дате Минска. */
function fromMinskDate(year: number, month: number, day: number, hour: number): Date {
  return new Date(Date.UTC(year, month, day, hour, 0, 0, 0) - MINSK_OFFSET_MS);
}

export function getRoastSchedule(now: Date = new Date()): RoastSchedule {
  const parts = getMinskParts(now);

  let daysAhead: number;
  if (parts.weekday === ROAST_WEEKDAY) {
    // В четверг до 20:00 партия ещё «сегодняшняя», после — уже следующая неделя.
    daysAhead = parts.hour < ROAST_CUTOFF_HOUR ? 0 : 7;
  } else {
    daysAhead = (ROAST_WEEKDAY - parts.weekday + 7) % 7;
  }

  const roastDayUtc = Date.UTC(parts.year, parts.month, parts.day) + daysAhead * DAY_MS;
  const roastCalendar = new Date(roastDayUtc);
  const roastYear = roastCalendar.getUTCFullYear();
  const roastMonth = roastCalendar.getUTCMonth();
  const roastDay = roastCalendar.getUTCDate();

  const roastDate = fromMinskDate(roastYear, roastMonth, roastDay, 8);
  const deliveryDate = fromMinskDate(roastYear, roastMonth, roastDay + 1, 9);
  const orderDeadline = fromMinskDate(roastYear, roastMonth, roastDay - 1, 20);

  return {
    roastDate,
    deliveryDate,
    orderDeadline,
    daysUntilRoast: daysAhead,
    isRoastToday: daysAhead === 0,
    roastDateLabel: dateFormatter.format(roastDate),
    deliveryDateLabel: dateFormatter.format(deliveryDate),
    orderDeadlineLabel: dateFormatter.format(orderDeadline),
  };
}
