import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      primaryProvider: { select: { id: true, name: true, specialty: true } },
      carePlans: {
        include: {
          creator: { select: { id: true, name: true } },
          tasks: { include: { assignee: { select: { id: true, name: true } } } },
          interventions: true,
        },
        orderBy: { createdAt: "desc" },
      },
      appointments: {
        include: { provider: { select: { id: true, name: true } } },
        orderBy: { startTime: "desc" },
        take: 10,
      },
      tasks: {
        include: {
          assignee: { select: { id: true, name: true } },
          creator: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      vitals: { orderBy: { recordedAt: "desc" }, take: 10 },
    },
  });

  if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  return NextResponse.json({ data: patient });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const patient = await prisma.patient.update({
    where: { id },
    data: body,
  });

  return NextResponse.json({ data: patient });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.patient.update({ where: { id }, data: { isActive: false } });
  return new NextResponse(null, { status: 204 });
}
