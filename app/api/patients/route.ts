import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeRiskScore } from "@/lib/utils";
import { z } from "zod";

const PatientSchema = z.object({
  mrn: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string(),
  gender: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  bloodType: z.string().optional(),
  allergies: z.string().optional(),
  conditions: z.string().optional(),
  medications: z.string().optional(),
  insuranceId: z.string().optional(),
  insuranceProvider: z.string().optional(),
  notes: z.string().optional(),
  primaryProviderId: z.string().optional(),
  admissionDate: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const risk = searchParams.get("risk") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");

  const where = {
    isActive: true,
    ...(search
      ? {
          OR: [
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { mrn: { contains: search } },
            { email: { contains: search } },
          ],
        }
      : {}),
    ...(risk ? { riskLevel: risk } : {}),
  };

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      include: {
        primaryProvider: { select: { id: true, name: true } },
        _count: { select: { tasks: true, appointments: true } },
      },
      orderBy: [{ riskScore: "desc" }, { lastName: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.patient.count({ where }),
  ]);

  return NextResponse.json({ data: patients, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = PatientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.issues }, { status: 400 });
  }

  const data = parsed.data;
  const conditions = data.conditions ? JSON.parse(data.conditions) : [];
  const { score, level } = computeRiskScore({
    dateOfBirth: new Date(data.dateOfBirth),
    conditionsCount: Array.isArray(conditions) ? conditions.length : 0,
    lastDischarge: data.admissionDate ? new Date(data.admissionDate) : null,
  });

  const patient = await prisma.patient.create({
    data: {
      mrn: data.mrn,
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: new Date(data.dateOfBirth),
      gender: data.gender,
      phone: data.phone,
      email: data.email,
      address: data.address,
      emergencyContact: data.emergencyContact,
      bloodType: data.bloodType,
      allergies: data.allergies,
      conditions: data.conditions,
      medications: data.medications,
      insuranceId: data.insuranceId,
      insuranceProvider: data.insuranceProvider,
      notes: data.notes,
      primaryProviderId: data.primaryProviderId || null,
      admissionDate: data.admissionDate ? new Date(data.admissionDate) : null,
      riskScore: score,
      riskLevel: level,
    },
  });

  return NextResponse.json({ data: patient }, { status: 201 });
}
