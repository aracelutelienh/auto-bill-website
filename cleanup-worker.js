export default {
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(cleanup(env));
  }
};

async function cleanup(env) {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const { results = [] } = await env.DB.prepare("SELECT id FROM conversations WHERE updated_at < ?").bind(cutoff).all();
  for (const c of results) {
    const { results: files = [] } = await env.DB.prepare("SELECT image_key FROM messages WHERE conversation_id=? AND image_key IS NOT NULL").bind(c.id).all();
    for (const f of files) {
      try { await env.CHAT_FILES.delete(f.image_key); } catch {}
    }
    await env.DB.prepare("DELETE FROM conversations WHERE id=?").bind(c.id).run();
  }
}
