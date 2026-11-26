import { Skeleton } from "@/components/ui/Input/Skeleton";

/** Mirrors the product page: title, variants row, body beside image. */
export default function Loading() {
  return (
    <div className="flex flex-col gap-12 pb-6 pt-6 lg:gap-16 lg:pb-24">
      <div className="flex flex-col gap-10 lg:gap-14">
        <div className="flex flex-col gap-6 lg:gap-10">
          <div className="flex flex-col gap-2">
            <Skeleton className="w-48" />
            <Skeleton className="h-12 w-3/4" />
          </div>

          <div className="flex items-center gap-6">
            <Skeleton className="w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        <div className="grid gap-12 lg:grid-cols-3">
          <div className="flex flex-col gap-4 lg:order-2 lg:col-span-2">
            <Skeleton className="aspect-video" />
          </div>
          <div className="flex flex-col gap-2 lg:order-1">
            <Skeleton />
            <Skeleton />
            <Skeleton className="w-3/4" />
            <Skeleton />
            <Skeleton className="w-5/6" />
          </div>
        </div>
      </div>
    </div>
  );
}
