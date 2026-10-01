import { createAdminToken, adminCookie, json, withCors, handleOptions } from "../../_lib.js";
export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return handleOptions(request);
  if (request.method !== "POST") return withCors(json({ error: "Method not allowed" }, 405), request);
  try {
    const { password } = await request.json();
    if (!env.ADMIN_PASSWORD || env.ADMIN_PASSWORD === "CHANGE_THIS_ADMIN_PASSWORD" || password !== env.ADMIN_PASSWORD) return withCors(json({ error: "Mật khẩu không đúng." }, 401), request);
    const token = await createAdminToken(env.ADMIN_PASSWORD);
    return withCors(new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json; charset=utf-8", "Set-Cookie": adminCookie(token) } }), request);
  } catch { return withCors(json({ error: "Không thể đăng nhập." }, 400), request); }
}
