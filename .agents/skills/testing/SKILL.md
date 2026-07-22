---
name: testing
description: Quy trình kiểm thử cú pháp TypeScript, xác minh API AI Healthcheck và kiểm tra giao diện cho DBAQ LMS.
---

# Kỹ năng Kiểm thử & Xác minh (Testing Skill) - DBAQ LMS

Tài liệu này quy định quy trình kiểm thử bắt buộc dành cho AI Agents để đảm bảo mã nguồn luôn hoạt động ổn định 100%.

---

## 1. Lệnh Kiểm thử TypeScript Bắt buộc (`npx tsc --noEmit`)

Mỗi khi chỉnh sửa hoặc viết mới code TypeScript/React, AI **BẮT BUỘC** phải chạy:
```bash
npx tsc --noEmit
```
- Nếu lệnh báo thành công (`Completed successfully` với 0 lỗi): Tiến hành bước tiếp theo.
- Nếu xuất hiện lỗi cú pháp hoặc sai kiểu dữ liệu (TypeError): Phải đọc chi tiết file và dòng báo lỗi, sửa triệt để trước khi báo hoàn thành với người dùng.

---

## 2. Kiểm thử AI Generation Healthcheck

Khi thay đổi logic bóc tách đề bài hoặc giải bài tập bằng AI (`src/lib/aiGeneration.ts`), AI hãy kiểm tra hoặc gợi ý chạy script healthcheck:
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\ai-healthcheck.ps1
```

---

## 3. Kiểm thử Giao diện & Render Bảng

- Kiểm tra xem component `<MathText>` có hiển thị công thức LaTeX mượt mà không.
- Kiểm tra xem các bảng số liệu Markdown có được bọc trong khung kính mờ glassmorphism và căn lề đúng không.
- Kiểm tra chế độ Dark mode trên cả màn hình máy tính và thiết bị di động.
