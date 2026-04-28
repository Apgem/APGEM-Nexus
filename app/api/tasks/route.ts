import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const TaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  dueDate: z.string().optional(),
  patientId: z.string().optional(),
  assigneeId: z.string().optional(),
  carePlanId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const mine = searchParams.get("mine") === "true";
  const patientId = searchParams.get("patientId");
  const status = searchParams.get("status");

  const now = new Date();

  // Mark overdue tasks
  await prisma.task.updateMany({
    where: {
      status: { in: ["PENDING", "IN_PROGRESS"] },
      dueDate: { lt: now },
    },
    data: { status: "OVERDUE" },
  });

  const where = {
    ...(mine ? { assigneeId: session.user.id } : {}),
    ...(patientId ? { patientId } : {}),
    ...(status ? { status } : {}),
  };

  const tasks = await prisma.task.findMany({
    where,
    include: {
      patient: { select: { id: true, firstName: true, lastName: true } },
      assignee: { select: { id: true, name: true } },
      creator: { select: { id: true, name: true } },
    },
    orderBy: [
      { status: "asc" },
      { dueDate: "asc" },
      { createdAt: "desc" },
    ],
  });

  return NextResponse.json({ data: tasks });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = TaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.issues }, { status: 400 });
  }

  const task = await prisma.task.create({
    data: {
      ...parsed.data,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      creatorId: session.user.id,
    },
    include: {
      patient: { select: { id: true, firstName: true, lastName: true } },
      assignee: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ data: task }, { status: 201 });
}
