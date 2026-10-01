(async function () {
  const cfg = window.AUTO_BILL_CONFIG || {};

  // ==========================================
  // LINK TẢI AUTO BILL
  // ==========================================

  const downloadUrl =
    cfg.downloadUrl ||
    "https://github.com/aracelutelienh/auto-bill-website/releases/download/v1.0.1/AutoBillPro.Setup.1.0.0.exe";

  document.querySelectorAll("[data-download]").forEach((el) => {
    el.href = downloadUrl;
    el.target = "_blank";
    el.rel = "noopener";
  });

  // ==========================================
  // LINK HỖ TRỢ
  // ==========================================

  const supportUrl = cfg.supportPath || "/support";

  document.querySelectorAll("[data-support]").forEach((el) => {
    el.href = supportUrl;
  });

  // ==========================================
  // KÝ HIỆU TIN NHẮN CHỜ HỖ TRỢ
  // ==========================================

  const notifyEls = document.querySelectorAll("[data-notify]");

  if (!notifyEls.length) return;

  try {
    const r = await fetch(
      "/api/public-status?_=" + Date.now(),
      {
        cache: "no-store"
      }
    );

    if (!r.ok) return;

    const data = await r.json();

    notifyEls.forEach((el) => {
      el.textContent = data.unread ? "💬 •" : "💬";
    });
  } catch {}
})();
