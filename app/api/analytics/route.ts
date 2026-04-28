import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subDays, startOfWeek, format } from "date-fns";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);
  const sixtyDaysAgo = subDays(now, 60);

  const [
    riskGroups,
    totalPatients,
    taskStats,
    apptStats,
    recentTasks,
    upcomingAppts,
    criticalPatients,
  ] = await Promise.all([
    // Risk distribution
    prisma.patient.groupBy({
      by: ["riskLevel"],
      _count: { id: true },
      where: { isActive: true },
    }),

    // Total active patients
    prisma.patient.count({ where: { isActive: true } }),

    // Task completion stats (last 30 days)
    prisma.task.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { status: true, createdAt: true, completedAt: true },
    }),

    // Appointment stats (last 30 days)
    prisma.appointment.findMany({
      where: { startTime: { gte: thirtyDaysAgo } },
      select: { status: true, startTime: true },
    }),

    // Recent task summary
    prisma.task.groupBy({
      by: ["status"],
      _count: { id: true },
    }),

    // Upcoming appointments
    prisma.appointment.count({
      where: {
        startTime: { gte: now },
        status: { in: ["SCHEDULED", "CONFIRMED"] },
      },
    }),

    // Critical + high risk
    prisma.patient.findMany({
      where: { riskLevel: { in: ["CRITICAL", "HIGH"] }, isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        riskLevel: true,
        riskScore: true,
        conditions: true,
      },
      orderBy: { riskScore: "desc" },
      take: 10,
    }),
  ]);

  // Weekly task completion rate (last 8 weeks)
  const weeklyAdherence = [];
  for (let i = 7; i >= 0; i--) {
    const weekStart = startOfWeek(subDays(now, i * 7));
    const weekEnd = startOfWeek(subDays(now, (i - 1) * 7));
    const weekTasks = taskStats.filter(
      (t) => new Date(t.createdAt) >= weekStart && new Date(t.createdAt) < weekEnd
    );
    const completed = weekTasks.filter((t) => t.status === "COMPLETED").length;
    const total = weekTasks.length;
    weeklyAdherence.push({
      week: format(weekStart, "MMM d"),
      rate: total > 0 ? Math.round((completed / total) * 100) : 0,
      completed,
      total,
    });
  }

  // No-show rate by month (last 3 months)
  const monthlyNoShow = [];
  for (let i = 2; i >= 0; i--) {
    const monthStart = subDays(now, (i + 1) * 30);
    const monthEnd = subDays(now, i * 30);
    const monthAppts = apptStats.filter(
      (a) => new Date(a.startTime) >= monthStart && new Date(a.startTime) < monthEnd
    );
    const noShows = monthAppts.filter((a) => a.status === "NO_SHOW").length;
    const total = monthAppts.length;
    monthlyNoShow.push({
      month: format(monthStart, "MMM"),
      rate: total > 0 ? Math.round((noShows / total) * 100) : 0,
      noShows,
      total,
    });
  }

  const riskDistribution = riskGroups.map((g) => ({
    name: g.riskLevel,
    value: g._count.id,
  }));

  const taskStatusSummary = recentTasks.reduce((acc, g) => {
    acc[g.status] = g._count.id;
    return acc;
  }, {} as Record<string, number>);

  return NextResponse.json({
    data: {
      totalPatients,
      riskDistribution,
      weeklyAdherence,
      monthlyNoShow,
      taskStatusSummary,
      upcomingAppts,
      criticalPatients,
    },
  });
}
