/**
 * Shims for Supabase Edge Functions (Deno runtime). The app Vite/TS project
 * does not load Deno types by default; this file satisfies the editor/tsc
 * when opening files under supabase/functions/.
 */
declare const Deno: {
  env: { get(key: string): string | undefined };
  serve: (handler: (request: Request) => Response | Promise<Response>) => void;
};

declare module "https://esm.sh/@supabase/supabase-js@2.49.1" {
  /** Edge runtime uses this URL; editor resolves it here without strict DB generics. */
  export function createClient(
    supabaseUrl: string,
    supabaseKey: string,
    options?: Record<string, unknown>,
  ): import("@supabase/supabase-js").SupabaseClient<any, "public", any>;
}
