/**
 * Helper to remove Vietnamese diacritics and special characters, returning clean uppercase ASCII.
 */
export function removeVietnameseDiacritics(str: string): string {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim()
    .toUpperCase();
}

/**
 * Generates clean transfer content for VietQR.
 * Format: HP <STUDENT_COMPACT_ASCII> T<MONTH>
 * Max length: 23 chars, uppercase, no spaces or special chars.
 * Example: HP LEGIAHUY T7
 */
export function generateTransferContent(studentName: string, month: number): string {
  const cleanName = removeVietnameseDiacritics(studentName).replace(/\s+/g, "");
  // Allocate space for "HP " (3 chars) and " T" + month (e.g. " T12" = 4 chars)
  const monthTag = ` T${month}`;
  const maxNameLength = 23 - 3 - monthTag.length;
  const truncatedName = cleanName.slice(0, Math.max(3, maxNameLength));
  return `HP ${truncatedName}${monthTag}`.replace(/\s+/g, "").toUpperCase();
}

/**
 * Generates Invoice Code format: INV-YYYYMM-STUDENT
 * Example: INV-202607-LEGIAHUY
 */
export function generateInvoiceCode(studentName: string, year: number, month: number): string {
  const cleanName = removeVietnameseDiacritics(studentName).replace(/\s+/g, "");
  const monthStr = String(month).padStart(2, "0");
  const truncatedName = cleanName.slice(0, 10);
  return `INV-${year}${monthStr}-${truncatedName}`;
}

/**
 * Calculates due date (e.g. 05 of the next month).
 * Example: 05/08/2026 for month 7/2026.
 */
export function getPaymentDueDate(year: number, month: number): string {
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const monthStr = String(nextMonth).padStart(2, "0");
  return `05/${monthStr}/${nextYear}`;
}
