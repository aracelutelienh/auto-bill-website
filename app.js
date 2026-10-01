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

  // ==============================
  // THÔNG BÁO HỖ TRỢ CHO ADMIN
  // ==============================

  const notifyEls = document.querySelectorAll('[data-notify]');

  if (!notifyEls.length) return;

  try {
    const r = await fetch('/api/admin/conversations?_=' + Date.now(), {
      credentials: 'same-origin',
      cache: 'no-store'
    });

    // Chưa đăng nhập Admin → không hiện thông báo
    if (!r.ok) return;

    const data = await r.json();
    const conversations = Array.isArray(data.conversations)
      ? data.conversations
      : [];

    // Có ít nhất một cuộc trò chuyện khách chưa được Admin xử lý
    const hasUnread = conversations.some(c => !!c.admin_unread);

    notifyEls.forEach(el => {
      el.textContent = hasUnread
        ? '💬 •'
        : '💬';
    });

  } catch {
    // Nếu không lấy được trạng thái thì giữ giao diện mặc định
  }
})();
```
