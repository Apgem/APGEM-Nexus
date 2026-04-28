import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined, fmt = "MMM d, yyyy"): string {
  if (!date) return "—";
  return format(new Date(date), fmt);
}

export function formatDatetime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return format(new Date(date), "MMM d, yyyy h:mm a");
}

export function timeAgo(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function getAge(dob: Date | string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function computeRiskScore(data: {
  readmissionCount?: number;
  lastDischarge?: Date | string | null;
  dateOfBirth?: Date | string | null;
  conditionsCount?: number;
}): { score: number; level: string } {
  let score = 0;
  const readmissions = data.readmissionCount ?? 0;
  score += Math.min(readmissions * 20, 60);

  if (data.lastDischarge) {
    const daysSince = Math.floor(
      (Date.now() - new Date(data.lastDischarge).getTime()) / 86400000
    );
    if (daysSince < 30) score += 25;
    else if (daysSince < 90) score += 10;
  }

  if (data.dateOfBirth) {
    const age = getAge(data.dateOfBirth);
    if (age > 75) score += 10;
    else if (age > 65) score += 5;
  }

  score += Math.min((data.conditionsCount ?? 0) * 5, 25);
  score = Math.min(score, 100);

  const level =
    score >= 75 ? "CRITICAL" : score >= 50 ? "HIGH" : score >= 25 ? "MEDIUM" : "LOW";

  return { score, level };
}

export const RISK_COLORS: Record<string, string> = {
  LOW: "bg-green-100 text-green-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  HIGH: "bg-orange-100 text-orange-800",
  CRITICAL: "bg-red-100 text-red-800",
};

export const TASK_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  OVERDUE: "bg-red-100 text-red-700",
};

export const APPT_STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-700",
  CONFIRMED: "bg-indigo-100 text-indigo-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-gray-100 text-gray-500",
  NO_SHOW: "bg-red-100 text-red-700",
};
