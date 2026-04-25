import { useQuery } from "@tanstack/react-query";
import { fetchPublishedPostBySlug, fetchPublishedPosts } from "@/blog/agencySupabaseBlog";

export function usePublishedPostsQuery() {
  return useQuery({
    queryKey: ["blog", "posts"],
    queryFn: fetchPublishedPosts,
    staleTime: 60_000,
  });
}

export function usePublishedPostQuery(slug: string | undefined) {
  return useQuery({
    queryKey: ["blog", "post", slug],
    queryFn: () => fetchPublishedPostBySlug(slug!),
    enabled: Boolean(slug),
    staleTime: 60_000,
  });
}
