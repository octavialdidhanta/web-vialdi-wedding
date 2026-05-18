import { useQuery } from "@tanstack/react-query";
import { getRequiredWebId } from "@/analytics/sendAnalyticsBatch";
import { fetchPublishedPostBySlug, fetchPublishedPosts } from "@/blog/agencySupabaseBlog";

export function usePublishedPostsQuery() {
  const webId = getRequiredWebId();
  return useQuery({
    queryKey: ["blog", "posts", webId],
    queryFn: fetchPublishedPosts,
    staleTime: 60_000,
  });
}

export function usePublishedPostQuery(slug: string | undefined) {
  const webId = getRequiredWebId();
  return useQuery({
    queryKey: ["blog", "post", webId, slug],
    queryFn: () => fetchPublishedPostBySlug(slug!),
    enabled: Boolean(slug),
    staleTime: 60_000,
  });
}
