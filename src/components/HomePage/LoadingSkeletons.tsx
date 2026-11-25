import { EventsList } from "@/components/EventList";
import { FullWidthLayout } from "@/components/layout";
import { Skeleton } from "@/components/ui/Input/Skeleton";

/**
 * Mirrors a featured event: the screen below the header, less the side
 * padding's width at the bottom. Assumes the desktop header's 5rem, as the
 * loaded image does before it measures.
 */
export function FeaturedEventsSkeleton() {
  return (
    <div className="flex flex-col pb-16">
      <Skeleton className="h-[calc(100svh-6.5rem)] min-h-80 w-full sm:h-[calc(100svh-8rem)]" />
    </div>
  );
}

export function EventsSkeleton() {
  return (
    <FullWidthLayout>
      <EventsList className="gap-y-4 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex flex-col gap-8 pb-8 sm:gap-0">
            <div className="w-full pb-3">
              <Skeleton className="aspect-video" />
            </div>
            <div className="flex flex-col gap-1">
              <Skeleton className="w-32" />
              <Skeleton className="w-48" />
              <Skeleton className="w-24" />
            </div>
          </div>
        ))}
      </EventsList>
    </FullWidthLayout>
  );
}

export function SiteContentSkeleton() {
  return (
    <FullWidthLayout>
      <div className="flex max-w-2xl flex-col gap-2">
        <Skeleton />
        <Skeleton />
        <Skeleton className="w-3/4" />
      </div>
    </FullWidthLayout>
  );
}

export function ProductsSkeleton() {
  return (
    <section className="py-20">
      <div className="pb-8">
        <Skeleton className="w-16" />
      </div>

      <div className="grid grid-cols-2 gap-8 pb-20 sm:max-w-full sm:grid-cols-4 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col gap-3">
            <Skeleton className="aspect-square" />
            <div className="flex flex-col gap-1">
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
