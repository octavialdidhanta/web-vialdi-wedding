import type { QueryClient } from "@tanstack/react-query";
import { fetchPublishedPostBySlug } from "@/blog/agencySupabaseBlog";

/**
 * Prefetch detail artikel + chunk halaman agar navigasi dari /blog terasa instan;
 * membantu LCP bila pengguna baru membuka tab setelah hover.
 */
export function prefetchBlogPostDetail(queryClient: QueryClient, slug: string) {
  if (!slug?.trim()) return;
  void queryClient.prefetchQuery({
    queryKey: ["blog", "post", slug],
    queryFn: () => fetchPublishedPostBySlug(slug),
    staleTime: 60_000,
  });
  void import("@/blog/BlogPostPage");
}
