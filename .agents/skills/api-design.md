---
name: api-design
description: Quy chuẩn thiết kế API Route Handlers trong Next.js App Router và xử lý phản hồi JSON cho DBAQ LMS.
---

# Kỹ năng Thiết kế API (API Design Skill) - DBAQ LMS

Tài liệu này hướng dẫn quy chuẩn xây dựng các API Route Handlers (`src/app/api/...`) đạt hiệu năng cao, an toàn và dễ mở rộng.

---

## 1. Cấu trúc Route Handler chuẩn

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // 1. Validate payload input
    if (!body.title) {
      return NextResponse.json({ error: "Thiếu tiêu đề bài tập" }, { status: 400 });
    }

    // 2. Tương tác DB bằng Supabase Admin / Authenticated Client
    const supabase = createAdminClient();
    const { data, error } = await supabase.from("assignments").insert(body).select().single();

    if (error) {
      console.error("[API_ASSIGNMENTS_CREATE_ERROR]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 3. Trả về kết quả thành công
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: any) {
    console.error("[API_ASSIGNMENTS_POST_CRASH]", err);
    return NextResponse.json({ error: "Lỗi hệ thống nội bộ" }, { status: 500 });
  }
}
```

---

## 2. Các Quy tắc Bắt buộc khi làm việc với API

1. **Xử lý Timeout & Signal**:
   - Mọi fetch call gọi dịch vụ bên ngoài (OpenRouter, Groq, OCR.space) phải dùng `fetchWithTimeout` với AbortController để giải phóng kết nối socket khi timeout.
2. **Cấu trúc Response Nhất quán**:
   - Thành công: `{ success: true, ...data }`
   - Thất bại: `{ error: string, details?: any }`
3. **Mã Trạng thái HTTP (Status Codes)**:
   - `200 OK`: Truy vấn / cập nhật thành công.
   - `201 Created`: Tạo bản ghi mới thành công.
   - `400 Bad Request`: Payload không hợp lệ.
   - `401 Unauthorized`: Chưa đăng nhập.
   - `403 Forbidden`: Không có quyền truy cập.
   - `404 Not Found`: Không tìm thấy tài nguyên.
   - `500 Internal Server Error`: Lỗi xử lý server.
