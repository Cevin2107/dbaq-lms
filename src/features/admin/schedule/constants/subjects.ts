import type { Subject } from "@/features/admin/schedule/lib/database.types";

export const SUBJECTS: Subject[] = ["Toan", "Ly", "Hoa"];

export const SUBJECT_NAMES: Record<Subject, string> = {
  Toan: "Toán",
  Ly: "Lý",
  Hoa: "Hóa",
};

export const SUBJECT_COLORS: Record<Subject, { bg: string; border: string; text: string }> = {
  Toan: {
    bg: "bg-blue-500",
    border: "border-blue-600",
    text: "text-blue-600",
  },
  Ly: {
    bg: "bg-orange-500",
    border: "border-orange-600",
    text: "text-orange-600",
  },
  Hoa: {
    bg: "bg-green-500",
    border: "border-green-600",
    text: "text-green-600",
  },
};

export const PRICE_PER_SESSION = 200000;
