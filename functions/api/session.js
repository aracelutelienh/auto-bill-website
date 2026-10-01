import { getOrCreateConversation, getMessages, json, withCors, handleOptions, cleanupExpired } from "../_lib.js";

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return handleOptions(request);
  try {
    await cleanupExpired(env);
    if (request.method !== "GET" && request.method !== "POST") return withCors(json({ error: "Method not allowed" }, 405), request);
    const body = request.method === "POST" ? await request.json() : {};
    const url = new URL(request.url);
    const sessionId = body.sessionId || url.searchParams.get("sessionId");
    const customerName = body.customerName || "Khách hàng";
    const conversation = await getOrCreateConversation(env, sessionId, customerName);
    if (request.method === "GET") {
      await env.DB.prepare("UPDATE conversations SET customer_unread=0 WHERE id=?").bind(conversation.id).run();
    }
    const messages = await getMessages(env, conversation.id);
    return withCors(json({ conversation, messages }), request);
  } catch (e) {
    return withCors(json({ error: e.message || "Server error" }, 400), request);
  }
}
