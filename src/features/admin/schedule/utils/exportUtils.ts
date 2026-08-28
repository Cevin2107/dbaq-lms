import { toPng } from "html-to-image";

export async function exportToImage(elementId: string, filename: string) {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error("Element not found");
  }

  // Tăng chiều rộng lên Desktop (1280px) để giao diện xuất ảnh chuẩn 2 cột như trên PC
  const targetWidth = 1280;

  // Hiển thị overlay che màn hình để giấu flash khi đổi layout
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.backgroundColor = "rgba(255, 255, 255, 0.95)";
  overlay.style.zIndex = "99999";
  overlay.style.display = "flex";
  overlay.style.flexDirection = "column";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.fontSize = "18px";
  overlay.style.fontWeight = "bold";
  overlay.style.color = "#0066cc";
  overlay.innerHTML = `<div style="width:40px;height:40px;border:4px solid #0066cc;border-bottom-color:transparent;border-radius:50%;display:inline-block;animation:spin 1s linear infinite;margin-bottom:16px;"></div><div>Đang xuất phiếu học phí...</div><style>@keyframes spin { 100% { transform: rotate(360deg); } }</style>`;
  document.body.appendChild(overlay);

  // Lưu lại các style hiện tại
  const previousCssText = element.style.cssText;
  const previousClass = element.className;
  const isDark = document.documentElement.classList.contains("dark");

  try {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      // Đợi DOM cập nhật giao diện sáng
      await new Promise(r => setTimeout(r, 150));
    }

    // Thêm class export-desktop
    element.classList.add("export-desktop");

    // ĐO KÍCH THƯỚC ĐỒNG BỘ TRỰC TIẾP TRÊN PHẦN TỬ THẬT:
    element.style.width = `${targetWidth}px`;
    element.style.minWidth = `${targetWidth}px`;
    element.style.maxWidth = `${targetWidth}px`;
    element.style.boxSizing = "border-box";
    element.style.padding = "24px";

    // Đợi tất cả hình ảnh trong container (bao gồm mã QR) nạp xong 100%
    const images = Array.from(element.querySelectorAll("img"));
    await Promise.all(
      images.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete && img.naturalWidth !== 0) {
              resolve();
            } else {
              img.onload = () => resolve();
              img.onerror = () => resolve();
              // Timeout 1s để không treo nếu lỗi
              setTimeout(resolve, 1000);
            }
          })
      )
    );

    // Đợi trình duyệt cập nhật layout thực tế (quan trọng để không bị cắt viền)
    await new Promise((resolve) => setTimeout(resolve, 250));

    const targetHeight = element.scrollHeight;

    // Chụp ảnh bằng html-to-image với kích thước đã đo đạc
    const dataUrl = await toPng(element, {
      backgroundColor: "#f8fafc",
      pixelRatio: 2,
      cacheBust: true,
      width: targetWidth,
      height: targetHeight,
      style: {
        width: `${targetWidth}px`,
        minWidth: `${targetWidth}px`,
        maxWidth: `${targetWidth}px`,
        boxSizing: "border-box",
        margin: "0",
        transform: "scale(1)",
      },
      filter: (node) => {
        const el = node as HTMLElement;
        if (el?.tagName === "BUTTON") return false;
        if (el?.classList?.contains("export-hide")) return false;
        return true;
      },
    });

    // Chuyển DataURL thành Blob và thực hiện tải ảnh trực tiếp về thiết bị
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = filename;
    link.href = blobUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  } finally {
    // Khôi phục class và style ngay lập tức sau khi chụp xong
    element.className = previousClass;
    element.style.cssText = previousCssText;
    
    if (isDark) {
      document.documentElement.classList.add("dark");
    }
    
    if (document.body.contains(overlay)) {
      document.body.removeChild(overlay);
    }
  }
}