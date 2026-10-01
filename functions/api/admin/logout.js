import { clearAdminCookie, withCors, handleOptions } from "../../_lib.js";
export async function onRequest(context) {
  const { request } = context;
  if (request.method === "OPTIONS") return handleOptions(request);
  return withCors(new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json; charset=utf-8", "Set-Cookie": clearAdminCookie() } }), request);
}
