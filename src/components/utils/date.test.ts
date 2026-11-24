import { describe, expect, it } from "vitest";

import { formatDate, formatDateRange, formatTime, sameDayLabel } from "./date";

const timeZone = "Europe/Bratislava";

describe("formatDate", () => {
  it("keeps the English format by default", () => {
    expect(
      formatDate({
        date: "2026-11-16T19:00:00+01:00",
        timeZone,
        template: "EEEE d MMMM yyyy",
      }),
    ).toBe("Monday 16 November 2026 • 7pm");
  });

  it("writes Slovak dates with ordinal days, genitive months and 24h time", () => {
    expect(
      formatDate({
        date: "2026-11-16T19:30:00+01:00",
        timeZone,
        template: "EEEE d MMMM yyyy",
        locale: "sk",
      }),
    ).toBe("pondelok, 16. novembra 2026 • 19:30");
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
