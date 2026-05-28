import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding MediNexus...");

  // ── Users ──────────────────────────────────────────────────────────────────
  const hash = async (pw: string) => bcrypt.hash(pw, 10);

  const admin = await upsertUser("admin@medinexus.com", "System Admin", await hash("Admin@123"), "ADMIN");
  const drChen = await upsertUser("dr.chen@medinexus.com", "Dr. Sarah Chen", await hash("Doctor@123"), "DOCTOR", "Cardiology");
  const drPatel = await upsertUser("dr.patel@medinexus.com", "Dr. Raj Patel", await hash("Doctor@123"), "DOCTOR", "Internal Medicine");
  const nurseKim = await upsertUser("nurse.kim@medinexus.com", "Kim Thompson, RN", await hash("Nurse@123"), "NURSE");
  const nurseJones = await upsertUser("nurse.jones@medinexus.com", "Alex Jones, RN", await hash("Nurse@123"), "NURSE");

  console.log("✓ Users created");

  // ── Patients ───────────────────────────────────────────────────────────────
  const patients = [
    {
      mrn: "MRN-2024-001",
      firstName: "Sarah",
      lastName: "Mitchell",
      dateOfBirth: new Date("1952-03-12"),
      gender: "Female",
      phone: "555-0101",
      email: "sarah.m@example.com",
      address: "142 Oak Street, Springfield, IL 62701",
      emergencyContact: "John Mitchell (husband) 555-0102",
      bloodType: "A+",
      riskLevel: "CRITICAL",
      riskScore: 87,
      conditions: JSON.stringify(["Congestive Heart Failure", "Type 2 Diabetes", "Hypertension"]),
      allergies: JSON.stringify(["Penicillin", "Aspirin"]),
      medications: JSON.stringify(["Metformin 500mg", "Lisinopril 10mg", "Furosemide 40mg", "Carvedilol 6.25mg"]),
      insuranceProvider: "BlueCross BlueShield",
      insuranceId: "BCB-88441",
      primaryProviderId: drChen.id,
      admissionDate: new Date(Date.now() - 18 * 86400000),
      notes: "3 readmissions in last 90 days. Needs close monitoring for fluid retention. Caregiver education completed.",
    },
    {
      mrn: "MRN-2024-002",
      firstName: "Robert",
      lastName: "Kaufman",
      dateOfBirth: new Date("1959-07-22"),
      gender: "Male",
      phone: "555-0201",
      email: "r.kaufman@example.com",
      address: "78 Maple Ave, Lincoln, NE 68501",
      emergencyContact: "Lisa Kaufman (spouse) 555-0202",
      bloodType: "O-",
      riskLevel: "HIGH",
      riskScore: 68,
      conditions: JSON.stringify(["COPD", "Hypertension", "Sleep Apnea"]),
      allergies: JSON.stringify(["Sulfa drugs"]),
      medications: JSON.stringify(["Tiotropium inhaler", "Albuterol PRN", "Amlodipine 5mg"]),
      insuranceProvider: "Aetna",
      insuranceId: "AET-55220",
      primaryProviderId: drPatel.id,
      admissionDate: new Date(Date.now() - 5 * 86400000),
      notes: "Discharged 5 days ago after COPD exacerbation. Follow-up spirometry needed.",
    },
    {
      mrn: "MRN-2024-003",
      firstName: "Maria",
      lastName: "Lopez",
      dateOfBirth: new Date("1966-11-05"),
      gender: "Female",
      phone: "555-0301",
      email: "m.lopez@example.com",
      address: "22 Pine Road, Denver, CO 80201",
      bloodType: "B+",
      riskLevel: "MEDIUM",
      riskScore: 42,
      conditions: JSON.stringify(["Post-knee replacement recovery", "Obesity", "Pre-diabetes"]),
      allergies: JSON.stringify(["Latex"]),
      medications: JSON.stringify(["Ibuprofen 400mg", "Aspirin 81mg", "Vitamin D3"]),
      insuranceProvider: "United Health",
      insuranceId: "UH-77332",
      primaryProviderId: drPatel.id,
      notes: "4 weeks post right knee replacement. PT 3x/week. Good progress reported.",
    },
    {
      mrn: "MRN-2024-004",
      firstName: "James",
      lastName: "Turner",
      dateOfBirth: new Date("1979-04-15"),
      gender: "Male",
      phone: "555-0401",
      riskLevel: "LOW",
      riskScore: 15,
      conditions: JSON.stringify(["Hypertension", "High cholesterol"]),
      allergies: JSON.stringify([]),
      medications: JSON.stringify(["Atorvastatin 20mg", "Losartan 50mg"]),
      insuranceProvider: "Cigna",
      insuranceId: "CIG-44112",
      primaryProviderId: drPatel.id,
      notes: "Annual wellness check scheduled. BP well-controlled on current regimen.",
    },
    {
      mrn: "MRN-2024-005",
      firstName: "Ellen",
      lastName: "Baker",
      dateOfBirth: new Date("1944-09-30"),
      gender: "Female",
      phone: "555-0501",
      emergencyContact: "Tom Baker (son) 555-0502",
      bloodType: "AB+",
      riskLevel: "HIGH",
      riskScore: 74,
      conditions: JSON.stringify(["Moderate Dementia", "Hip fracture recovery", "Atrial Fibrillation"]),
      allergies: JSON.stringify(["Warfarin — bleeding risk", "NSAIDs"]),
      medications: JSON.stringify(["Donepezil 10mg", "Rivaroxaban 20mg", "Calcium+Vit D"]),
      insuranceProvider: "Medicare",
      insuranceId: "MCR-99887",
      primaryProviderId: drChen.id,
      admissionDate: new Date(Date.now() - 30 * 86400000),
      notes: "High fall risk. Family involved in care. Needs fall-prevention care plan. Memory care referral pending.",
    },
  ];

  const createdPatients: Awaited<ReturnType<typeof prisma.patient.create>>[] = [];
  for (const p of patients) {
    const existing = await prisma.patient.findUnique({ where: { mrn: p.mrn } });
    if (existing) {
      createdPatients.push(existing);
    } else {
      createdPatients.push(await prisma.patient.create({ data: p }));
    }
  }

  console.log("✓ Patients created");

  // ── Care Plans ─────────────────────────────────────────────────────────────
  const [sarah, robert, maria, james, ellen] = createdPatients;

  const sarahPlan = await ensureCarePlan(sarah.id, drChen.id, {
    title: "CHF Management & Readmission Prevention",
    description: "Comprehensive plan to manage CHF, reduce fluid retention, and prevent readmission.",
    goals: "Reduce readmissions by 80% over 90 days. Achieve stable weight, controlled BP, and patient self-management skills.",
    status: "ACTIVE",
  });

  const ellenPlan = await ensureCarePlan(ellen.id, drChen.id, {
    title: "Fall Prevention & Memory Care",
    description: "Multidisciplinary plan to prevent falls and support cognitive function.",
    goals: "Zero falls over 60 days. Caregiver confidence score > 8/10. Complete memory care referral.",
    status: "ACTIVE",
  });

  const mariaPlan = await ensureCarePlan(maria.id, drPatel.id, {
    title: "Post-Knee Replacement Rehabilitation",
    description: "Physical therapy and monitoring for optimal knee replacement recovery.",
    goals: "Full ROM by week 8. Pain score < 3/10 consistently. Return to normal daily activities.",
    status: "ACTIVE",
  });

  console.log("✓ Care plans created");

  // ── Tasks ──────────────────────────────────────────────────────────────────
  const tasksToCreate = [
    // Sarah's tasks
    { title: "Daily weight monitoring — alert if +2 lbs in 24h", patientId: sarah.id, assigneeId: nurseKim.id, creatorId: drChen.id, priority: "HIGH", status: "IN_PROGRESS", carePlanId: sarahPlan.id, dueDate: daysFromNow(1) },
    { title: "Educate patient on fluid restriction (1.5L/day)", patientId: sarah.id, assigneeId: nurseKim.id, creatorId: drChen.id, priority: "HIGH", status: "COMPLETED", carePlanId: sarahPlan.id, completedAt: daysAgo(2) },
    { title: "Schedule cardiology follow-up within 7 days", patientId: sarah.id, assigneeId: nurseJones.id, creatorId: drChen.id, priority: "URGENT", status: "PENDING", carePlanId: sarahPlan.id, dueDate: daysFromNow(3) },
    { title: "Review and reconcile medications with pharmacy", patientId: sarah.id, assigneeId: drChen.id, creatorId: admin.id, priority: "HIGH", status: "PENDING", dueDate: daysFromNow(2) },
    { title: "Assess for depression screening (PHQ-9)", patientId: sarah.id, assigneeId: nurseKim.id, creatorId: drChen.id, priority: "MEDIUM", status: "OVERDUE", dueDate: daysAgo(1) },

    // Robert's tasks
    { title: "Post-discharge 48h phone check-in", patientId: robert.id, assigneeId: nurseJones.id, creatorId: drPatel.id, priority: "HIGH", status: "COMPLETED", completedAt: daysAgo(3) },
    { title: "Order pulmonary function test (spirometry)", patientId: robert.id, assigneeId: drPatel.id, creatorId: drPatel.id, priority: "MEDIUM", status: "PENDING", dueDate: daysFromNow(5) },
    { title: "Inhaler technique education — confirm proper use", patientId: robert.id, assigneeId: nurseKim.id, creatorId: drPatel.id, priority: "MEDIUM", status: "PENDING", dueDate: daysFromNow(7) },

    // Ellen's tasks
    { title: "Home safety assessment — remove fall hazards", patientId: ellen.id, assigneeId: nurseJones.id, creatorId: drChen.id, priority: "HIGH", status: "IN_PROGRESS", carePlanId: ellenPlan.id, dueDate: daysFromNow(2) },
    { title: "Coordinate memory care specialist referral", patientId: ellen.id, assigneeId: nurseKim.id, creatorId: drChen.id, priority: "HIGH", status: "PENDING", carePlanId: ellenPlan.id, dueDate: daysFromNow(5) },
    { title: "Family caregiver training session", patientId: ellen.id, assigneeId: nurseJones.id, creatorId: drChen.id, priority: "MEDIUM", status: "PENDING", carePlanId: ellenPlan.id, dueDate: daysFromNow(10) },

    // Maria's tasks
    { title: "Week 4 PT progress assessment", patientId: maria.id, assigneeId: nurseKim.id, creatorId: drPatel.id, priority: "MEDIUM", status: "COMPLETED", carePlanId: mariaPlan.id, completedAt: daysAgo(1) },
    { title: "Pain management review (goal: <3/10)", patientId: maria.id, assigneeId: drPatel.id, creatorId: drPatel.id, priority: "MEDIUM", status: "PENDING", carePlanId: mariaPlan.id, dueDate: daysFromNow(3) },
  ];

  for (const task of tasksToCreate) {
    const existing = await prisma.task.findFirst({ where: { title: task.title, patientId: task.patientId } });
    if (!existing) {
      await prisma.task.create({ data: task });
    }
  }

  console.log("✓ Tasks created");

  // ── Appointments ───────────────────────────────────────────────────────────
  const appts = [
    { title: "CHF Follow-up", patientId: sarah.id, providerId: drChen.id, startTime: daysFromNow(2, 9), endTime: daysFromNow(2, 9.5), type: "Follow-up", status: "SCHEDULED", location: "Cardiology Clinic, Room 4A" },
    { title: "Weight & BP Check", patientId: sarah.id, providerId: nurseKim.id, startTime: daysFromNow(1, 8), endTime: daysFromNow(1, 8.25), type: "Nurse Visit", status: "CONFIRMED", location: "Nursing Station" },
    { title: "COPD Management Review", patientId: robert.id, providerId: drPatel.id, startTime: daysFromNow(4, 10), endTime: daysFromNow(4, 10.5), type: "Follow-up", status: "SCHEDULED", location: "Room 201" },
    { title: "Telehealth: Medication Check", patientId: robert.id, providerId: drPatel.id, startTime: daysFromNow(7, 14), endTime: daysFromNow(7, 14.5), type: "Telehealth", status: "SCHEDULED" },
    { title: "PT Progress Review", patientId: maria.id, providerId: drPatel.id, startTime: daysFromNow(3, 11), endTime: daysFromNow(3, 11.5), type: "Follow-up", status: "CONFIRMED", location: "Rehab Center" },
    { title: "Annual Wellness Visit", patientId: james.id, providerId: drPatel.id, startTime: daysFromNow(14, 9), endTime: daysFromNow(14, 10), type: "Initial Visit", status: "SCHEDULED", location: "Room 103" },
    { title: "Memory Care Consultation", patientId: ellen.id, providerId: drChen.id, startTime: daysFromNow(6, 13), endTime: daysFromNow(6, 14), type: "Specialist Consult", status: "SCHEDULED", location: "Neurology Dept." },
    // Past
    { title: "Initial Assessment", patientId: sarah.id, providerId: drChen.id, startTime: daysAgo(20, 10), endTime: daysAgo(20, 11), type: "Initial Visit", status: "COMPLETED" },
    { title: "Post-discharge follow-up", patientId: robert.id, providerId: drPatel.id, startTime: daysAgo(3, 9), endTime: daysAgo(3, 9.5), type: "Follow-up", status: "COMPLETED" },
    { title: "Medication review", patientId: ellen.id, providerId: drChen.id, startTime: daysAgo(10, 14), endTime: daysAgo(10, 14.5), type: "Follow-up", status: "NO_SHOW" },
  ];

  for (const appt of appts) {
    const existing = await prisma.appointment.findFirst({ where: { title: appt.title, patientId: appt.patientId } });
    if (!existing) {
      await prisma.appointment.create({ data: appt });
    }
  }

  console.log("✓ Appointments created");

  // ── Vitals ─────────────────────────────────────────────────────────────────
  const vitalData = [
    // Sarah — CHF, monitoring closely
    { patientId: sarah.id, systolic: 152, diastolic: 94, heartRate: 88, oxygenSaturation: 95, weight: 72.3, recordedAt: daysAgo(0) },
    { patientId: sarah.id, systolic: 148, diastolic: 91, heartRate: 92, oxygenSaturation: 94, weight: 74.1, recordedAt: daysAgo(3) },
    { patientId: sarah.id, systolic: 155, diastolic: 98, heartRate: 96, oxygenSaturation: 93, weight: 75.8, recordedAt: daysAgo(7) },
    { patientId: sarah.id, systolic: 162, diastolic: 102, heartRate: 104, oxygenSaturation: 91, weight: 77.2, recordedAt: daysAgo(14) },
    // Robert — COPD
    { patientId: robert.id, systolic: 138, diastolic: 86, heartRate: 78, oxygenSaturation: 92, weight: 84.0, recordedAt: daysAgo(1) },
    { patientId: robert.id, systolic: 142, diastolic: 89, heartRate: 82, oxygenSaturation: 90, weight: 84.5, recordedAt: daysAgo(5) },
    // Ellen
    { patientId: ellen.id, systolic: 128, diastolic: 79, heartRate: 72, oxygenSaturation: 97, weight: 58.2, recordedAt: daysAgo(2) },
  ];

  for (const v of vitalData) {
    await prisma.vital.create({ data: v });
  }

  console.log("✓ Vitals created");

  // ── Messages ───────────────────────────────────────────────────────────────
  const messages = [
    {
      subject: "URGENT: Sarah Mitchell — Fluid Overload Concern",
      body: "Dr. Chen, Sarah's weight is up 3.8 lbs since yesterday. She's reporting ankle swelling and mild SOB. Should we adjust her Furosemide dose or have her come in today? Her O2 sat was 93% this morning.",
      senderId: nurseKim.id,
      receiverId: drChen.id,
      isUrgent: true,
    },
    {
      subject: "Robert Kaufman — Spirometry Results Ready",
      body: "Dr. Patel, Robert's pulmonary function test results are in. FEV1/FVC ratio is 0.62, indicating moderate obstruction. I've attached the full report. Would you like to schedule a care plan review?",
      senderId: nurseJones.id,
      receiverId: drPatel.id,
      isUrgent: false,
    },
    {
      subject: "Ellen Baker — Memory Care Referral Follow-up",
      body: "The memory care specialist at Northside has an opening in 2 weeks. Tom Baker (son) has confirmed he can bring her. Should I go ahead and book it? He also asked about respite care options.",
      senderId: nurseKim.id,
      receiverId: drChen.id,
      isUrgent: false,
    },
    {
      subject: "Care Team Huddle — High Risk Patient Review",
      body: "Reminder: Weekly high-risk patient huddle is tomorrow at 8am in Conference Room B. We'll be reviewing Sarah Mitchell, Ellen Baker, and Robert Kaufman's care plans. Please bring your latest notes.",
      senderId: admin.id,
      receiverId: drChen.id,
      isUrgent: false,
    },
    {
      subject: "Care Team Huddle — High Risk Patient Review",
      body: "Reminder: Weekly high-risk patient huddle is tomorrow at 8am in Conference Room B.",
      senderId: admin.id,
      receiverId: drPatel.id,
      isUrgent: false,
    },
    {
      subject: "Care Team Huddle — High Risk Patient Review",
      body: "Reminder: Weekly high-risk patient huddle is tomorrow at 8am in Conference Room B.",
      senderId: admin.id,
      receiverId: nurseKim.id,
      isUrgent: false,
    },
  ];

  for (const m of messages) {
    const existing = await prisma.message.findFirst({ where: { subject: m.subject, senderId: m.senderId } });
    if (!existing) {
      await prisma.message.create({ data: m });
    }
  }

  console.log("✓ Messages created");
  console.log("\n✅ Seed complete! Demo credentials:");
  console.log("   Admin:  admin@medinexus.com / Admin@123");
  console.log("   Doctor: dr.chen@medinexus.com / Doctor@123");
  console.log("   Nurse:  nurse.kim@medinexus.com / Nurse@123");
}

async function upsertUser(email: string, name: string, password: string, role: string, specialty?: string) {
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name, password, role, specialty },
  });
}

async function ensureCarePlan(
  patientId: string,
  creatorId: string,
  data: { title: string; description?: string; goals?: string; status: string }
) {
  const existing = await prisma.carePlan.findFirst({ where: { patientId, title: data.title } });
  if (existing) return existing;
  return prisma.carePlan.create({ data: { ...data, patientId, creatorId } });
}

function daysFromNow(days: number, hour = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(Math.floor(hour), (hour % 1) * 60, 0, 0);
  return d;
}

function daysAgo(days: number, hour = 0): Date {
  return daysFromNow(-days, hour);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
