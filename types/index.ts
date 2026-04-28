export type UserRole = "ADMIN" | "DOCTOR" | "NURSE" | "PATIENT";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type AppointmentStatus =
  | "SCHEDULED"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export type CarePlanStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED";

export interface PatientSummary {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: string;
  riskLevel: RiskLevel;
  riskScore: number;
  isActive: boolean;
  primaryProvider?: { id: string; name: string } | null;
  _count?: { tasks: number; appointments: number };
}

export interface DashboardStats {
  totalPatients: number;
  criticalPatients: number;
  pendingTasks: number;
  todayAppointments: number;
  unreadMessages: number;
  overdueTasks: number;
}

declare module "next-auth" {
  interface User {
    role?: string;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
    };
  }
}

