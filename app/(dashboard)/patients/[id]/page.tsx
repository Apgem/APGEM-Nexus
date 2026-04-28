import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";
import { RiskBadge, StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { formatDate, formatDatetime, getAge } from "@/lib/utils";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Heart,
  AlertCircle,
  Pill,
  CalendarDays,
  CheckSquare,
  ClipboardList,
  Activity,
} from "lucide-react";

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      primaryProvider: { select: { id: true, name: true, specialty: true } },
      carePlans: {
        include: {
          creator: { select: { id: true, name: true } },
          tasks: {
            include: { assignee: { select: { id: true, name: true } } },
          },
          interventions: true,
        },
        orderBy: { createdAt: "desc" },
      },
      appointments: {
        include: { provider: { select: { id: true, name: true } } },
        orderBy: { startTime: "desc" },
        take: 8,
      },
      tasks: {
        include: {
          assignee: { select: { id: true, name: true } },
          creator: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      vitals: { orderBy: { recordedAt: "desc" }, take: 5 },
    },
  });

  if (!patient) notFound();

  const allergies = patient.allergies ? JSON.parse(patient.allergies) : [];
  const conditions = patient.conditions ? JSON.parse(patient.conditions) : [];
  const medications = patient.medications ? JSON.parse(patient.medications) : [];

  const activePlan = patient.carePlans.find((p) => p.status === "ACTIVE");
  const tasksDone = patient.tasks.filter((t) => t.status === "COMPLETED").length;
  const completionRate = patient.tasks.length > 0
    ? Math.round((tasksDone / patient.tasks.length) * 100)
    : 0;

  return (
    <div>
      <TopBar />
      <div className="p-6">
        {/* Back + header */}
        <div className="mb-6">
          <Link href="/patients" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 w-fit">
            <ArrowLeft className="w-4 h-4" /> Back to Patients
          </Link>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
                <span className="text-xl font-bold text-blue-600">{patient.firstName[0]}{patient.lastName[0]}</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{patient.firstName} {patient.lastName}</h1>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="text-sm text-gray-500 font-mono">MRN: {patient.mrn}</span>
                  <span className="text-sm text-gray-500">{getAge(patient.dateOfBirth)}y • {patient.gender}</span>
                  <RiskBadge level={patient.riskLevel} />
                  <span className="text-xs text-gray-400">Risk Score: {patient.riskScore}/100</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/appointments/new?patientId=${patient.id}`}
                className="px-3 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <CalendarDays className="w-4 h-4" /> Schedule
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left col */}
          <div className="space-y-4">
            {/* Contact */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Contact Information</h3>
              {patient.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400" /> {patient.phone}
                </div>
              )}
              {patient.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400" /> {patient.email}
                </div>
              )}
              {patient.address && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400" /> {patient.address}
                </div>
              )}
              {patient.emergencyContact && (
                <div className="text-sm">
                  <span className="text-gray-400 text-xs">Emergency:</span>
                  <span className="text-gray-600 ml-1">{patient.emergencyContact}</span>
                </div>
              )}
            </div>

            {/* Clinical */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Clinical Details</h3>
              {patient.bloodType && (
                <div className="flex items-center gap-2 text-sm">
                  <Heart className="w-4 h-4 text-red-400" />
                  <span className="text-gray-500">Blood Type:</span>
                  <span className="font-medium">{patient.bloodType}</span>
                </div>
              )}
              {patient.insuranceProvider && (
                <div className="text-sm">
                  <span className="text-gray-400 text-xs block">Insurance</span>
                  <span className="text-gray-700">{patient.insuranceProvider}</span>
                  {patient.insuranceId && <span className="text-gray-400 text-xs ml-2">#{patient.insuranceId}</span>}
                </div>
              )}
              {patient.primaryProvider && (
                <div className="text-sm">
                  <span className="text-gray-400 text-xs block">Primary Provider</span>
                  <span className="text-gray-700">{patient.primaryProvider.name}</span>
                  {patient.primaryProvider.specialty && (
                    <span className="text-gray-400 text-xs ml-1">({patient.primaryProvider.specialty})</span>
                  )}
                </div>
              )}
              {patient.admissionDate && (
                <div className="text-sm">
                  <span className="text-gray-400 text-xs block">Last Admission</span>
                  <span className="text-gray-700">{formatDate(patient.admissionDate)}</span>
                </div>
              )}
            </div>

            {/* Allergies */}
            {allergies.length > 0 && (
              <div className="bg-white rounded-xl border border-red-100 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <h3 className="text-sm font-semibold text-red-700">Allergies</h3>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {allergies.map((a: string) => (
                    <span key={a} className="px-2 py-0.5 bg-red-50 text-red-700 text-xs rounded-full border border-red-100">{a}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Conditions */}
            {conditions.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Conditions</h3>
                <div className="flex flex-wrap gap-1.5">
                  {conditions.map((c: string) => (
                    <span key={c} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-100">{c}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Medications */}
            {medications.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Pill className="w-4 h-4 text-purple-500" />
                  <h3 className="text-sm font-semibold text-gray-900">Medications</h3>
                </div>
                <ul className="space-y-1">
                  {medications.map((m: string) => (
                    <li key={m} className="text-sm text-gray-600 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Latest Vitals */}
            {patient.vitals.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-4 h-4 text-green-500" />
                  <h3 className="text-sm font-semibold text-gray-900">Latest Vitals</h3>
                  <span className="text-xs text-gray-400">{formatDate(patient.vitals[0].recordedAt)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {patient.vitals[0].systolic && (
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-xs text-gray-400">Blood Pressure</p>
                      <p className="text-sm font-semibold">{patient.vitals[0].systolic}/{patient.vitals[0].diastolic}</p>
                    </div>
                  )}
                  {patient.vitals[0].heartRate && (
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-xs text-gray-400">Heart Rate</p>
                      <p className="text-sm font-semibold">{patient.vitals[0].heartRate} bpm</p>
                    </div>
                  )}
                  {patient.vitals[0].oxygenSaturation && (
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-xs text-gray-400">O2 Sat</p>
                      <p className="text-sm font-semibold">{patient.vitals[0].oxygenSaturation}%</p>
                    </div>
                  )}
                  {patient.vitals[0].weight && (
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-xs text-gray-400">Weight</p>
                      <p className="text-sm font-semibold">{patient.vitals[0].weight} kg</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right col */}
          <div className="lg:col-span-2 space-y-4">
            {/* Progress */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Care Progress</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{patient.tasks.length}</p>
                  <p className="text-xs text-gray-500 mt-1">Total Tasks</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{tasksDone}</p>
                  <p className="text-xs text-gray-500 mt-1">Completed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{completionRate}%</p>
                  <p className="text-xs text-gray-500 mt-1">Completion Rate</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-2 bg-blue-500 rounded-full transition-all"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Active Care Plan */}
            {activePlan && (
              <div className="bg-white rounded-xl border border-gray-200">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-blue-500" />
                    <h3 className="text-sm font-semibold text-gray-900">Active Care Plan</h3>
                    <StatusBadge status={activePlan.status} type="care" />
                  </div>
                </div>
                <div className="p-5">
                  <h4 className="font-medium text-gray-900 mb-1">{activePlan.title}</h4>
                  {activePlan.description && (
                    <p className="text-sm text-gray-500 mb-3">{activePlan.description}</p>
                  )}
                  {activePlan.goals && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Goals</p>
                      <p className="text-sm text-gray-700">{activePlan.goals}</p>
                    </div>
                  )}
                  {activePlan.tasks.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Tasks</p>
                      <div className="space-y-2">
                        {activePlan.tasks.slice(0, 5).map((t) => (
                          <div key={t.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                            <StatusBadge status={t.status} />
                            <span className="text-sm text-gray-700 flex-1">{t.title}</span>
                            {t.assignee && <span className="text-xs text-gray-400">{t.assignee.name}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Appointments */}
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-sm font-semibold text-gray-900">Appointments</h3>
                </div>
                <Link href={`/appointments/new?patientId=${patient.id}`} className="text-xs text-blue-600 hover:underline">
                  + Schedule
                </Link>
              </div>
              <div className="divide-y divide-gray-50">
                {patient.appointments.length === 0 ? (
                  <p className="px-5 py-6 text-sm text-gray-400 text-center">No appointments</p>
                ) : (
                  patient.appointments.slice(0, 5).map((a) => (
                    <div key={a.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{a.title}</p>
                        <p className="text-xs text-gray-500">{a.provider.name} • {formatDatetime(a.startTime)}</p>
                      </div>
                      <StatusBadge status={a.status} type="appt" />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Notes */}
            {patient.notes && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Clinical Notes</h3>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{patient.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
