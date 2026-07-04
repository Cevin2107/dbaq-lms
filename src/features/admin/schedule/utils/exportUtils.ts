import { toPng } from "html-to-image";

export async function exportToImage(elementId: string, filename: string) {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error("Element not found");
  }

  // Tăng chiều rộng lên Desktop để không bị ép chật dẫn đến tràn viền
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
  overlay.innerHTML = `<div style="width:40px;height:40px;border:4px solid #0066cc;border-bottom-color:transparent;border-radius:50%;display:inline-block;animation:spin 1s linear infinite;margin-bottom:16px;"></div><div>Đang xuất ảnh...</div><style>@keyframes spin { 100% { transform: rotate(360deg); } }</style>`;
  document.body.appendChild(overlay);

  // Lưu lại các style hiện tại
  const previousCssText = element.style.cssText;
  const previousClass = element.className;

  try {
    // Thêm class export-desktop
    element.classList.add("export-desktop");

    // ĐO KÍCH THƯỚC ĐỒNG BỘ TRỰC TIẾP TRÊN PHẦN TỬ THẬT:
    // Bắt buộc kích thước 1280px, thêm padding để nội dung không chạm sát viền
    element.style.width = `${targetWidth}px`;
    element.style.minWidth = `${targetWidth}px`;
    element.style.maxWidth = `${targetWidth}px`;
    element.style.boxSizing = "border-box";
    element.style.padding = "32px";
    
    // Đợi trình duyệt cập nhật layout thực tế (quan trọng để không bị cắt viền)
    await new Promise(resolve => setTimeout(resolve, 150));

    const targetHeight = element.scrollHeight;

    // Chụp ảnh bằng html-to-image với kích thước đã đo đạc
    const dataUrl = await toPng(element, {
      backgroundColor: "#f5f5f7",
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
        transform: "scale(1)"
      },
      filter: (node) => {
        const el = node as HTMLElement;
        if (el?.tagName === "BUTTON") return false;
        return true;
      }
    });

    const link = document.createElement("a");
    link.download = filename;
    link.href = dataUrl;
    link.click();
  } finally {
    // Khôi phục class và style ngay lập tức sau khi chụp xong
    element.className = previousClass;
    element.style.cssText = previousCssText;
    document.body.removeChild(overlay);
  }
}