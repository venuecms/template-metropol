import { type SearchParams } from "@venuecms/sdk-next";
import { Suspense } from "react";

import { ErrorBoundary } from "@/components/utils/ErrorBoundary";

import { SiteContentError } from "./ErrorFallbacks";
import { SiteContentSkeleton } from "./LoadingSkeletons";
import { SiteContent } from "./SiteContent";

export function SiteContentSection({
  locale,
  searchParams,
}: {
  locale: string;
  /**
   * Forwarded unawaited, so the wait happens inside the Suspense boundary below
   * rather than in the home route above it.
   */
  searchParams: Promise<SearchParams>;
}) {
  return (
    <ErrorBoundary fallback={<SiteContentError />}>
      <Suspense fallback={<SiteContentSkeleton />}>
        <SiteContent locale={locale} searchParams={searchParams} />
      </Suspense>
    </ErrorBoundary>
  );
}
