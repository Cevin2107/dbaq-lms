import { toPng } from "html-to-image";

export async function exportToImage(elementId: string, filename: string) {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error("Element not found");
  }

  const targetWidth = 1280;

  // ===== HIỂN THỊ OVERLAY CHE MÀN HÌNH =====
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.backgroundColor = "rgba(255,255,255,0.95)";
  overlay.style.zIndex = "99999";
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
    <div>Đang xuất ảnh...</div>
    <style>@keyframes _spin{to{transform:rotate(360deg)}}</style>
  `;
  document.body.appendChild(overlay);

  // ===== LƯU TRẠNG THÁI VIEWPORT =====
  let viewportMeta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
  const previousViewportContent = viewportMeta?.getAttribute("content") ?? null;
  const previousHtmlStyle = document.documentElement.style.cssText;
  const previousBodyStyle = document.body.style.cssText;

  let cloneContainer: HTMLDivElement | null = null;

  try {
    // ===== BƯỚC 1: FORCE VIEWPORT 1280px =====
    if (!viewportMeta) {
      viewportMeta = document.createElement("meta");
      viewportMeta.setAttribute("name", "viewport");
      document.head.appendChild(viewportMeta);
    }
    viewportMeta.setAttribute("content", `width=${targetWidth}`);
    document.documentElement.style.minWidth = `${targetWidth}px`;
    document.body.style.minWidth = `${targetWidth}px`;

    // ===== BƯỚC 2: TẠO CLONE ĐỂ TRÁNH BỊ ẢNH HƯỞNG BỞI PARENT (PADDING/MARGIN) =====
    // Element gốc nằm trong parent có padding (px-3) làm giới hạn chiều rộng,
    // khi force 1280px sẽ bị tràn parent và bị lệch sang phải.
    // Dùng clone bám trực tiếp vào body sẽ thoát khỏi mọi giới hạn này!
    cloneContainer = document.createElement("div");
    cloneContainer.style.position = "absolute";
    cloneContainer.style.top = "0";
    cloneContainer.style.left = "0";
    cloneContainer.style.width = `${targetWidth}px`;
    cloneContainer.style.zIndex = "-9999"; // Ẩn phía dưới
    cloneContainer.style.backgroundColor = "#f8fafc"; // Khớp màu nền
    cloneContainer.style.padding = "32px"; // Padding an toàn
    cloneContainer.style.boxSizing = "border-box";

    const clone = element.cloneNode(true) as HTMLElement;
    clone.classList.add("export-desktop");
    clone.style.width = "100%";
    clone.style.maxWidth = "100%";
    clone.style.margin = "0";
    clone.style.boxSizing = "border-box";

    cloneContainer.appendChild(clone);
    document.body.appendChild(cloneContainer);

    // ===== BƯỚC 3: ĐỢI REFLOW =====
    await new Promise(resolve => setTimeout(resolve, 200));

    const targetHeight = cloneContainer.scrollHeight;

    // ===== BƯỚC 4: CHỤP ẢNH TỪ CLONE CONTAINER =====
    const dataUrl = await toPng(cloneContainer, {
      backgroundColor: "#f8fafc",
      pixelRatio: 2,
      cacheBust: true,
      width: targetWidth,
      height: targetHeight,
      style: {
        position: "relative",
        top: "0",
        left: "0",
        margin: "0",
        transform: "none",
      },
      filter: (node) => {
        const el = node as HTMLElement;
        if (el?.tagName === "BUTTON") return false;
        return true;
      },
    });

    // ===== BƯỚC 5: TẢI ẢNH =====
    const link = document.createElement("a");
    link.download = filename;
    link.href = dataUrl;
    link.click();
  } finally {
    // ===== KHÔI PHỤC TẤT CẢ =====
    if (cloneContainer && document.body.contains(cloneContainer)) {
      document.body.removeChild(cloneContainer);
    }

    if (previousViewportContent !== null) {
      viewportMeta?.setAttribute("content", previousViewportContent);
    } else {
      viewportMeta?.removeAttribute("content");
    }

    document.documentElement.style.cssText = previousHtmlStyle;
    document.body.style.cssText = previousBodyStyle;

    document.body.removeChild(overlay);
  }
}