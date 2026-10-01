import { isAdmin, json, withCors, handleOptions } from "../../_lib.js";
export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return handleOptions(request);
  return withCors(json({ authenticated: await isAdmin(request, env) }), request);
}
