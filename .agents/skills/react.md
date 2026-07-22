---
name: react
description: Quy chuẩn phát triển React Components & Next.js UI đồng bộ hệ thống thiết kế Apple Soft Modern cho DBAQ LMS.
---

# Kỹ năng Phát triển React & UI (React Skill) - DBAQ LMS

Tài liệu này quy định các nguyên tắc thiết kế và tối ưu component React trong dự án DBAQ LMS.

---

## 1. Tuân thủ Hệ thống Thiết kế Apple Soft Modern (`DESIGN.md`)

- **BẮT BUỘC ĐỌC**: Trước khi tạo UI mới hoặc chỉnh sửa component, AI phải xem file [.agents/DESIGN.md](file:///d:/Code/dbaq-lms/.agents/DESIGN.md).
- **Màu sắc Nòng cốt**: Action Blue (`#0066cc` / `#0071e3`).
- **Nền Dark Mode**: `bg-[#000000]` với hiệu ứng quầng sáng chuyển động ngầm.
- **Thẻ Glassmorphic**: `bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.03)]`.
- **Bo góc (Corner Radius)**: Thẻ lớn `rounded-[2rem]`, thẻ vừa `rounded-[1.25rem]`, nút bấm `rounded-full`.
- **Khung chứa**: `w-full max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8`.

---

## 2. Tránh các lỗi phổ biến trong React & Next.js

1. **Purge Bug trong Tailwind**:
   - Không nối chuỗi Tailwind dạng ``text-${align}``.
   - Dùng map rõ ràng: `align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left"`.
2. **Hydration Mismatch**:
   - Dùng `isMounted` state kiểm tra trước khi render dữ liệu từ `localStorage`, `window`, hoặc `Date`.
3. **Hiển thị Toán học qua `<MathText>`**:
   - Mọi nội dung chứa công thức toán Latex hoặc Bảng Markdown đều phải bọc qua `<MathText text={...} />`.
