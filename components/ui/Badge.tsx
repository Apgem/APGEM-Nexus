import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "outline";
}

export function Badge({ children, className, variant = "default" }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        variant === "outline" && "border",
        className
      )}
    >
      {children}
    </span>
  );
}

export function RiskBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    LOW: "bg-green-100 text-green-800",
    MEDIUM: "bg-yellow-100 text-yellow-800",
    HIGH: "bg-orange-100 text-orange-800",
    CRITICAL: "bg-red-100 text-red-800 animate-pulse",
  };
  return <Badge className={styles[level] ?? styles.LOW}>{level}</Badge>;
}

export function StatusBadge({ status, type = "task" }: { status: string; type?: "task" | "appt" | "care" }) {
  const taskStyles: Record<string, string> = {
    PENDING: "bg-gray-100 text-gray-700",
    IN_PROGRESS: "bg-blue-100 text-blue-700",
    COMPLETED: "bg-green-100 text-green-700",
    OVERDUE: "bg-red-100 text-red-700",
  };
  const apptStyles: Record<string, string> = {
    SCHEDULED: "bg-blue-100 text-blue-700",
    CONFIRMED: "bg-indigo-100 text-indigo-700",
    COMPLETED: "bg-green-100 text-green-700",
    CANCELLED: "bg-gray-100 text-gray-500",
    NO_SHOW: "bg-red-100 text-red-700",
  };
  const careStyles: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-600",
    ACTIVE: "bg-green-100 text-green-700",
    PAUSED: "bg-yellow-100 text-yellow-700",
    COMPLETED: "bg-blue-100 text-blue-700",
  };
  const map = type === "appt" ? apptStyles : type === "care" ? careStyles : taskStyles;
  return <Badge className={map[status] ?? "bg-gray-100 text-gray-600"}>{status.replace("_", " ")}</Badge>;
}

export function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    LOW: "bg-gray-100 text-gray-600",
    MEDIUM: "bg-yellow-100 text-yellow-700",
    HIGH: "bg-orange-100 text-orange-700",
    URGENT: "bg-red-100 text-red-700",
  };
  return <Badge className={styles[priority] ?? styles.MEDIUM}>{priority}</Badge>;
}
