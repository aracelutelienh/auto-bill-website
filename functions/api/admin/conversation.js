import { isAdmin, getMessages, json, withCors, handleOptions } from "../../_lib.js";
export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return handleOptions(request);
  if (!(await isAdmin(request, env))) return withCors(json({ error: "Unauthorized" }, 401), request);
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return withCors(json({ error: "Missing id" }, 400), request);
  try {
    await env.DB.prepare("UPDATE conversations SET admin_unread=0 WHERE id=?").bind(id).run();
    const conversation = await env.DB.prepare("SELECT * FROM conversations WHERE id=?").bind(id).first();
    if (!conversation) return withCors(json({ error: "Not found" }, 404), request);
    return withCors(json({ conversation, messages: await getMessages(env, id) }), request);
  } catch (e) { return withCors(json({ error: e.message }, 500), request); }
}
