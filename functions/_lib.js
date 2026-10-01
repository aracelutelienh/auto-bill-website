const COOKIE = "ab_admin";
const MAX_IMAGE_BYTES = 1500000;
const MAX_TEXT = 4000;

export function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", ...extra } });
}
export function now() { return Date.now(); }
export function id() { return crypto.randomUUID(); }
export function corsHeaders(request) {
  const origin = request.headers.get("Origin");
  const allowed = origin && new URL(request.url).origin === origin ? origin : new URL(request.url).origin;
  return { "Access-Control-Allow-Origin": allowed, "Access-Control-Allow-Credentials": "true", "Access-Control-Allow-Headers": "content-type", "Access-Control-Allow-Methods": "GET,POST,OPTIONS" };
}
export function withCors(response, request) { const headers = new Headers(response.headers); Object.entries(corsHeaders(request)).forEach(([k,v])=>headers.set(k,v)); return new Response(response.body,{status:response.status,headers}); }
export async function handleOptions(request) { return new Response(null,{status:204,headers:corsHeaders(request)}); }

function b64u(bytes){let s="";for(const b of bytes)s+=String.fromCharCode(b);return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");}
function fromB64u(s){s=s.replace(/-/g,"+").replace(/_/g,"/");while(s.length%4)s+="=";const bin=atob(s);return Uint8Array.from(bin,c=>c.charCodeAt(0));}
async function hmac(secret,value){const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);return new Uint8Array(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(value)));}

export async function createAdminToken(password){const payload=`${Date.now()}.${crypto.randomUUID()}`;return `${b64u(new TextEncoder().encode(payload))}.${b64u(await hmac(password,payload))}`;}

export async function isAdmin(request,env){
  const cookie=request.headers.get("Cookie")||"";
  const match=cookie.match(new RegExp(`${COOKIE}=([^;]+)`));
  if(!match||!env.ADMIN_PASSWORD||env.ADMIN_PASSWORD==="CHANGE_THIS_ADMIN_PASSWORD")return false;
  try{
    const [payloadB64,sig]=match[1].split(".");
    const payload=new TextDecoder().decode(fromB64u(payloadB64));
    const [ts]=payload.split(".");
    if(!ts||Date.now()-Number(ts)>7*24*60*60*1000)return false;
    const expected=b64u(await hmac(env.ADMIN_PASSWORD,payload));
    if(sig.length!==expected.length)return false;
    const a=new TextEncoder().encode(sig),b=new TextEncoder().encode(expected);
    let diff=0;
    for(let i=0;i<a.length;i++)diff|=a[i]^b[i];
    return diff===0;
  }catch{return false;}
}

export function adminCookie(token){return `${COOKIE}=${token}; Max-Age=604800; Path=/; HttpOnly; Secure; SameSite=Lax`;}
export function clearAdminCookie(){return `${COOKIE}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax`;}

export async function getOrCreateConversation(env,sessionId,customerName="Khách hàng"){
  if(!sessionId||sessionId.length>100)throw new Error("Invalid session");
  const existing=await env.DB.prepare("SELECT * FROM conversations WHERE session_id = ?").bind(sessionId).first();
  if(existing){
    if(customerName&&customerName!=="Khách hàng"&&customerName!==existing.customer_name&&customerName.length<=80){
      await env.DB.prepare("UPDATE conversations SET customer_name=?, updated_at=? WHERE id=?").bind(customerName,now(),existing.id).run();
      existing.customer_name=customerName;
    }
    return existing;
  }
  const conversation={
    id:id(),
    session_id:sessionId,
    customer_name:customerName||"Khách hàng",
    created_at:now(),
    updated_at:now(),
    customer_unread:0,
    admin_unread:0
  };
  await env.DB.prepare("INSERT INTO conversations (id,session_id,customer_name,created_at,updated_at,customer_unread,admin_unread) VALUES (?,?,?,?,?,?,?)").bind(
    conversation.id,
    conversation.session_id,
    conversation.customer_name,
    conversation.created_at,
    conversation.updated_at,
    0,
    0
  ).run();
  return conversation;
}

export async function cleanupExpired(env){
  const cutoff=now()-24*60*60*1000;
  const {results=[]}=await env.DB.prepare("SELECT id FROM conversations WHERE updated_at < ?").bind(cutoff).all();
  for(const c of results)await env.DB.prepare("DELETE FROM conversations WHERE id=?").bind(c.id).run();
}

export async function getMessages(env,conversationId,sessionId=null){
  const {results=[]}=await env.DB.prepare("SELECT id,sender,text,image_key,image_type,image_name,created_at FROM messages WHERE conversation_id=? ORDER BY created_at ASC").bind(conversationId).all();
  return results.map(m=>({...m,image_url:m.image_key?`/api/image?id=${encodeURIComponent(m.id)}${sessionId?`&sessionId=${encodeURIComponent(sessionId)}`:""}`:null}));
}

export async function getImage(env,messageId,sessionId,isAdminUser){
  const row=await env.DB.prepare("SELECT m.image_blob,m.image_type,c.session_id FROM messages m JOIN conversations c ON c.id=m.conversation_id WHERE m.id=?").bind(messageId).first();
  if(!row||!row.image_blob)return null;
  if(!isAdminUser&&(!sessionId||sessionId!==row.session_id))return null;
  return row;
}

export async function readImage(formField){
  const file=formField;
  if(!file||typeof file.size!=="number"||!file.size)return null;
  if(file.size>MAX_IMAGE_BYTES)throw new Error("Ảnh sau khi nén phải nhỏ hơn 1.5 MB.");
  const allowed=["image/jpeg","image/png","image/webp","image/gif"];
  if(!allowed.includes(file.type))throw new Error("Chỉ hỗ trợ JPG, PNG, WEBP hoặc GIF.");
  return file;
}

export { COOKIE, MAX_IMAGE_BYTES, MAX_TEXT };
