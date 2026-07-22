# Quy định Tối thượng dành cho AI (AI Agents Master Guidelines)

Dự án này áp dụng các quy chuẩn thiết kế, kiến trúc và vận hành nghiêm ngặt. **Mọi trợ lý AI khi thực thi nhiệm vụ trên codebase này BẮT BUỘC phải đọc và tuân thủ 100% các nguyên tắc sau.**

---

## ⛔ 3 NGUYÊN TẮC BẤT DIÊN DỊCH (NON-NEGOTIABLE RULES)

### 1. ĐỌC CODE THẬT TRƯỚC KHI SỬA (KÍNH CHỐNG ĐOÁN MÃ)
- **TÍNH CHẤT**: **TUYỆT ĐỐ NGHÊM CẤM** đoán tên biến, tên hàm, kiểu dữ liệu, prop key, đường dẫn file hay DB schema.
- **HÀNH ĐỘNG**: Trước khi sửa hay tạo code, AI **BẮT BUỘC** phải gọi các công cụ kiểm tra (`view_file`, `grep_search`, `list_dir`) để đọc chính xác định nghĩa gốc.

### 2. LUÔN TUÂN THỦ HỆ THỐNG THIẾT KẾ (`DESIGN.md`)
- **TÍNH CHẤT**: Mọi thay đổi giao diện (UI/UX) phải ăn khớp 100% với hệ thống Apple Soft Modern.
- **TÀI LIỆU CHUẨN**: Xem chi tiết tại [.agents/DESIGN.md](file:///d:/Code/dbaq-lms/.agents/DESIGN.md).
- **QUY TẮC NÒNG CỐT**: Khung chứa `max-w-[1440px] px-4 sm:px-6 md:px-8`, bo góc `rounded-[2rem]`, màu tương tác Action Blue (`#0066cc`), giao diện kính mờ Glassmorphic (`backdrop-blur-xl`), Darkmode đồng bộ nền `#000000`.

### 3. KHÔNG PHÁ HỎNG LOGIC & LUÔN XÁC NHẬN BẰNG TS-CHECK
- **TÍNH CHẤT**: Sửa code phải bảo toàn 100% logic hiện có, không tự ý xóa assertion, không swallowed exception silent, không thay đổi hợp đồng API khi chưa update nơi gọi.
- **HÀNH ĐỘNG**: Sau khi chỉnh sửa, AI **BẮT BUỘC** phải chạy lệnh kiểm tra TypeScript: `npx tsc --noEmit` và xác nhận 0 lỗi.

---

## 🗺️ HỆ THỐNG TÀI LIỆU DƯỚI ĐÂY (READ ON DEMAND)

Khi làm việc với các thành phần chuyên biệt, AI hãy chủ động đọc các tài liệu tương ứng:

### 🏛️ Tài liệu Kiến trúc & Quy trình (`/docs`)
1. 📐 **Kiến trúc hệ thống**: [docs/architecture.md](file:///d:/Code/dbaq-lms/docs/architecture.md)
2. 📝 **Quy chuẩn lập trình (Conventions)**: [docs/conventions.md](file:///d:/Code/dbaq-lms/docs/conventions.md)
3. 🔄 **Quy trình làm việc (Workflow)**: [docs/workflow.md](file:///d:/Code/dbaq-lms/docs/workflow.md)
4. 📌 **Quyết định thiết kế (ADR / Decisions)**: [docs/decisions.md](file:///d:/Code/dbaq-lms/docs/decisions.md)

### 🛠️ Kỹ năng Chuyên sâu (`/.agents/skills`)
1. 🔌 **API Design & Route Handlers**: [.agents/skills/api-design.md](file:///d:/Code/dbaq-lms/.agents/skills/api-design.md)
2. ⚛️ **React & App Router Best Practices**: [.agents/skills/react.md](file:///d:/Code/dbaq-lms/.agents/skills/react.md)
3. 🗄️ **Database & Supabase Integrity**: [.agents/skills/database.md](file:///d:/Code/dbaq-lms/.agents/skills/database.md)
4. 🧪 **Testing & Verification Procedures**: [.agents/skills/testing.md](file:///d:/Code/dbaq-lms/.agents/skills/testing.md)

---

## 🖼️ QUY TRÌNH ĐỔI LOGO / ICON / PWA
Mỗi khi Người dùng yêu cầu đổi Logo hoặc Icon hiển thị của trang web/PWA, bạn phải làm theo đúng các bước tuần tự được hướng dẫn trong file:
- [.agents/UPDATE_ICON_GUIDE.md](file:///d:/Code/dbaq-lms/.agents/UPDATE_ICON_GUIDE.md)
