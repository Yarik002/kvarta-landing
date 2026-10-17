import { describe, expect, it } from "vitest";
import { getRoastSchedule } from "@/lib/schedule";

// Минск — UTC+3 без перехода на летнее время, поэтому фиксируем моменты в ISO с +03:00.
function minsk(iso: string): Date {
  return new Date(iso);
}

describe("getRoastSchedule", () => {
  it("в субботу показывает ближайший четверг и следующую пятницу", () => {
    const schedule = getRoastSchedule(minsk("2026-10-17T13:25:00+03:00"));

    expect(schedule.roastDate.toISOString()).toBe("2026-10-22T05:00:00.000Z");
    expect(schedule.deliveryDate.toISOString()).toBe("2026-10-23T06:00:00.000Z");
    expect(schedule.orderDeadline.toISOString()).toBe("2026-10-21T17:00:00.000Z");
    expect(schedule.roastDateLabel).toBe("22 октября");
    expect(schedule.deliveryDateLabel).toBe("23 октября");
    expect(schedule.orderDeadlineLabel).toBe("21 октября");
    expect(schedule.daysUntilRoast).toBe(5);
    expect(schedule.isRoastToday).toBe(false);
  });

  it("во вторник показывает четверг этой же недели", () => {
    const schedule = getRoastSchedule(minsk("2026-10-20T09:00:00+03:00"));
    expect(schedule.daysUntilRoast).toBe(2);
    expect(schedule.roastDateLabel).toBe("22 октября");
  });

  it("в четверг до 20:00 обжарка считается сегодняшней", () => {
    const schedule = getRoastSchedule(minsk("2026-10-22T07:40:00+03:00"));
    expect(schedule.isRoastToday).toBe(true);
    expect(schedule.daysUntilRoast).toBe(0);
    expect(schedule.roastDateLabel).toBe("22 октября");
    expect(schedule.deliveryDateLabel).toBe("23 октября");
  });

  it("в четверг после 20:00 переключается на следующую неделю", () => {
    const schedule = getRoastSchedule(minsk("2026-10-22T21:00:00+03:00"));
    expect(schedule.isRoastToday).toBe(false);
    expect(schedule.daysUntilRoast).toBe(7);
    expect(schedule.roastDateLabel).toBe("29 октября");
  });

  it("в пятницу показывает следующий четверг", () => {
    const schedule = getRoastSchedule(minsk("2026-10-23T12:00:00+03:00"));
    expect(schedule.daysUntilRoast).toBe(6);
    expect(schedule.roastDateLabel).toBe("29 октября");
  });

  it("корректно переходит через границу месяца и года", () => {
    // 31 декабря 2026 — четверг: обжарка сегодня, развозка — 1 января.
    const newYear = getRoastSchedule(minsk("2026-12-31T10:00:00+03:00"));
    expect(newYear.isRoastToday).toBe(true);
    expect(newYear.roastDateLabel).toBe("31 декабря");
    expect(newYear.deliveryDateLabel).toBe("1 января");
    expect(newYear.orderDeadlineLabel).toBe("30 декабря");
  });
});
