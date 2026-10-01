(async function(){
  const cfg=window.AUTO_BILL_CONFIG||{};
  try { const r=await fetch('/api/config'); if(r.ok){const d=await r.json(); if(d.downloadUrl) cfg.downloadUrl=d.downloadUrl;} } catch {}
  document.querySelectorAll('[data-download]').forEach(a=>a.href=cfg.downloadUrl||'#');
  document.querySelectorAll('[data-support]').forEach(a=>a.href=cfg.supportPath||'/support');
  const dot=document.querySelector('[data-notify]');
  if(dot){
    const sid=localStorage.getItem('ab_session');
    if(sid){ fetch('/api/status?sessionId='+encodeURIComponent(sid)).then(r=>r.json()).then(d=>{dot.textContent=d.unread?'💬 •':'💬';}).catch(()=>{}); }
  }
})();
