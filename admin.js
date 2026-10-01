(() => {
  const $ = s => document.querySelector(s);

  let current = null;
  let pendingImage = null;
  let polling = false;

  const fmt = t =>
    new Date(t).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

  function appendText(el, value) {
    const urlRe = /((https?:\/\/|www\.)[^\s<]+)/gi;
    const parts = value.split(urlRe);
    let buffer = '';

    for (const part of parts) {
      if (!part) continue;

      if (/^https?:\/\//i.test(part) || /^www\./i.test(part)) {
        if (buffer) {
          el.appendChild(document.createTextNode(buffer));
          buffer = '';
        }

        const clean = part.replace(/[),.!?;:]+$/, '');
        const trailing = part.slice(clean.length);

        const a = document.createElement('a');
        a.href = clean.startsWith('www.')
          ? 'https://' + clean
          : clean;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = clean;

        el.appendChild(a);

        if (trailing) {
          el.appendChild(document.createTextNode(trailing));
        }
      } else {
        buffer += part;
      }
    }

    if (buffer) {
      el.appendChild(document.createTextNode(buffer));
    }
  }

  function renderMsgs(list) {
    const box = $('#messages');

    const wasNearBottom =
      box.scrollHeight - box.scrollTop - box.clientHeight < 100;

    box.innerHTML = '';

    for (const m of list || []) {
      const b = document.createElement('div');
      b.className = 'bubble ' + m.sender;

      if (m.text) {
        const tx = document.createElement('div');
        tx.className = 'bubble-text';
        appendText(tx, m.text);
        b.appendChild(tx);
      }

      if (m.image_url) {
        const im = document.createElement('img');
        im.src = m.image_url;
        im.alt = 'Ảnh đính kèm';
        im.loading = 'lazy';
        b.appendChild(im);
      }

      const tm = document.createElement('div');
      tm.className = 'time';
      tm.textContent = fmt(m.created_at);
      b.appendChild(tm);

      box.appendChild(b);
    }

    if (wasNearBottom) {
      box.scrollTop = box.scrollHeight;
    }
  }

  async function status() {
    const r = await fetch('/api/admin/status', {
      cache: 'no-store'
    });

    const d = await r.json();
    return d.authenticated;
  }

  async function list() {
    const r = await fetch('/api/admin/conversations', {
      cache: 'no-store'
    });

    if (r.status === 401) {
      location.reload();
      return;
    }

    const d = await r.json();
    const el = $('#list');

    el.innerHTML = '';

    for (const c of d.conversations || []) {
      const item = document.createElement('div');

      item.className =
        'conv' + (c.id === current ? ' active' : '');

      item.onclick = () => open(c.id);

      item.innerHTML =
        '<span class="conv-name"></span>' +
        '<span class="conv-time"></span>' +
        (c.admin_unread
          ? '<span class="new-pill"></span>'
          : '');

      item.querySelector('.conv-name').textContent =
        c.customer_name || 'Khách hàng';

      item.querySelector('.conv-time').textContent =
        fmt(c.updated_at);

      el.appendChild(item);
    }
  }

  async function open(id) {
    current = id;

    await loadCurrentConversation();

    $('#text').focus();
  }

  async function loadCurrentConversation() {
    if (!current) return;

    try {
      const r = await fetch(
        '/api/admin/conversation?id=' +
        encodeURIComponent(current) +
        '&_=' +
        Date.now(),
        {
          cache: 'no-store'
        }
      );

      if (!r.ok) return;

      const d = await r.json();

      if (!d.conversation) return;

      $('#chatName').textContent =
        d.conversation.customer_name ||
        'Khách hàng';

      $('#chatStatus').textContent =
        'Đang hỗ trợ · Cập nhật ' +
        fmt(d.conversation.updated_at);

      renderMsgs(d.messages || []);

    } catch (err) {
      console.error('Không thể cập nhật chat:', err);
    }
  }

  // =========================
  // ĐĂNG NHẬP
  // =========================

  $('#loginForm').onsubmit = async e => {
    e.preventDefault();

    $('#loginError').textContent = '';

    const r = await fetch('/api/admin/login', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        password: $('#password').value
      })
    });

    const d = await r.json();

    if (!r.ok) {
      $('#loginError').textContent =
        d.error || 'Đăng nhập thất bại.';
      return;
    }

    $('#login').hidden = true;
    $('#app').hidden = false;

    await list();

    startPolling();
  };

  $('#logout').onclick = async () => {
    await fetch('/api/admin/logout', {
      method: 'POST'
    });

    location.reload();
  };

  // =========================
  // CHỌN ẢNH
  // =========================

  $('#attach').onclick = () => {
    $('#file').click();
  };

  $('#file').onchange = e => {
    pendingImage =
      e.target.files[0] || null;

    if (pendingImage) {
      $('#text').focus();
      $('#text').placeholder =
        'Ảnh đã chọn · nhấn Enter để gửi';
    }
  };

  // =========================
  // CTRL + V DÁN ẢNH
  // =========================

  $('#text').addEventListener('paste', e => {
    const items =
      [...(e.clipboardData?.items || [])];

    const imageItem = items.find(item =>
      item.type &&
      item.type.startsWith('image/')
    );

    if (!imageItem) return;

    e.preventDefault();

    const blob = imageItem.getAsFile();

    if (!blob) return;

    const ext =
      blob.type.split('/')[1] || 'png';

    pendingImage = new File(
      [blob],
      `pasted-image-${Date.now()}.${ext}`,
      {
        type: blob.type
      }
    );

    $('#text').placeholder =
      'Ảnh đã dán · nhấn Enter để gửi';

    $('#text').focus();
  });

  // =========================
  // ENTER GỬI
  // SHIFT + ENTER XUỐNG DÒNG
  // =========================

  $('#text').addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;

    if (e.shiftKey) {
      return;
    }

    e.preventDefault();

    sendMessage();
  });

  // =========================
  // HÀM GỬI
  // =========================

  async function sendMessage() {
    if (!current) return;

    const text =
      $('#text').value.trim();

    const file =
      pendingImage ||
      $('#file').files[0] ||
      null;

    if (!text && !file) return;

    const fd = new FormData();

    fd.append(
      'conversationId',
      current
    );

    fd.append(
      'text',
      text
    );

    if (file) {
      fd.append(
        'image',
        file
      );
    }

    const btn =
      $('#composer button[type="submit"]');

    if (btn) {
      btn.disabled = true;
    }

    try {
      const r = await fetch(
        '/api/admin/send',
        {
          method: 'POST',
          body: fd,
          cache: 'no-store'
        }
      );

      const d = await r.json();

      if (!r.ok) {
        throw new Error(
          d.error ||
          'Không thể gửi tin nhắn.'
        );
      }

      renderMsgs(
        d.messages || []
      );

      $('#text').value = '';
      $('#file').value = '';
      pendingImage = null;

      $('#text').placeholder =
        'Trả lời khách hàng...';

      await list();

      $('#text').focus();

    } catch (err) {
      alert(err.message);

    } finally {
      if (btn) {
        btn.disabled = false;
      }
    }
  }

  // Nút Gửi
  $('#composer').onsubmit = async e => {
    e.preventDefault();
    await sendMessage();
  };

  // =========================
  // TỰ ĐỘNG CẬP NHẬT
  // =========================

  function startPolling() {
    if (polling) return;

    polling = true;

    setInterval(async () => {
      try {
        await list();

        if (current) {
          await loadCurrentConversation();
        }
      } catch (err) {
        console.error(
          'Polling error:',
          err
        );
      }
    }, 2500);
  }

  // =========================
  // KHỞI ĐỘNG
  // =========================

  status().then(ok => {
    if (ok) {
      $('#login').hidden = true;
      $('#app').hidden = false;

      list();
      startPolling();
    }
  });
})();
