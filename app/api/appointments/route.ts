import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ApptSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  patientId: z.string().min(1),
  providerId: z.string().min(1),
  startTime: z.string(),
  endTime: z.string(),
  type: z.string().default("Follow-up"),
  location: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get("patientId");
  const upcoming = searchParams.get("upcoming") === "true";

  const where = {
    ...(patientId ? { patientId } : {}),
    ...(upcoming
      ? { startTime: { gte: new Date() }, status: { notIn: ["CANCELLED"] } }
      : {}),
    ...(session.user.role === "PATIENT"
      ? { patient: { userId: session.user.id } }
      : session.user.role === "DOCTOR"
      ? { providerId: session.user.id }
      : {}),
  };

  const appointments = await prisma.appointment.findMany({
    where,
    include: {
      patient: { select: { id: true, firstName: true, lastName: true, riskLevel: true } },
      provider: { select: { id: true, name: true, specialty: true } },
    },
    orderBy: { startTime: "asc" },
    take: 50,
  });

  return NextResponse.json({ data: appointments });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = ApptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.issues }, { status: 400 });
  }

  const appt = await prisma.appointment.create({
    data: {
      ...parsed.data,
      startTime: new Date(parsed.data.startTime),
      endTime: new Date(parsed.data.endTime),
    },
    include: {
      patient: { select: { id: true, firstName: true, lastName: true } },
      provider: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ data: appt }, { status: 201 });
}
