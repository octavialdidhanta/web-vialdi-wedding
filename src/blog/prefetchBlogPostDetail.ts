import type { QueryClient } from "@tanstack/react-query";
import { getRequiredWebId } from "@/analytics/sendAnalyticsBatch";
import { fetchPublishedPostBySlug } from "@/blog/agencySupabaseBlog";

/**
 * Prefetch detail artikel + chunk halaman agar navigasi dari /blog terasa instan;
 * membantu LCP bila pengguna baru membuka tab setelah hover.
 */
export function prefetchBlogPostDetail(queryClient: QueryClient, slug: string) {
  if (!slug?.trim()) return;
  const webId = getRequiredWebId();
  void queryClient.prefetchQuery({
    queryKey: ["blog", "post", webId, slug],
    queryFn: () => fetchPublishedPostBySlug(slug),
    staleTime: 60_000,
  });
  void import("@/blog/BlogPostPage");
}
