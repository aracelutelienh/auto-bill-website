import { json } from "../_lib.js";

export async function onRequest(context) {
  const { request, env } = context;
  const key = new URL(request.url).searchParams.get("key");
  if (!key || key.length > 500) return json({ error: "Not found" }, 404);
  const obj = await env.CHAT_FILES.get(key);
  if (!obj) return json({ error: "Not found" }, 404);
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set("Cache-Control", "private, max-age=3600");
  headers.set("X-Content-Type-Options", "nosniff");
  return new Response(obj.body, { headers });
}
