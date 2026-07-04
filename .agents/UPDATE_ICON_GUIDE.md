# Hướng dẫn thay đổi Icon trang web và PWA (Dành cho AI)

Tài liệu này hướng dẫn các bước chi tiết mà một trợ lý AI cần thực hiện khi Người dùng (USER) yêu cầu thay đổi ảnh Icon/Logo của trang web LMS này.

---

## 🛠️ Quy trình các bước thực hiện

Khi nhận được yêu cầu thay đổi Icon (ví dụ: cung cấp file ảnh mới `new-icon.png` hoặc chỉ định một đường dẫn ảnh có sẵn):

### Bước 1: Sao chép file ảnh mới vào các vị trí đích
Bạn cần sao chép file ảnh mới đó và ghi đè vào cả 3 vị trí sau để đảm bảo đồng bộ cho favicon, PWA, và ảnh xem trước (OpenGraph):
1. Ghi đè vào file icon của Next.js App Router: `src/app/icon.png`
2. Ghi đè vào file tĩnh phục vụ PWA: `public/icon.png`
3. Ghi đè vào file tĩnh làm ảnh preview OpenGraph: `public/og-image.png`

*Lưu ý:* Cả 3 file trên đều phải sử dụng chung 1 hình ảnh Logo mới mà người dùng yêu cầu.

### Bước 2: Tăng phiên bản cache-buster trong Manifest PWA
Trình duyệt của người dùng cài đặt PWA lưu bộ nhớ đệm (cache) cực kỳ lâu. Để ép trình duyệt tải lại icon mới, bạn cần:
1. Mở file `public/manifest.json`.
2. Tìm đến phần cấu hình `"icons"`.
3. Tăng số phiên bản ở tham số `?v=X` lên (Ví dụ: Đổi `/icon.png?v=2` thành `/icon.png?v=3`).

```json
  "icons": [
    {
      "src": "/icon.png?v=3",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
```

### Bước 3: Đảm bảo cấu hình Metadata trong các File Layout
Kiểm tra xem các file Layout dưới đây đã cấu hình đúng đường dẫn ảnh preview chưa:
- **Layout gốc:** `src/app/layout.tsx`
- **Layout chi tiết bài tập:** `src/app/assignments/[id]/layout.tsx`
- **Layout bắt đầu làm bài:** `src/app/assignments/[id]/start/layout.tsx`

Các file trên bắt buộc phải xuất ra metadata có trường `images` chỉ định đến `/og-image.png`, ví dụ:
```tsx
openGraph: {
  ...
  images: [
    {
      url: "/og-image.png",
      width: 512,
      height: 512,
      alt: "Gia sư Đào Bá Anh Quân",
    }
  ],
},
twitter: {
  card: "summary_large_image",
  ...
  images: ["/og-image.png"],
}
```

### Bước 4: Chạy Build kiểm tra tại Local
Trước khi commit, hãy chạy thử lệnh build để đảm bảo Next.js biên dịch thành công và không xảy ra lỗi cú pháp:
```powershell
npm run build
```

### Bước 5: Đưa các file mới vào Git (Stage) và Commit
Vì file ảnh mới ghi đè có thể ở trạng thái chưa được Git theo dõi (untracked) hoặc bị bỏ qua nếu chỉ commit dạng `-am`, bạn phải chạy tuần tự:
```powershell
git add .
git commit -m "chore: update website logo and PWA icons with cache-busting vX"
git push origin main
```

### Bước 6: Hướng dẫn người dùng xóa cache thiết bị
Sau khi hoàn thành deploy, bạn **bắt buộc** phải nhắn người dùng thực hiện các bước sau để thấy icon mới (do cache PWA trên điện thoại/máy tính rất cứng đầu):
1. **Gỡ cài đặt (Uninstall/Delete)** ứng dụng PWA cũ khỏi màn hình chính.
2. **Xóa bộ nhớ đệm (Clear cache) trình duyệt** (Safari/Chrome) cho trang web `https://dbaq-lms.vercel.app/`.
3. Truy cập lại trang web và thực hiện **Thêm vào màn hình chính** lại từ đầu.
