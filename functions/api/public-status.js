import { json, withCors, handleOptions, cleanupExpired } from "../_lib.js";

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return handleOptions(request);
  }

  if (request.method !== "GET") {
    return withCors(
      json({ unread: false }, 405),
      request
    );
  }

  try {
    await cleanupExpired(env);

    const row = await env.DB.prepare(`
      SELECT 1
      FROM conversations
      WHERE admin_unread = 1
      LIMIT 1
    `).first();

    return withCors(
      json({ unread: !!row }),
      request
    );

  } catch (e) {
    return withCors(
      json({ unread: false }),
      request
    );
  }
}
