import type { Dictionary } from "@/i18n";

export function homeworkStatusMeta(dict: Dictionary) {
  return {
    PENDING: { label: dict.homework.statusPending, variant: "warning" as const },
    SUBMITTED: { label: dict.homework.statusSubmitted, variant: "default" as const },
    GRADED: { label: dict.homework.statusGraded, variant: "success" as const },
    OVERDUE: { label: dict.homework.statusOverdue, variant: "danger" as const },
  };
}

export const homeworkStatusOrder = ["OVERDUE", "PENDING", "SUBMITTED", "GRADED"];
