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

  // Link tải Auto Bill
  document.querySelectorAll('[data-download]').forEach(a => {
    a.href = cfg.downloadUrl || '#';
  });

  // Link hỗ trợ
  document.querySelectorAll('[data-support]').forEach(a => {
    a.href = cfg.supportPath || '/support';
  });

  // ==============================
  // KÝ HIỆU TIN NHẮN CHỜ HỖ TRỢ
  // ==============================

  const notifyEls = document.querySelectorAll('[data-notify]');

  if (!notifyEls.length) return;

  try {
    const r = await fetch(
      '/api/public-status?_=' + Date.now(),
      {
        cache: 'no-store'
      }
    );

    if (!r.ok) return;

    const data = await r.json();

    notifyEls.forEach(el => {
      el.textContent = data.unread
        ? '💬 •'
        : '💬';
    });

  } catch {}
})();
