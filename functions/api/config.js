import { json } from "../_lib.js";
export async function onRequest({ env }) {
  return json({ downloadUrl: env.DOWNLOAD_URL || "#" });
}
