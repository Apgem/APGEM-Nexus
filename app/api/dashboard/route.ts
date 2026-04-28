import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86400000);

  const [
    totalPatients,
    criticalPatients,
    pendingTasks,
    overdueTasks,
    todayAppointments,
    unreadMessages,
    recentPatients,
    upcomingAppointments,
    myTasks,
  ] = await Promise.all([
    prisma.patient.count({ where: { isActive: true } }),
    prisma.patient.count({ where: { isActive: true, riskLevel: "CRITICAL" } }),
    prisma.task.count({ where: { status: "PENDING" } }),
    prisma.task.count({ where: { status: "OVERDUE" } }),
    prisma.appointment.count({
      where: {
        startTime: { gte: todayStart, lt: todayEnd },
        status: { in: ["SCHEDULED", "CONFIRMED"] },
      },
    }),
    prisma.message.count({
      where: { receiverId: session.user.id, readAt: null },
    }),
    prisma.patient.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        riskLevel: true,
        riskScore: true,
        createdAt: true,
      },
    }),
    prisma.appointment.findMany({
      where: {
        startTime: { gte: now },
        status: { in: ["SCHEDULED", "CONFIRMED"] },
        ...(session.user.role === "DOCTOR" ? { providerId: session.user.id } : {}),
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, riskLevel: true } },
        provider: { select: { id: true, name: true } },
      },
      orderBy: { startTime: "asc" },
      take: 5,
    }),
    prisma.task.findMany({
      where: {
        assigneeId: session.user.id,
        status: { in: ["PENDING", "IN_PROGRESS", "OVERDUE"] },
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
      take: 5,
    }),
  ]);

  return NextResponse.json({
    data: {
      stats: {
        totalPatients,
        criticalPatients,
        pendingTasks,
        overdueTasks,
        todayAppointments,
        unreadMessages,
      },
      recentPatients,
      upcomingAppointments,
      myTasks,
    },
  });
}
