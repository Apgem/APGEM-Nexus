import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const updateData: Record<string, unknown> = { ...body };
  if (body.startTime) updateData.startTime = new Date(body.startTime);
  if (body.endTime) updateData.endTime = new Date(body.endTime);

  const appt = await prisma.appointment.update({
    where: { id },
    data: updateData,
    include: {
      patient: { select: { id: true, firstName: true, lastName: true } },
      provider: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ data: appt });
}
