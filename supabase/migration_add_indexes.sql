-- ============================================
-- MIGRATION: THÊM CHỈ MỤC (INDEXES) TỐI ƯU HIỆU NĂNG
-- Hỗ trợ sắp xếp/lọc nhanh hơn, không làm mất dữ liệu hiện trạng
-- Chạy đoạn mã này trong Supabase SQL Editor
-- ============================================

-- 1. Chỉ mục hỗ trợ sắp xếp và lọc cho Submissions theo thời gian nộp bài
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON submissions(submitted_at DESC);

-- 2. Chỉ mục hỗ trợ sắp xếp và lọc trạng thái realtime của Student Sessions
CREATE INDEX IF NOT EXISTS idx_student_sessions_started_at ON student_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_sessions_last_activity ON student_sessions(last_activity_at DESC);

-- 3. Chỉ mục hỗ trợ sắp xếp danh sách Assignments theo ngày tạo
CREATE INDEX IF NOT EXISTS idx_assignments_created_at ON assignments(created_at DESC);
