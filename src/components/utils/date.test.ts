import { describe, expect, it } from "vitest";

import {
  formatDate,
  formatDateRange,
  formatDateRangeParts,
  formatTime,
  isMultiDayEvent,
  sameDayLabel,
} from "./date";

const timeZone = "Europe/Bratislava";

describe("formatDate", () => {
  it("keeps the English format by default", () => {
    expect(
      formatDate({
        date: "2026-11-16T19:00:00+01:00",
        timeZone,
        template: "EEEE d MMMM yyyy",
      }),
    ).toBe("Monday 16 November 2026 7pm");
  });

  it("writes Slovak dates with ordinal days, genitive months and 24h time", () => {
    expect(
      formatDate({
        date: "2026-11-16T19:30:00+01:00",
        timeZone,
        template: "EEEE d MMMM yyyy",
        locale: "sk",
      }),
    ).toBe("pondelok, 16. novembra 2026 19:30");
  });

  it("localizes a date-only Slovak template", () => {
    expect(
      formatDate({
        date: "2026-11-16T19:30:00+01:00",
        timeZone,
        withTime: false,
        template: "d MMMM yyyy",
        locale: "sk",
      }),
    ).toBe("16. novembra 2026");
  });

  it("abbreviates the weekday and month with a short template", () => {
    const short = (locale?: string) =>
      formatDate({
        date: "2026-11-18T19:30:00+01:00",
        timeZone,
        withTime: false,
        template: "EEE d MMM yyyy",
        locale,
      });

    expect(short()).toBe("Wed 18 Nov 2026");
    expect(short("sk")).toBe("st, 18. nov 2026");
    expect(short("sv")).toBe("ons 18 nov. 2026");
  });

  it("abbreviates a range's months when the template does", () => {
    const range = (start: string, end: string) =>
      formatDateRange({ start, end, timeZone, template: "EEE d MMM yyyy" });

    expect(
      range("2026-11-30T19:00:00+01:00", "2026-12-02T19:00:00+01:00"),
    ).toBe("30 Nov — 2 Dec 2026");
    expect(
      range("2026-11-16T19:00:00+01:00", "2026-11-18T19:00:00+01:00"),
    ).toBe("16—18 Nov 2026");
  });
});

describe("formatDateRange", () => {
  it("formats an English range across months", () => {
    expect(
      formatDateRange({
        start: "2026-11-30T19:00:00+01:00",
        end: "2026-12-02T19:00:00+01:00",
        timeZone,
      }),
    ).toBe("30 November — 2 December 2026");
  });

  it("formats a Slovak range within a month", () => {
    expect(
      formatDateRange({
        start: "2026-11-16T19:00:00+01:00",
        end: "2026-11-20T19:00:00+01:00",
        timeZone,
        locale: "sk",
      }),
    ).toBe("16.—20. novembra 2026");
  });

  it("formats a Slovak range across months", () => {
    expect(
      formatDateRange({
        start: "2026-11-30T19:00:00+01:00",
        end: "2026-12-02T19:00:00+01:00",
        timeZone,
        locale: "sk",
      }),
    ).toBe("30. novembra — 2. decembra 2026");
  });

  it("treats the same weekday a week later as a multi-day range", () => {
    expect(
      formatDateRange({
        start: "2026-11-16T19:00:00+01:00",
        end: "2026-11-23T19:00:00+01:00",
        timeZone,
      }),
    ).toBe("16—23 November 2026");
  });
});

describe("formatTime", () => {
  it("writes an English time the way the date line does", () => {
    expect(formatTime({ date: "2026-11-16T20:00:00+01:00", timeZone })).toBe(
      "8pm",
    );
    expect(formatTime({ date: "2026-11-16T19:30:00+01:00", timeZone })).toBe(
      "7.30pm",
    );
  });

  it("writes a Slovak time on the 24-hour clock", () => {
    expect(
      formatTime({
        date: "2026-11-16T20:00:00+01:00",
        timeZone,
        locale: "sk",
      }),
    ).toBe("20:00");
  });

  it("writes a Swedish time after kl. on the 24-hour clock", () => {
    expect(
      formatTime({ date: "2026-11-16T21:00:00+01:00", timeZone, locale: "sv" }),
    ).toBe("kl. 21");
    expect(
      formatTime({ date: "2026-11-16T21:30:00+01:00", timeZone, locale: "sv" }),
    ).toBe("kl. 21:30");
  });
});

describe("formatDate in Swedish", () => {
  it("writes Swedish names and a kl. time", () => {
    expect(
      formatDate({
        date: "2026-11-16T21:00:00+01:00",
        timeZone,
        template: "EEEE d MMMM yyyy",
        locale: "sv",
      }),
    ).toBe("måndag 16 november 2026 kl. 21");
  });
});

describe("formatDateRangeParts", () => {
  it("keeps a single-day event's time apart from its date", () => {
    expect(
      formatDateRangeParts({
        start: "2026-11-16T21:30:00+01:00",
        end: "2026-11-16T23:00:00+01:00",
        timeZone,
        withTime: true,
        locale: "sv",
      }),
    ).toEqual({ date: "måndag 16 november 2026", time: "kl. 21:30" });
  });

  it("gives a multi-day range no time", () => {
    expect(
      formatDateRangeParts({
        start: "2026-11-16T21:30:00+01:00",
        end: "2026-11-18T23:00:00+01:00",
        timeZone,
        withTime: true,
      }).time,
    ).toBeNull();
  });

  it("gives a night ending before 8am the next day a single date", () => {
    expect(
      formatDateRangeParts({
        start: "2026-11-27T21:00:00+01:00",
        end: "2026-11-28T03:00:00+01:00",
        timeZone,
        withTime: true,
      }),
    ).toEqual({ date: "Friday 27 November 2026", time: "9pm" });
  });

  it("keeps an overnight event across a month end on a single date", () => {
    expect(
      formatDateRangeParts({
        start: "2026-11-30T22:00:00+01:00",
        end: "2026-12-01T07:59:00+01:00",
        timeZone,
        withTime: false,
      }).date,
    ).toBe("Monday 30 November 2026");
  });

  it("treats an end at 8am the next day as a multi-day range", () => {
    expect(
      formatDateRangeParts({
        start: "2026-11-27T21:00:00+01:00",
        end: "2026-11-28T08:00:00+01:00",
        timeZone,
        withTime: true,
      }),
    ).toEqual({ date: "27—28 November 2026", time: null });
  });

  it("treats an early end two days later as a multi-day range", () => {
    expect(
      formatDateRangeParts({
        start: "2026-11-27T21:00:00+01:00",
        end: "2026-11-29T03:00:00+01:00",
        timeZone,
        withTime: true,
      }).time,
    ).toBeNull();
  });
});

describe("isMultiDayEvent", () => {
  it("is false for an event with no end", () => {
    expect(
      isMultiDayEvent({ start: "2026-11-27T21:00:00+01:00", timeZone }),
    ).toBe(false);
  });

  it("is false for a night ending before 8am the next day", () => {
    expect(
      isMultiDayEvent({
        start: "2026-11-27T21:00:00+01:00",
        end: "2026-11-28T03:00:00+01:00",
        timeZone,
      }),
    ).toBe(false);
  });

  it("is true for an end at 8am the next day", () => {
    expect(
      isMultiDayEvent({
        start: "2026-11-27T21:00:00+01:00",
        end: "2026-11-28T08:00:00+01:00",
        timeZone,
      }),
    ).toBe(true);
  });
});

describe("sameDayLabel", () => {
  // Midday in Bratislava on 24 November.
  const now = new Date("2026-11-24T12:00:00+01:00");

  it("reads a start from 5pm today as tonight", () => {
    expect(
      sameDayLabel({
        start: "2026-11-24T17:00:00+01:00",
        hasTime: true,
        now,
        timeZone,
      }),
    ).toBe("tonight");
  });

  it("reads a start before 5pm today as today", () => {
    expect(
      sameDayLabel({
        start: "2026-11-24T16:59:00+01:00",
        hasTime: true,
        now,
        timeZone,
      }),
    ).toBe("today");
  });

  it("reads an event with no time set as today", () => {
    expect(
      sameDayLabel({
        start: "2026-11-24T20:00:00+01:00",
        hasTime: false,
        now,
        timeZone,
      }),
    ).toBe("today");
  });

  it("gives nothing for another day, so the date shows", () => {
    expect(
      sameDayLabel({
        start: "2026-11-25T20:00:00+01:00",
        hasTime: true,
        now,
        timeZone,
      }),
    ).toBeNull();
  });

  it("judges the day in the venue's zone, not UTC", () => {
    // 00:30 on the 25th in Bratislava is still the 24th in UTC.
    expect(
      sameDayLabel({
        start: "2026-11-25T00:30:00+01:00",
        hasTime: true,
        now: new Date("2026-11-24T23:00:00Z"),
        timeZone,
      }),
    ).toBe("today");
  });
});
