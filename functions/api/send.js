import { getOrCreateConversation, getMessages, json, withCors, handleOptions, cleanupExpired, id, now, validateImage, MAX_TEXT } from "../_lib.js";

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return handleOptions(request);
  if (request.method !== "POST") return withCors(json({ error: "Method not allowed" }, 405), request);
  try {
    await cleanupExpired(env);
    const form = await request.formData();
    const sessionId = String(form.get("sessionId") || "");
    const customerName = String(form.get("customerName") || "Khách hàng").trim().slice(0, 80) || "Khách hàng";
    const text = String(form.get("text") || "").trim().slice(0, MAX_TEXT);
    const file = validateImage(form.get("image"));
    if (!text && !file) return withCors(json({ error: "Tin nhắn trống." }, 400), request);
    const conversation = await getOrCreateConversation(env, sessionId, customerName);
    let imageKey = null, imageType = null, imageName = null;
    if (file) {
      imageKey = `${conversation.id}/${id()}-${(file.name || "image").replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      imageType = file.type;
      imageName = file.name || "image";
      await env.CHAT_FILES.put(imageKey, file.stream(), { httpMetadata: { contentType: imageType, cacheControl: "private, max-age=3600" } });
    }
    const messageId = id();
    const created = now();
    await env.DB.prepare(`INSERT INTO messages (id,conversation_id,sender,text,image_key,image_type,image_name,created_at) VALUES (?,?,?,?,?,?,?,?)`)
      .bind(messageId, conversation.id, "customer", text, imageKey, imageType, imageName, created).run();
    await env.DB.prepare("UPDATE conversations SET customer_name=?, updated_at=?, admin_unread=1 WHERE id=?")
      .bind(customerName, created, conversation.id).run();
    const messages = await getMessages(env, conversation.id);
    return withCors(json({ ok: true, messages }), request);
  } catch (e) {
    return withCors(json({ error: e.message || "Không thể gửi tin nhắn." }, 400), request);
  }
}
