/**
 * The homepage's featured events query, shared by the featured section and the
 * grid below it. Both ask with exactly these arguments, so the SDK's cache
 * serves the grid the same records rather than fetching them again, and the
 * grid leaves out precisely what is featured above it.
 */
export const featuredEventsQuery = { limit: 6, featured: true } as const;
