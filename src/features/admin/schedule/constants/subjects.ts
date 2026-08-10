import type { Subject } from "@/features/admin/schedule/lib/database.types";

export const SUBJECTS: Subject[] = ["Toan", "Ly"];

export const SUBJECT_NAMES: Record<Subject, string> = {
  Toan: "Toán",
  Ly: "Lý",
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
};

export const PRICE_PER_SESSION = 200000;
