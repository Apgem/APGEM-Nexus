import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CarePlanSchema = z.object({
  patientId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  goals: z.string().optional(),
  endDate: z.string().optional(),
  tasks: z.array(z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
    dueDate: z.string().optional(),
    assigneeId: z.string().optional(),
  })).default([]),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get("patientId");

  const carePlans = await prisma.carePlan.findMany({
    where: {
      ...(patientId ? { patientId } : {}),
    },
    include: {
      creator: { select: { id: true, name: true } },
      tasks: {
        include: { assignee: { select: { id: true, name: true } } },
      },
      interventions: true,
      patient: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: carePlans });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = CarePlanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.issues }, { status: 400 });
  }

  const { tasks, ...planData } = parsed.data;

  const carePlan = await prisma.$transaction(async (tx) => {
    const plan = await tx.carePlan.create({
      data: {
        ...planData,
        endDate: planData.endDate ? new Date(planData.endDate) : null,
        creatorId: session.user.id,
      },
    });

    if (tasks.length > 0) {
      await tx.task.createMany({
        data: tasks.map((t) => ({
          title: t.title,
          description: t.description,
          priority: t.priority,
          dueDate: t.dueDate ? new Date(t.dueDate) : null,
          assigneeId: t.assigneeId || null,
          carePlanId: plan.id,
          patientId: planData.patientId,
          creatorId: session.user.id,
        })),
      });
    }

    return tx.carePlan.findUnique({
      where: { id: plan.id },
      include: {
        creator: { select: { id: true, name: true } },
        tasks: { include: { assignee: { select: { id: true, name: true } } } },
      },
    });
  });

  return NextResponse.json({ data: carePlan }, { status: 201 });
}
