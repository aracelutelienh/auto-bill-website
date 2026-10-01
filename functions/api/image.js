import { json, isAdmin, getImage } from "../_lib.js";

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== "GET") {
    return json({ error: "Method not allowed" }, 405);
  }

  const url = new URL(request.url);
  const messageId = url.searchParams.get("id");
  const sessionId = url.searchParams.get("sessionId");

  if (!messageId || messageId.length > 100) {
    return json({ error: "Not found" }, 404);
  }

  const admin = await isAdmin(request, env);
  const row = await getImage(env, messageId, sessionId, admin);

  if (!row || !row.image_blob) {
    return json({ error: "Not found" }, 404);
  }

  let body = row.image_blob;

  // D1 có thể trả BLOB dưới dạng ArrayBuffer/Uint8Array.
  // Chuẩn hóa để Cloudflare trả đúng dữ liệu ảnh.
  if (!(body instanceof Uint8Array)) {
    body = new Uint8Array(body);
  }

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": row.image_type || "image/jpeg",
      "Content-Length": String(body.byteLength),
      "Cache-Control": "private, max-age=3600"
    }
  });
}
