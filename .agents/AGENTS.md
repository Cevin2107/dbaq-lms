# Quy định dành cho AI (AI Agents Guidelines)

Dự án này áp dụng các tiêu chuẩn thiết kế và vận hành riêng biệt. Mọi trợ lý AI khi làm việc trên thư mục này BẮT BUỘC phải đọc và tuân thủ nghiêm ngặt các quy định sau:

## 1. Hệ thống thiết kế (Design System & Aesthetics)
Mọi thay đổi về giao diện (UI/UX) hoặc phát triển các thành phần mới phải tuân thủ hướng dẫn thiết kế trong file:
- [.agents/DESIGN.md](file:///D:/Code/WebBaiTap/.agents/DESIGN.md)

## 2. Quy trình thay đổi ảnh Logo/Icon và PWA
Mỗi khi Người dùng yêu cầu đổi Logo hoặc Icon hiển thị của trang web/PWA, bạn phải làm theo đúng các bước tuần tự được hướng dẫn trong file:
- [.agents/UPDATE_ICON_GUIDE.md](file:///D:/Code/WebBaiTap/.agents/UPDATE_ICON_GUIDE.md)

Tuyệt đối không bỏ qua bước tăng phiên bản cache-buster trong manifest và copy đầy đủ vào 3 thư mục chỉ định để tránh lỗi cache trên thiết bị của người dùng.
