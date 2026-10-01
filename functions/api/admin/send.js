import {
  isAdmin,
  getMessages,
  json,
  withCors,
  handleOptions,
  id,
  now,
  validateImage,
  MAX_TEXT
} from "../../_lib.js";

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return handleOptions(request);
  }

  if (!(await isAdmin(request, env))) {
    return withCors(
      json({ error: "Unauthorized" }, 401),
      request
    );
  }

  if (request.method !== "POST") {
    return withCors(
      json({ error: "Method not allowed" }, 405),
      request
    );
  }

  try {
    const form = await request.formData();

    const conversationId =
      String(form.get("conversationId") || "");

    const text =
      String(form.get("text") || "")
        .trim()
        .slice(0, MAX_TEXT);

    const file = validateImage(form.get("image"));

    if (!conversationId || (!text && !file)) {
      return withCors(
        json({ error: "Tin nhắn trống." }, 400),
        request
      );
    }

    const conversation = await env.DB
      .prepare(
        "SELECT id FROM conversations WHERE id=?"
      )
      .bind(conversationId)
      .first();

    if (!conversation) {
      return withCors(
        json({
          error: "Cuộc trò chuyện không tồn tại."
        }, 404),
        request
      );
    }

    let imageKey = null;
    let imageType = null;
    let imageName = null;
    let imageBlob = null;

    // Lưu ảnh trực tiếp vào D1
    if (file) {
      imageKey = id();
      imageType = file.type;
      imageName = file.name || "image";
      imageBlob = new Uint8Array(
        await file.arrayBuffer()
      );
    }

    const messageId = id();
    const created = now();

    await env.DB
      .prepare(
        `INSERT INTO messages
        (
          id,
          conversation_id,
          sender,
          text,
          image_key,
          image_type,
          image_name,
          image_blob,
          created_at
        )
        VALUES (?,?,?,?,?,?,?,?,?)`
      )
      .bind(
        messageId,
        conversationId,
        "admin",
        text,
        imageKey,
        imageType,
        imageName,
        imageBlob,
        created
      )
      .run();

    await env.DB
      .prepare(
        `UPDATE conversations
         SET updated_at=?,
             customer_unread=1,
             admin_unread=0
         WHERE id=?`
      )
      .bind(created, conversationId)
      .run();

    return withCors(
      json({
        ok: true,
        messages: await getMessages(
          env,
          conversationId
        )
      }),
      request
    );

  } catch (e) {
    return withCors(
      json({
        error:
          e.message ||
          "Không thể gửi tin nhắn."
      }, 400),
      request
    );
  }
}
