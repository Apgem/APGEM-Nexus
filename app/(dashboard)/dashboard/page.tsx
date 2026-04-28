import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";
import { RiskBadge, StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { formatDate, formatDatetime } from "@/lib/utils";
import {
  Users,
  AlertTriangle,
  CheckSquare,
  CalendarDays,
  MessageSquare,
  Clock,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

async function getDashboardData(userId: string, role: string) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86400000);

  // Mark overdue tasks
  await prisma.task.updateMany({
    where: { status: { in: ["PENDING", "IN_PROGRESS"] }, dueDate: { lt: now } },
    data: { status: "OVERDUE" },
  });

  const [totalPatients, criticalPatients, pendingTasks, overdueTasks, todayAppts, unread,
    upcomingAppts, myTasks, recentPatients] = await Promise.all([
    prisma.patient.count({ where: { isActive: true } }),
    prisma.patient.count({ where: { isActive: true, riskLevel: "CRITICAL" } }),
    prisma.task.count({ where: { status: "PENDING" } }),
    prisma.task.count({ where: { status: "OVERDUE" } }),
    prisma.appointment.count({
      where: { startTime: { gte: todayStart, lt: todayEnd }, status: { in: ["SCHEDULED", "CONFIRMED"] } },
    }),
    prisma.message.count({ where: { receiverId: userId, readAt: null } }),
    prisma.appointment.findMany({
      where: {
        startTime: { gte: now },
        status: { in: ["SCHEDULED", "CONFIRMED"] },
        ...(role === "DOCTOR" ? { providerId: userId } : {}),
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, riskLevel: true } },
        provider: { select: { id: true, name: true } },
      },
      orderBy: { startTime: "asc" },
      take: 6,
    }),
    prisma.task.findMany({
      where: { assigneeId: userId, status: { in: ["PENDING", "IN_PROGRESS", "OVERDUE"] } },
      include: { patient: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
      take: 6,
    }),
    prisma.patient.findMany({
      where: { isActive: true },
      orderBy: { riskScore: "desc" },
      take: 5,
      select: { id: true, firstName: true, lastName: true, riskLevel: true, riskScore: true, conditions: true },
    }),
  ]);

  return { totalPatients, criticalPatients, pendingTasks, overdueTasks, todayAppts, unread,
    upcomingAppts, myTasks, recentPatients };
}

export default async function DashboardPage() {
  const session = await auth();
  const { totalPatients, criticalPatients, pendingTasks, overdueTasks, todayAppts, unread,
    upcomingAppts, myTasks, recentPatients } =
    await getDashboardData(session!.user.id, session!.user.role);

  const kpis = [
    {
      label: "Active Patients",
      value: totalPatients,
      icon: Users,
      color: "bg-blue-500",
      href: "/patients",
    },
    {
      label: "Critical Risk",
      value: criticalPatients,
      icon: AlertTriangle,
      color: "bg-red-500",
      href: "/patients?risk=CRITICAL",
    },
    {
      label: "Today's Appointments",
      value: todayAppts,
      icon: CalendarDays,
      color: "bg-indigo-500",
      href: "/appointments",
    },
    {
      label: "Pending Tasks",
      value: pendingTasks + overdueTasks,
      icon: CheckSquare,
      color: overdueTasks > 0 ? "bg-orange-500" : "bg-green-500",
      href: "/tasks",
      sub: overdueTasks > 0 ? `${overdueTasks} overdue` : undefined,
    },
    {
      label: "Unread Messages",
      value: unread,
      icon: MessageSquare,
      color: "bg-purple-500",
      href: "/messages",
    },
  ];

  return (
    <div>
      <TopBar title="Dashboard" />
      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {kpis.map((kpi) => (
            <Link key={kpi.label} href={kpi.href} className="group">
              <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-9 h-9 ${kpi.color} rounded-lg flex items-center justify-center`}>
                    <kpi.icon className="w-5 h-5 text-white" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{kpi.label}</p>
                {kpi.sub && (
                  <p className="text-xs text-orange-500 font-medium mt-1">{kpi.sub}</p>
                )}
              </div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* High Risk Patients */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-red-500" />
                <h3 className="text-sm font-semibold text-gray-900">High-Risk Patients</h3>
              </div>
              <Link href="/patients?risk=HIGH" className="text-xs text-blue-600 hover:underline">View all</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {recentPatients.length === 0 ? (
                <p className="px-5 py-8 text-sm text-gray-400 text-center">No high-risk patients</p>
              ) : (
                recentPatients.map((p) => (
                  <Link key={p.id} href={`/patients/${p.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-gray-600">
                        {p.firstName[0]}{p.lastName[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{p.firstName} {p.lastName}</p>
                      <p className="text-xs text-gray-500">Score: {p.riskScore}</p>
                    </div>
                    <RiskBadge level={p.riskLevel} />
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Upcoming Appointments */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-semibold text-gray-900">Upcoming Appointments</h3>
              </div>
              <Link href="/appointments" className="text-xs text-blue-600 hover:underline">View all</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {upcomingAppts.length === 0 ? (
                <p className="px-5 py-8 text-sm text-gray-400 text-center">No upcoming appointments</p>
              ) : (
                upcomingAppts.map((a) => (
                  <div key={a.id} className="px-5 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{a.patient.firstName} {a.patient.lastName}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{a.title}</p>
                      </div>
                      <RiskBadge level={a.patient.riskLevel} />
                    </div>
                    <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      {formatDatetime(a.startTime)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* My Tasks */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-green-500" />
                <h3 className="text-sm font-semibold text-gray-900">My Tasks</h3>
              </div>
              <Link href="/tasks" className="text-xs text-blue-600 hover:underline">View all</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {myTasks.length === 0 ? (
                <p className="px-5 py-8 text-sm text-gray-400 text-center">No pending tasks</p>
              ) : (
                myTasks.map((t) => (
                  <div key={t.id} className="px-5 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate flex-1">{t.title}</p>
                      <StatusBadge status={t.status} />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      {t.patient && (
                        <p className="text-xs text-gray-500">{t.patient.firstName} {t.patient.lastName}</p>
                      )}
                      <PriorityBadge priority={t.priority} />
                    </div>
                    {t.dueDate && (
                      <p className="text-xs text-gray-400 mt-1">Due: {formatDate(t.dueDate)}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
