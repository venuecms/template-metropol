import { Profile } from "@/components";
import { getGenerateMetadata } from "@/lib";
import { Params } from "@/types";
import { type SearchParams, getProfile, getSite } from "@venuecms/sdk-next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import {
  RelatedArtists,
  showsRelatedArtists,
} from "@/components/RelatedArtists";
import { setupSSR } from "@/components/utils";
import { ErrorBoundary } from "@/components/utils/ErrorBoundary";

export const generateMetadata = getGenerateMetadata(getProfile);

const ArtistPage = async ({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string } & Params>;
  // Read here and handed down because only a route segment can: a listing block
  // sits too deep inside the content to ask for the URL it is being paged by.
  searchParams: Promise<SearchParams>;
}) => {
  const { slug } = await params;
  await setupSSR({ params });

  const [{ data: profile }, { data: site }] = await Promise.all([
    getProfile({ slug }),
    getSite(),
  ]);

  if (!profile) {
    notFound();
  }

  return (
    <>
      <Profile profile={profile} searchParams={await searchParams} />
      {site && showsRelatedArtists(site) ? (
        // Its own boundary: the related grid fetches more records, and the
        // artist's page should not wait on them — nor fail with them.
        <ErrorBoundary fallback={null}>
          <Suspense fallback={null}>
            <RelatedArtists profile={profile} site={site} />
          </Suspense>
        </ErrorBoundary>
      ) : null}
    </>
  );
};

export default ArtistPage;
