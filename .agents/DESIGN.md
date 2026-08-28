# Liquid Glass + Fresh Color Design System

Dự án DBAQ LMS áp dụng ngôn ngữ thiết kế **Liquid Glass** (cảm hứng từ Apple) kết hợp với **Fresh Colors** (Màu pastel) để tạo ra một không gian học tập trực tuyến cao cấp, thanh lịch, mềm mại và tràn đầy năng lượng.

**Mọi trợ lý AI khi làm việc với giao diện bắt buộc phải tuân thủ nghiêm ngặt các nguyên tắc thị giác (Visual Principles) dưới đây.**

---

## 1. Triết lý Thiết kế (Design Direction)
- **Cao cấp & Không gian (Premium & Spatial)**: Giao diện phải cảm giác có chiều sâu vật lý.
- **Tính năng Kính (Functional Glass)**: Không phủ kính toàn bộ ứng dụng. Kính (Glass) chỉ dùng làm Lớp Chức Năng (Navigation, Toolbar, Modal, Floating Controls) lơ lửng trên Lớp Nội Dung (Content Layer - background phẳng hoặc gradient mờ).
- **Phản hồi vật lý (Physical Feedback)**: Các nút bấm, component tương tác phải mô phỏng tính đàn hồi của vật lý (Spring-like animations). Không sử dụng animation tuyến tính (linear) khô cứng.

---

## 2. Hệ thống Vật liệu (Liquid Glass Material)
Bất kỳ thành phần Glass nào cũng phải bao gồm các yếu tố sau thay vì chỉ `backdrop-filter` đơn thuần:
- **Translucency (Độ trong suốt)**: Nền bán trong suốt `bg-white/70` hoặc `bg-slate-100/80` (Darkmode: `bg-[#2a2a2c]/80`).
- **Blur & Saturation**: `backdrop-blur-md` hoặc `backdrop-blur-xl`.
- **Specular Highlight**: Đường viền sáng mỏng tạo cảm giác kính `border border-white/40` (Light) hoặc `border-white/10` (Dark).
- **Soft Shadows (Bóng đổ đa lớp)**: Sử dụng `--shadow-glass` hoặc các hiệu ứng shadow mềm (tránh viền đen gắt).

---

## 3. Hệ thống Hình khối (Concentric Geometry)
- Loại bỏ hoàn toàn góc cạnh sắc nhọn. Sử dụng bán kính bo tròn cực kỳ hào phóng và đồng tâm.
- **Thành phần lớn (Cards, Hero)**: `rounded-[2rem]` (32px) hoặc `rounded-[2.5rem]`.
- **Nút bấm, Tags (Pills/Capsules)**: `rounded-full` (999px).
- **Controls trung bình**: `rounded-[1.25rem]` hoặc `rounded-2xl`.
- Tuyệt đối không nhồi nhét một nút `rounded-sm` vào trong một thẻ `rounded-[2rem]`.

---

## 4. Tương tác & Trạng thái (Interactions & States)
Mọi component tương tác phải có cảm giác "sống động":
- **Default**: Yên tĩnh, độ nhiễu thị giác thấp.
- **Hover**: 
  - Nổi lên nhẹ (`translate-y-[-2px]`)
  - Bóng đổ lan toả mạnh hơn (`shadow-lg` mềm)
  - Scale siêu nhẹ (VD: `scale-[1.01]`)
  - Sáng lên nhẹ.
- **Active / Pressed**: 
  - Scale nhỏ lại (`active:scale-95`) để tạo cảm giác bị nén.
  - Sử dụng timing `duration-300` và easing mượt.
- **Glass Morphing**: Khi chuyển trạng thái (ví dụ tab active), ưu tiên sử dụng hiệu ứng hình khối di chuyển (như segmented control) thay vì chỉ nhấp nháy đổi màu.

---

## 5. Màu sắc (Colors) & Typography
Sự kết hợp giữa Apple Minimalism và Giáo dục tươi trẻ:
- **Action Blue (`#0066cc`)**: Màu tương tác chính. Thường đi kèm `shadow-blue-500/20` để phát sáng nhẹ.
- **Nền (Surface)**: Trắng tinh (`bg-white`), Xám nhạt (`bg-[#f5f5f7]`) hoặc nền kính. Darkmode: Đen (`bg-black`), Xám tối (`#1d1d1f`).
- **Pastel Badges (Môn học)**: 
  - Toán: `bg-blue-50 text-blue-600`
  - Lý: `bg-indigo-50 text-indigo-600`
  - Hoá: `bg-emerald-50 text-emerald-600`
- **Typography**: Tracking âm cho Headline (`tracking-[-0.02em]`), `leading-tight`. Trọng tâm vào chữ rất nét, rõ ràng, không bị chìm nghỉm vào background.

---

## 6. Layout & Alignment
- **Global Container**: `max-w-[1440px] px-4 sm:px-6 md:px-8` mx-auto. Mọi thứ phải canh lề chính xác.
- **Khoảng trống (Space)**: Không nhồi nhét. Hãy để UI được thở. Sử dụng padding, gap hào phóng (`gap-6`, `gap-8`).

> **Châm ngôn tối thượng:** Giao diện cần "Thanh lịch + Cao cấp + Mượt mà + Không gian" chứ không phải "Trong suốt quá đà + Bóng nhòe + Nặng nề".
