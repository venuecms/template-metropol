import {
  EventsSkeleton,
  FeaturedEventsSkeleton,
  ProductsSkeleton,
  SiteContentSkeleton,
} from "@/components/HomePage/LoadingSkeletons";

export default function Loading() {
  return (
    <>
      <FeaturedEventsSkeleton />
      <EventsSkeleton />
      <SiteContentSkeleton />
      <ProductsSkeleton />
    </>
  );
}
