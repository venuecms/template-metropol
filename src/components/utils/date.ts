import { TZDate } from "@date-fns/tz";
import { type Locale as DateFnsLocale, format } from "date-fns";
import { sk } from "date-fns/locale";

/**
 * How one language writes dates and times. A locale without an entry here
 * keeps the English formatting the templates are written in.
 */
type DateLocale = {
  dateFnsLocale?: DateFnsLocale;
  /** Rewrites an English-style template (`d MMMM yyyy`) for this language. */
  localizeTemplate: (template: string) => string;
  /** Suffix appended to the template when the record has a time. */
  time: string;
  /** Tidies the formatted string, e.g. dropping `.00` from on-the-hour times. */
  clean: (formatted: string) => string;
  /** Day of the month on its own, as the start of a range (`16` / `16.`). */
  rangeDay: string;
};

const english: DateLocale = {
  localizeTemplate: (template) => template,
  time: " • h.mmaaa",
  clean: (formatted) => formatted.split(".00").join(""),
  rangeDay: "d",
};

const dateLocales: Record<string, DateLocale> = {
  // Slovak writes the day as an ordinal (`16. novembra 2026`), puts a comma
  // after the weekday, and uses the 24-hour clock. date-fns' `MMMM` gives the
  // genitive month name Slovak needs after a day number.
  sk: {
    dateFnsLocale: sk,
    localizeTemplate: (template) =>
      template.replace(/EEEE d\b/g, "EEEE, d").replace(/\bd\b/g, "d."),
    time: " • H:mm",
    clean: (formatted) => formatted,
    rangeDay: "d.",
  },
};

const dateLocaleFor = (locale?: string) =>
  (locale && dateLocales[locale]) || english;

/**
 * Formats a record date in the venue's zone. `timeZone` is optional because
 * the SDK types it as nullable on Site; TZDate falls back to the runtime zone
 * when it is absent, which is the best available guess.
 */
export const formatDate = ({
  date,
  withTime = true,
  timeZone,
  template,
  locale,
}: {
  date: string;
  withTime?: boolean;
  timeZone?: string;
  template: string;
  locale?: string;
}) => {
  const dateLocale = dateLocaleFor(locale);
  const pattern = dateLocale.localizeTemplate(template);
  const options = { locale: dateLocale.dateFnsLocale };

  if (withTime) {
    return dateLocale.clean(
      format(
        new TZDate(date, timeZone),
        `${pattern}${dateLocale.time}`,
        options,
      ),
    );
  }
  return format(new TZDate(date, timeZone), pattern, options);
};

export const formatDateRange = ({
  start,
  end,
  timeZone,
  withTime,
  template = "EEEE d MMMM yyyy",
  locale,
}: {
  start: string;
  end: string;
  timeZone: string;
  withTime?: boolean;
  template?: string;
  locale?: string;
}) => {
  const startDate = new TZDate(start, timeZone);
  const endDate = new TZDate(end, timeZone);

  const isMultiDay =
    startDate.getDate() !== endDate.getDate() ||
    startDate.getMonth() !== endDate.getMonth() ||
    startDate.getFullYear() !== endDate.getFullYear();

  if (!isMultiDay) {
    return formatDate({ date: start, withTime, template, timeZone, locale });
  }

  const dateLocale = dateLocaleFor(locale);
  const options = { locale: dateLocale.dateFnsLocale };

  const isSameMonth =
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getFullYear() === endDate.getFullYear();

  const endLabel = formatDate({
    date: end,
    withTime: false,
    timeZone,
    template: "d MMMM yyyy",
    locale,
  });

  if (isSameMonth) {
    return `${format(startDate, dateLocale.rangeDay, options)}—${endLabel}`;
  }

  const startLabel = format(
    startDate,
    dateLocale.localizeTemplate("d MMMM"),
    options,
  );
  return `${startLabel} — ${endLabel}`;
};

/**
 * A record's time of day alone, in the venue's zone, written the way the
 * language writes a time after a date: `8pm` / `7.30pm` in English, `20:00`
 * in Slovak. For the event page's start and end times.
 */
export const formatTime = ({
  date,
  timeZone,
  locale,
}: {
  date: string;
  timeZone?: string;
  locale?: string;
}) => {
  const dateLocale = dateLocaleFor(locale);
  // The time pattern each language appends after a date, minus its separator.
  const pattern = dateLocale.time.replace(/^\s*•\s*/, "");

  return dateLocale.clean(
    format(new TZDate(date, timeZone), pattern, {
      locale: dateLocale.dateFnsLocale,
    }),
  );
};

/** The hour, in the venue's zone, from which a same-day start is "tonight". */
const EVENING_HOUR = 17;

/**
 * Whether an event starts today in the venue's zone and, if so, whether that
 * reads as today or tonight: `tonight` for a start at 5pm or later, `today`
 * for one before. `null` for any other day, when the date itself is shown.
 *
 * An event with no time set has no start hour to judge by, so it is `today`.
 */
export const sameDayLabel = ({
  start,
  hasTime,
  now,
  timeZone,
}: {
  start: string;
  hasTime: boolean;
  now: Date;
  timeZone?: string;
}): "today" | "tonight" | null => {
  const startDate = new TZDate(start, timeZone);
  const today = new TZDate(now, timeZone);

  if (Number.isNaN(startDate.getTime())) {
    return null;
  }

  const sameDay =
    startDate.getFullYear() === today.getFullYear() &&
    startDate.getMonth() === today.getMonth() &&
    startDate.getDate() === today.getDate();

  if (!sameDay) {
    return null;
  }

  return hasTime && startDate.getHours() >= EVENING_HOUR ? "tonight" : "today";
};
