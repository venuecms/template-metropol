import { Link } from "@/lib/i18n";
import { cn } from "@/lib/utils";

import { formatDateRangeParts } from "../utils";

/**
 * An event's date line in a listing: the date followed, for a single-day
 * event with a time, by the start time.
 */
export const EventDate = ({
  href,
  start,
  end,
  withTime,
  template,
  timeZone,
  locale,
  className,
}: {
  href: string;
  start: string;
  end: string;
  withTime?: boolean;
  template?: string;
  timeZone: string;
  locale: string;
  className?: string;
}) => {
  const { date, time } = formatDateRangeParts({
    start,
    end,
    withTime,
    template,
    timeZone,
    locale,
  });

  return (
    <div className={cn("text-secondary", className)}>
      <Link href={href}>
        {date}
        {time ? <span className="ml-[3ch]">{time}</span> : null}
      </Link>
    </div>
  );
};
