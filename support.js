(() => {
  const $=s=>document.querySelector(s); const messages=$('#messages'), text=$('#text'), file=$('#file'), name=$('#name');
  let sid=localStorage.getItem('ab_session'); if(!sid){sid=crypto.randomUUID();localStorage.setItem('ab_session',sid)}
  name.value=localStorage.getItem('ab_name')||'';
  const fmt=t=>new Date(t).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'});
  function render(list){messages.innerHTML=''; for(const m of list){const b=document.createElement('div');b.className='bubble '+m.sender;b.textContent=m.text||'';if(m.image_url){const im=document.createElement('img');im.src=m.image_url;im.alt='Ảnh đính kèm';b.appendChild(im)}const tm=document.createElement('div');tm.className='time';tm.textContent=fmt(m.created_at);b.appendChild(tm);messages.appendChild(b)}messages.scrollTop=messages.scrollHeight}
  async function load(){const r=await fetch('/api/session?sessionId='+encodeURIComponent(sid)+'&read=1');const d=await r.json();if(r.ok)render(d.messages||[])}
  $('#attach').onclick=()=>file.click();
  name.onchange=()=>localStorage.setItem('ab_name',name.value.trim());
  $('#composer').onsubmit=async e=>{e.preventDefault();const f=file.files[0];const t=text.value.trim();if(!t&&!f)return;const fd=new FormData();fd.append('sessionId',sid);fd.append('customerName',name.value.trim()||'Khách hàng');fd.append('text',t);if(f)fd.append('image',f);const btn=e.submitter;btn.disabled=true;try{const r=await fetch('/api/send',{method:'POST',body:fd});const d=await r.json();if(!r.ok)throw Error(d.error||'Lỗi');render(d.messages||[]);text.value='';file.value='';}catch(err){alert(err.message)}finally{btn.disabled=false}};
  setInterval(load,2500); load();
})();
