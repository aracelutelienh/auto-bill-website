import { getOrCreateConversation, json, withCors, handleOptions, cleanupExpired } from "../_lib.js";
export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return handleOptions(request);
  try {
    await cleanupExpired(env);
    const sid = new URL(request.url).searchParams.get("sessionId");
    if (!sid) return withCors(json({ unread: false }), request);
    const c = await getOrCreateConversation(env, sid, "Khách hàng");
    return withCors(json({ unread: !!c.customer_unread }), request);
  } catch (e) { return withCors(json({ unread: false }), request); }
}
