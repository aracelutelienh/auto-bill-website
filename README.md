# Auto Bill — Website + Support Chat

Bộ mã này gồm:

- Landing page Auto Bill.
- 3 ảnh giao diện thật đã được đặt sẵn trong `assets/`.
- Nút tải `.exe` trực tiếp từ GitHub Releases.
- `/support`: khách chat ngay, không tài khoản.
- `/admin`: bạn đăng nhập bằng một mật khẩu rồi quản lý nhiều cuộc trò chuyện.
- Gửi text + ảnh JPG/PNG/WEBP/GIF, tối đa 5 MB/ảnh.
- Session khách lưu bằng `localStorage`, không dùng IP làm định danh chính.
- D1 lưu tin nhắn; R2 lưu ảnh.
- Dữ liệu cũ hơn 24 giờ được xóa bởi `cleanup-worker.js` mỗi giờ.

## 1. Chuẩn bị

Bạn cần một tài khoản Cloudflare và một repository GitHub để chứa bộ code này.

Tạo 2 tài nguyên Cloudflare:

1. D1 database: `auto-bill-chat`
2. R2 bucket: `auto-bill-chat-files`

Có thể tạo trong Cloudflare Dashboard → Workers & Pages → D1 / R2.

## 2. Tạo bảng D1

Mở D1 database `auto-bill-chat` → Console/SQL Editor và chạy toàn bộ nội dung file:

`schema.sql`

## 3. Đưa code lên GitHub

Upload toàn bộ thư mục này vào một repository.

Giữ nguyên cấu trúc, đặc biệt:

- `functions/`
- `assets/`
- `support/index.html`
- `admin/index.html`

## 4. Tạo Cloudflare Pages

Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git.

Chọn repository GitHub.

Nếu Pages hỏi build command, để trống.

Build output directory: `.`

Sau khi deploy, website sẽ có dạng:

`https://ten-du-an.pages.dev`

## 5. Gắn D1 + R2 cho Pages

Trong Pages project → Settings → Functions/Bindings, thêm:

- D1 binding name: `DB` → database `auto-bill-chat`
- R2 binding name: `CHAT_FILES` → bucket `auto-bill-chat-files`

## 6. Đặt biến môi trường

Trong Pages project → Settings → Environment variables, thêm:

`ADMIN_PASSWORD`

→ mật khẩu riêng của bạn.

`DOWNLOAD_URL`

→ URL trực tiếp tới file `.exe` trên GitHub Releases.

Ví dụ:

`https://github.com/TEN-CUA-BAN/REPO/releases/latest/download/AutoBill.exe`

Sau khi đổi biến môi trường, redeploy Pages.

### Lưu ý về `config.js`

`config.js` chỉ là fallback cho nút download ở phía trình duyệt. Hãy sửa URL trong file này cho đúng GitHub Release trước khi deploy nếu muốn mọi thứ đồng nhất.

## 7. Bật tự động xóa sau 24 giờ

Pages Functions không có cron trực tiếp như Worker. Vì vậy bộ code có thêm một Worker nhỏ:

`cleanup-worker.js`

và cấu hình:

`cleanup-wrangler.toml`

Bạn chỉ cần thay:

`REPLACE_WITH_D1_DATABASE_ID`

bằng ID D1 thật trong cả `wrangler.toml` và `cleanup-wrangler.toml`.

Sau đó cài Wrangler và deploy cleanup Worker:

```bash
npm install
npx wrangler deploy --config cleanup-wrangler.toml
```

Worker chạy mỗi giờ và xóa conversation + message + ảnh đã quá 24 giờ kể từ lần cập nhật cuối.

## 8. Các URL sau khi deploy

Website:

`https://ten-du-an.pages.dev/`

Hỗ trợ khách:

`https://ten-du-an.pages.dev/support`

Admin:

`https://ten-du-an.pages.dev/admin`

## 9. Dùng trong Auto Bill

Nút `Hỗ trợ` trong ứng dụng chỉ cần mở:

`https://ten-du-an.pages.dev/support`

Không cần tài khoản cho khách.

## 10. Thay ảnh

Ảnh hiện tại:

- `assets/app-showcase.png` → ảnh chính hero.
- `assets/app-invoice.png` → phần tạo hóa đơn.
- `assets/app-dashboard.png` → phần tổng quan.

Nếu muốn đổi ảnh, chỉ cần thay file và giữ đúng tên.

## 11. Giới hạn mặc định

- Tin nhắn: tối đa 4.000 ký tự.
- Ảnh: tối đa 5 MB.
- Hỗ trợ JPG, PNG, WEBP, GIF.
- Session khách: UUID lưu trong trình duyệt.
- Admin cookie: 7 ngày.
- Dữ liệu chat: mục tiêu lưu tối đa 24 giờ.

## 12. Quan trọng

Đây là phiên bản support chat tối giản, polling mỗi khoảng 2,5 giây thay vì WebSocket. Điều này làm hệ thống dễ triển khai và bảo trì hơn, trong khi trải nghiệm chat vẫn gần thời gian thực.
