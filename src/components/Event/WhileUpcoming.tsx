import type { Event } from "@venuecms/sdk-next";
import { connection } from "next/server";
import type { ReactNode } from "react";

import { isPastEvent } from "./past";

/**
 * Renders its children only while the event is not yet over, and `past`
 * (nothing, unless given) once it is.
 *
 * The event page is prerendered, so whether it is past can only be told at
 * request time: this reads the clock behind `connection()`, and must sit in a
 * Suspense boundary of its own so the rest of the page stays static.
 */
export async function WhileUpcoming({
  event,
  children,
  past = null,
}: {
  event: Pick<Event, "startDate" | "endDate">;
  children: ReactNode;
  past?: ReactNode;
}) {
  await connection();

  return isPastEvent(event) ? past : children;
}
