# Quy chuẩn Lập trình (Coding Conventions) - DBAQ LMS

Tài liệu này quy định các tiêu chuẩn viết mã nguồn nhằm đảm bảo tính nhất quán, hiệu năng cao và dễ bảo trì trên toàn bộ dự án.

---

## 1. Quy chuẩn TypeScript & Khai báo Kiểu

1. **Strict Type Safety**:
   - Mọi biến, tham số hàm, prop của component đều phải có kiểu dữ liệu rõ ràng.
   - Không được dùng `any` bừa bãi. Sử dụng `unknown` và type guard nếu chưa xác định kiểu.
2. **Clickable Symbol Links**:
   - Khi giao tiếp hoặc viết báo cáo, mọi đường dẫn file hoặc symbol (Class, Function, Interface) phải có dạng markdown link: `[filename](file:///path/to/file)`.

---

## 2. Quy chuẩn Next.js & React

1. **Server vs Client Components**:
   - Đặt `"use client";` ở đầu file khi component cần state (`useState`), effect (`useEffect`), hoặc lắng nghe sự kiện trình duyệt.
   - Giữ các trang (`page.tsx`) là Server Component khi cần fetch dữ liệu từ Supabase hoặc kiểm tra cookie.
2. **Tránh Hydration Mismatch**:
   - Các dữ liệu liên quan đến thời gian, `localStorage`, hoặc theme trình duyệt phải được bọc trong kiểm tra `isMounted` hoặc chạy trong `useEffect`.
3. **Tối ưu hóa Render với Memoization**:
   - Các component danh sách nhiều câu hỏi như `AssignmentQuestion` phải được bọc trong `memo` với hàm so sánh prop chuẩn xác.
   - Dùng `useCallback` cho các hàm truyền xuống child component để tránh re-render thừa.

---

## 3. Quy chuẩn Tailwind CSS & Giao diện (UI/UX)

1. **Tuân thủ `.agents/DESIGN.md`**:
   - Luôn đọc và tuân thủ [.agents/DESIGN.md](file:///d:/Code/dbaq-lms/.agents/DESIGN.md) khi viết Tailwind CSS.
2. **Quy tắc Căn lề Container**:
   - Mọi container ngang chính phải dùng: `w-full max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8`.
3. **Quy tắc Tránh Tailwind Purge Bug**:
   - Không được ghép chuỗi Tailwind động như ``text-${align}`` hay ``bg-${color}-500``.
   - BẮT BUỘC dùng map rõ ràng:
     ```typescript
     const alignClass = align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";
     ```
4. **Màu sắc & Dark Mode**:
   - Nút tương tác chính: Action Blue `#0066cc`.
   - Nền Dark Mode: `bg-[#000000]` kết hợp với thẻ glassmorphism `bg-[#1d1d1f]/80 border border-white/10`.

---

## 4. Quy chuẩn KaTeX & Hiển thị Bảng Toán học

1. **Render Toán bằng `<MathText>`**:
   - Mọi nội dung câu hỏi, lựa chọn A/B/C/D hay văn bản có chứa KaTeX/Latex phải được hiển thị qua component `<MathText text={...} />`.
   - Không được cắt chuỗi bằng `split('\n')` trước khi qua `MathText` vì sẽ phá hỏng các bảng Markdown số liệu nhiều dòng.
