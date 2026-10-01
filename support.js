(() => {
  const $=s=>document.querySelector(s);
  const messages=$('#messages'), text=$('#text'), nameButton=$('#nameEdit');
  let pendingImage=null;
  let sid=localStorage.getItem('ab_session');
  if(!sid){sid=crypto.randomUUID();localStorage.setItem('ab_session',sid)}
  const savedName=localStorage.getItem('ab_name')||'Khách hàng';
  nameButton.childNodes[0].nodeValue=savedName+' ';

  const fmt=t=>new Date(t).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'});
  const urlRe=/((https?:\/\/|www\.)[^\s<]+)/gi;

  function appendText(el,value){
    const parts=value.split(urlRe);
    let buffer='';
    for(let i=0;i<parts.length;i++){
      const part=parts[i];
      if(!part) continue;
      if(/^https?:\/\//i.test(part)||/^www\./i.test(part)){
        if(buffer){el.appendChild(document.createTextNode(buffer));buffer='';}
        const clean=part.replace(/[),.!?;:]+$/,'');
        const trailing=part.slice(clean.length);
        const a=document.createElement('a');a.href=clean.startsWith('www.')?'https://'+clean:clean;a.target='_blank';a.rel='noopener noreferrer';a.textContent=clean;el.appendChild(a);
        if(trailing) el.appendChild(document.createTextNode(trailing));
      } else buffer+=part;
    }
    if(buffer) el.appendChild(document.createTextNode(buffer));
  }

  function render(list){
    messages.innerHTML='';
    for(const m of list){
      const b=document.createElement('div'); b.className='bubble '+m.sender;
      if(m.text){const tx=document.createElement('div');tx.className='bubble-text';appendText(tx,m.text);b.appendChild(tx)}
      if(m.image_url){const im=document.createElement('img');im.src=m.image_url;im.alt='Ảnh đính kèm';im.loading='lazy';b.appendChild(im)}
      const tm=document.createElement('div');tm.className='time';tm.textContent=fmt(m.created_at);b.appendChild(tm);
      messages.appendChild(b);
    }
    messages.scrollTop=messages.scrollHeight;
  }

  async function load(){
    try{const r=await fetch('/api/session?sessionId='+encodeURIComponent(sid)+'&read=1');const d=await r.json();if(r.ok)render(d.messages||[])}catch{}
  }

  function setName(){
    const current=localStorage.getItem('ab_name')||'Khách hàng';
    const value=prompt('Tên hiển thị',current);
    if(value===null)return;
    const clean=value.trim().slice(0,80)||'Khách hàng';
    localStorage.setItem('ab_name',clean); nameButton.childNodes[0].nodeValue=clean+' ';
  }
  nameButton.onclick=setName;

  function imageFromClipboard(e){
    const items=[...(e.clipboardData?.items||[])];
    const item=items.find(i=>i.type.startsWith('image/'));
    if(!item)return;
    e.preventDefault();
    const blob=item.getAsFile();
    if(blob){pendingImage=new File([blob],`pasted-image-${Date.now()}.${blob.type.split('/')[1]||'png'}`,{type:blob.type});
      text.placeholder='Ảnh đã dán · nhập thêm nội dung hoặc nhấn Enter để gửi';
      text.focus();
    }
  }
  text.addEventListener('paste',imageFromClipboard);

  text.addEventListener('keydown',e=>{
    if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();$('#composer').requestSubmit($('#composer button[type=submit]'));}
  });

  $('#composer').onsubmit=async e=>{
    e.preventDefault();
    const t=text.value.trim();
    if(!t&&!pendingImage)return;
    const fd=new FormData();fd.append('sessionId',sid);fd.append('customerName',localStorage.getItem('ab_name')||'Khách hàng');fd.append('text',t);if(pendingImage)fd.append('image',pendingImage);
    const btn=e.submitter || $('#composer button[type=submit]');btn.disabled=true;
    try{const r=await fetch('/api/send',{method:'POST',body:fd});const d=await r.json();if(!r.ok)throw Error(d.error||'Lỗi');render(d.messages||[]);text.value='';pendingImage=null;text.placeholder='Nhập tin nhắn... · Enter để gửi · Shift+Enter xuống dòng';}
    catch(err){alert(err.message)}finally{btn.disabled=false;text.focus()}
  };

  setInterval(load,2500);load();text.focus();
})();
