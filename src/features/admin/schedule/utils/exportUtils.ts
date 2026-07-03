import { toPng } from "html-to-image";

export async function exportToImage(elementId: string, filename: string) {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error("Element not found");
  }

  // Tăng width lên 1400px để đảm bảo grid không bao giờ bị cắt viền
  const targetWidth = 1400;

  // ===== HIỂN THỊ OVERLAY CHE MÀN HÌNH =====
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.backgroundColor = "#ffffff"; // Che đặc 100% để không thấy hiệu ứng giật layout
  overlay.style.zIndex = "999999";
  overlay.style.display = "flex";
  overlay.style.flexDirection = "column";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.gap = "16px";
  overlay.style.fontSize = "16px";
  overlay.style.fontWeight = "600";
  overlay.style.color = "#0066cc";
  overlay.innerHTML = `
    <div style="width:44px;height:44px;border:4px solid #0066cc;border-bottom-color:transparent;border-radius:50%;animation:_spin 1s linear infinite"></div>
    <div>Đang xử lý ảnh...</div>
    <style>@keyframes _spin{to{transform:rotate(360deg)}}</style>
  `;
  document.body.appendChild(overlay);

  // ===== LƯU TRẠNG THÁI CŨ =====
  const previousCssText = element.style.cssText;
  const previousClass = element.className;

  try {
    // Thêm class xuất desktop
    element.classList.add("export-desktop");

    // ===== ÉP KÍCH THƯỚC TRỰC TIẾP =====
    // Ép cứng width, loại bỏ margin auto để phần tử không bị lệch
    element.style.width = `${targetWidth}px`;
    element.style.minWidth = `${targetWidth}px`;
    element.style.maxWidth = `${targetWidth}px`;
    element.style.margin = "0"; 
    element.style.boxSizing = "border-box";

    // Đợi 200ms để trình duyệt apply layout chuẩn xác
    await new Promise(resolve => setTimeout(resolve, 200));

    const targetHeight = element.scrollHeight;

    // ===== CHỤP ẢNH =====
    const dataUrl = await toPng(element, {
      backgroundColor: "#f8fafc",
      pixelRatio: 2,
      cacheBust: true,
      width: targetWidth,
      height: targetHeight,
      style: {
        // Khôi phục margin và position trong canvas để ảnh chuẩn 0,0
        margin: "0",
        position: "relative",
        top: "0",
        left: "0",
        transform: "none",
        width: `${targetWidth}px`,
      },
      filter: (node) => {
        const el = node as HTMLElement;
        if (el?.tagName === "BUTTON") return false;
        return true;
      },
    });

    // ===== TẢI ẢNH =====
    const link = document.createElement("a");
    link.download = filename;
    link.href = dataUrl;
    link.click();
  } finally {
    // ===== KHÔI PHỤC TẤT CẢ =====
    element.className = previousClass;
    element.style.cssText = previousCssText;
    document.body.removeChild(overlay);
  }
}