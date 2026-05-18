import { toPng } from "html-to-image";

export async function exportToImage(elementId: string, filename: string) {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error("Element not found");
  }

  const previousClass = element.classList.contains("export-desktop");
  const previousWidth = element.style.width;
  const previousMaxWidth = element.style.maxWidth;
  const previousMargin = element.style.margin;
  const previousBoxSizing = element.style.boxSizing;

  element.classList.add("export-desktop");
  element.style.width = "1200px";
  element.style.maxWidth = "1200px";
  element.style.margin = "0 auto";
  element.style.boxSizing = "border-box";

  const dataUrl = await toPng(element, {
    backgroundColor: "#f3f4f6",
    pixelRatio: 2,
    cacheBust: true,
  });

  element.style.width = previousWidth;
  element.style.maxWidth = previousMaxWidth;
  element.style.margin = previousMargin;
  element.style.boxSizing = previousBoxSizing;
  if (!previousClass) {
    element.classList.remove("export-desktop");
  }

  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}
