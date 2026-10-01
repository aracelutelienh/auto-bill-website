```javascript
(async function(){
  const cfg = window.AUTO_BILL_CONFIG || {};

  // Lấy cấu hình tải ứng dụng
  try {
    const r = await fetch('/api/config', {
      cache: 'no-store'
    });

    if (r.ok) {
      const d = await r.json();

      if (d.downloadUrl) {
        cfg.downloadUrl = d.downloadUrl;
      }
    }
  } catch {}

  // Gắn link tải Auto Bill
  document.querySelectorAll('[data-download]').forEach(a => {
    a.href = cfg.downloadUrl || '#';
  });

  // Gắn link trang hỗ trợ
  document.querySelectorAll('[data-support]').forEach(a => {
    a.href = cfg.supportPath || '/support';
  });

  // Cập nhật ký hiệu thông báo Hỗ trợ
  const notifyEls = document.querySelectorAll('[data-notify]');

  if (!notifyEls.length) return;

  const sid = localStorage.getItem('ab_session');

  if (!sid) return;

  try {
    const r = await fetch(
      '/api/status?sessionId=' +
      encodeURIComponent(sid) +
      '&_=' + Date.now(),
      {
        cache: 'no-store'
      }
    );

    if (!r.ok) return;

    const d = await r.json();

    notifyEls.forEach(el => {
      el.textContent = d.unread
        ? '💬 •'
        : '💬';
    });

  } catch {}
})();
```
