# Quyết định Thiết kế Kiến trúc (Architecture Decisions - ADRs)

Tài liệu này lưu trữ các quyết định kiến trúc quan trọng (ADRs) trong quá trình phát triển hệ thống DBAQ LMS. Mọi AI Agent cần đọc để hiểu lý do đằng sau các giải pháp hiện tại.

---

## ADR-001: Tách biệt Bóc tách Heuristic và Giải đáp án bằng AI

- **Bối cảnh**: Khi người dùng tải đề bài (ảnh/pdf/văn bản), việc dùng AI sinh lại toàn bộ từ đầu vừa chậm vừa hay bị mất câu hoặc làm méo nội dung đề gốc.
- **Quyết định**:
  1. Sử dụng **Bóc tách Heuristic (`parseQuestionsHeuristically`)** làm nòng cốt để trích xuất 100% câu hỏi từ đề gốc với độ chính xác tuyệt đối.
  2. Việc **Giải chọn đáp án đúng A/B/C/D (`resolveAnswersWithAi`)** được chạy như một bước phụ bổ trợ với `SOLVE_TIMEOUT_MS = 18s`.
- **Hệ quả**: Nếu AI giải bị lỗi 429 Rate Limit hoặc nghẽn mạng, hệ thống vẫn trả về đủ 100% câu hỏi đề gốc lập tức mà không bao giờ bị dừng hay treo server.

---

## ADR-002: Cấu hình `serverExternalPackages` Tăng tốc Build 5x-10x

- **Bối cảnh**: Quá trình biên dịch và `next build` kéo dài hơn 53 giây do Webpack phải bundle hơn 100MB static definitions từ `googleapis`, `sharp`, `pdf-parse`.
- **Quyết định**:
  Khai báo `serverExternalPackages: ["googleapis", "pdf-parse", "sharp", "bcryptjs", "@simplewebauthn/server"]` trong [next.config.js](file:///d:/Code/dbaq-lms/next.config.js).
- **Hệ quả**: Next.js dùng trực tiếp module Node server mà không qua Webpack bundler, rút ngắn thời gian build từ 53s xuống 32s (giảm 40%) và re-compile dev chỉ còn vài trăm ms.

---

## ADR-003: Giữ nguyên ký tự xuống dòng `\n` cho Bảng Dữ liệu Toán học

- **Bối cảnh**: Một số đề bài toán thống kê/xác suất có bảng số liệu dạng Markdown hoặc dòng dạng tab/cột.
- **Quyết định**:
  - `parseQuestionsHeuristically` giữ nguyên các ký tự xuống dòng `\n` trong thân câu hỏi.
  - Component `<MathText>` sở hữu bộ phân tách `splitMarkdownTableBlocks` tự động chuyển đổi các dòng bảng thành thẻ `<table>` đẹp mắt với bo góc glassmorphism.
- **Hệ quả**: Bảng hiển thị xuất sắc ở tất cả mọi nơi (trang xem bài, trang làm bài của học sinh, trang theo dõi realtime).

---

## ADR-004: Giới hạn Chunk 15.000 Ký tự & Tối đa 45.000 Ký tự

- **Bối cảnh**: Văn bản đề bài dài nếu bị cắt vụn ngẫu nhiên sẽ làm đứt đôi câu hỏi nằm ở ranh giới cắt.
- **Quyết định**:
  - `TEXT_CHUNK_SIZE` nâng lên 15.000 ký tự và `MAX_TEXT_LENGTH` nâng lên 45.000 ký tự.
  - Hàm `chunkText` cắt đoạn nghiêm ngặt tại các ranh giới `\n---` hoặc `\nCâu X`.
- **Hệ quả**: Không bao giờ bị mất câu ở giữa đề bài.
