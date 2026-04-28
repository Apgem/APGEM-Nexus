import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const updateData: Record<string, unknown> = { ...body };
  if (body.status === "COMPLETED") {
    updateData.completedAt = new Date();
  }
  if (body.dueDate) {
    updateData.dueDate = new Date(body.dueDate);
  }

  const task = await prisma.task.update({
    where: { id },
    data: updateData,
    include: {
      patient: { select: { id: true, firstName: true, lastName: true } },
      assignee: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ data: task });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.task.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
