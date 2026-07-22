---
name: database
description: Quy chuẩn quản lý cơ sở dữ liệu Supabase PostgreSQL, RLS policies và toàn vẹn dữ liệu cho DBAQ LMS.
---

# Kỹ năng Quản lý Cơ sở dữ liệu (Database Skill) - DBAQ LMS

Tài liệu này quy định các nguyên tắc tương tác với cơ sở dữ liệu Supabase trong hệ thống DBAQ LMS.

---

## 1. Nguyên tắc Toàn vẹn Dữ liệu

1. **Khóa Admin Supabase (`supabaseAdmin.ts`)**:
   - Chỉ được dùng `createAdminClient()` trong các API Route Handlers trên server.
   - TUYỆT ĐỐ NGHÊM CẤM leak `SUPABASE_SERVICE_ROLE_KEY` xuống client-side components.
2. **Xử lý Transactional Integrity**:
   - Khi xóa bài tập (`assignments`), phải xóa hoặc hủy các dữ liệu con liên quan (`questions`, `submissions`, `student_sessions`, Google Calendar events).
3. **Optimistic & Soft Delete**:
   - Lưu trữ lịch sử bài nộp (`submissions`) của học sinh để giáo viên tra cứu sự tiến bộ thay vì ghi đè trực tiếp.

---

## 2. Quản lý Bảng chính trong CSDL

- `assignments`: Quản lý bài tập (tiêu đề, môn học, khối lớp, thời gian làm bài, chế độ xem đáp án).
- `questions`: Quản lý danh sách câu hỏi (loại MCQ/tự luận/điền từ, nội dung stem, lựa chọn A/B/C/D, đáp án đúng, điểm số).
- `submissions`: Quản lý kết quả nộp bài của học sinh.
- `student_sessions`: Quản lý phiên làm bài và tiến trình làm bài theo thời gian thực (realtime tracking).
