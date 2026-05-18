/**
 * DEPRECATED — use contact-submit (hub). Kept deployed briefly for rollback monitoring.
 */
function json(data: unknown, status = 410) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "POST, OPTIONS",
        "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }
  return json({
    error: "wedding-package-lead is retired. Update the site to call contact-submit (hub migration).",
    migrate_to: "contact-submit",
  });
});
