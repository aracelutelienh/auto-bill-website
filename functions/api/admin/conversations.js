import { isAdmin, json, withCors, handleOptions, cleanupExpired } from "../../_lib.js";
export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return handleOptions(request);
  if (!(await isAdmin(request, env))) return withCors(json({ error: "Unauthorized" }, 401), request);
  try {
    await cleanupExpired(env);
    const { results = [] } = await env.DB.prepare(`SELECT id,session_id,customer_name,created_at,updated_at,customer_unread,admin_unread FROM conversations ORDER BY updated_at DESC`).all();
    return withCors(json({ conversations: results }), request);
  } catch (e) { return withCors(json({ error: e.message }, 500), request); }
}
