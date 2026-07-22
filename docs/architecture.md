# Kiến trúc Hệ thống (System Architecture) - DBAQ LMS

Dự án **Gia sư Đào Bá Anh Quân (DBAQ LMS)** là hệ thống quản lý học tập (Learning Management System) dành cho dạy học trắc nghiệm & tự luận toán học, đồng bộ lịch dạy, quản lý tài liệu và theo dõi tiến trình làm bài của học sinh thời gian thực.

---

## 1. Công nghệ Nòng cốt (Tech Stack)

- **Frontend / Framework**: Next.js 15 (App Router), React 18, TypeScript 5.5, Tailwind CSS 3.4.
- **Backend / Database**: Supabase (PostgreSQL + Auth + Storage + Realtime Channels).
- **AI Pipeline**: OCR.space API (Xử lý ảnh/PDF), OpenRouter AI (`nvidia/nemotron-3-ultra-550b-a55b:free`, `qwen/qwen-plus`), Groq (`qwen/qwen3-32b`).
- **Math & Table Renderer**: KaTeX 0.16 (Công thức toán LaTeX), Custom Splitter (Render bảng số liệu Markdown/Tabular).
- **Authentication**: Supabase Auth + Passkey (WebAuthn `@simplewebauthn`).

---

## 2. Luồng Dữ liệu Chính (Core Data Flows)

### A. Luồng Sinh câu hỏi bằng AI (`/api/admin/ai/generate`)
1. **Input**: Văn bản dán trực tiếp, ảnh chụp đề bài (PNG/JPG), hoặc file PDF.
2. **OCR & Làm sạch**: Nén ảnh bằng `sharp` -> Gọi `callOcrSpaceApi` (bật `isTable: "true"`) -> `cleanOcrText`.
3. **Bóc tách Heuristic (Heuristic Parser)**:
   - Đọc văn bản theo ranh giới `Câu X` và dấu `---`.
   - Giữ nguyên ký tự xuống dòng `\n` cho các bảng dữ liệu Markdown/cột số liệu.
   - Nhận diện chính xác câu hỏi có ghi chú hoặc mệnh đề `1.`, `2.`, `3.`, `4.` trong đề bài mà không làm vỡ câu.
4. **Giải đáp án tự động (Answer Solving)**:
   - Gọi `resolveAnswersWithAi` bóc tách từng batch 8 câu.
   - Thời gian timeout khống chế tối đa `18s`. Nếu gặp lỗi Rate Limit 429 hoặc timeout, tự động trả về toàn bộ câu hỏi đã bóc tách với đáp án mặc định `"A"` mà không bao giờ treo server.

### B. Luồng Học sinh Làm bài (`AssignmentTaking.tsx`)
1. **Lưu nháp ngay lập tức (Immediate Local Draft)**: Mọi thao tác chọn đáp án được lưu tức thì vào `localStorage` (`assignment-draft-[id]`).
2. **Đồng bộ ngầm (Background Sync)**: Debounce 1s gửi PATCH request lên server `/api/student-sessions/[id]/draft` để lưu tiến trình.
3. **Heartbeat activity**: Gửi ping 15s/lần cập nhật trạng thái online/active cho Admin theo dõi thời gian thực.

---

## 3. Bản đồ Thư mục (Directory Structure)

```
d:\Code\dbaq-lms\
├── AGENTS.md                  # Quy định tối thượng cho AI Agents
├── docs/                      # Tài liệu kiến trúc & quy chuẩn
│   ├── architecture.md
│   ├── conventions.md
│   ├── workflow.md
│   └── decisions.md
├── .agents/
│   ├── DESIGN.md              # Quy chuẩn thiết kế UI/UX Apple Soft Modern
│   ├── UPDATE_ICON_GUIDE.md   # Quy trình cập nhật Logo/Icon/PWA
│   └── skills/                # Kỹ năng chuyên sâu cho AI Agents
│       ├── api-design.md
│       ├── react.md
│       ├── database.md
│       └── testing.md
├── src/
│   ├── app/                   # Next.js App Router (pages & API routes)
│   ├── components/            # Shared UI components (MathText, AssignmentQuestion, HeaderBar)
│   ├── features/              # Feature modules (admin, assignments, home, schedule, documents)
│   ├── lib/                   # Utility functions, AI generation pipeline, Supabase clients
│   └── providers/             # React context providers (ThemeProvider)
```
