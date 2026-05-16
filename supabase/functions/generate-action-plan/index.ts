import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async (req) => {
  const payload = await req.json();
  return new Response(JSON.stringify({ status: "queued", payload }), {
    headers: { "content-type": "application/json" },
  });
});
