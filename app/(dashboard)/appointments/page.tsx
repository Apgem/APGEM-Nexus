import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";
import { RiskBadge, StatusBadge } from "@/components/ui/Badge";
import { formatDatetime } from "@/lib/utils";
import { CalendarPlus, Clock, MapPin } from "lucide-react";
import { AppointmentActions } from "@/components/appointments/AppointmentActions";

async function getAppointments(userId: string, role: string) {
  return prisma.appointment.findMany({
    where: {
      ...(role === "DOCTOR" ? { providerId: userId } : {}),
    },
    include: {
      patient: { select: { id: true, firstName: true, lastName: true, riskLevel: true } },
      provider: { select: { id: true, name: true } },
    },
    orderBy: { startTime: "asc" },
    take: 50,
  });
}

export default async function AppointmentsPage() {
  const session = await auth();
  const appts = await getAppointments(session!.user.id, session!.user.role);

  const upcoming = appts.filter((a) => new Date(a.startTime) >= new Date() && a.status !== "CANCELLED");
  const past = appts.filter((a) => new Date(a.startTime) < new Date() || a.status === "COMPLETED");

  return (
    <div>
      <TopBar title="Appointments" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">{upcoming.length} upcoming</p>
          <Link
            href="/appointments/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <CalendarPlus className="w-4 h-4" />
            Schedule Appointment
          </Link>
        </div>

        {/* Upcoming */}
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Upcoming</h3>
        <div className="space-y-3 mb-8">
          {upcoming.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
              No upcoming appointments
            </div>
          ) : (
            upcoming.map((a) => (
              <div key={a.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-4">
                <div className="w-14 text-center bg-blue-50 rounded-lg p-2 flex-shrink-0">
                  <p className="text-xs text-blue-500 font-medium">{new Date(a.startTime).toLocaleDateString("en", { month: "short" })}</p>
                  <p className="text-xl font-bold text-blue-700 leading-tight">{new Date(a.startTime).getDate()}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <p className="font-medium text-gray-900">{a.title}</p>
                      <Link href={`/patients/${a.patient.id}`} className="text-sm text-blue-600 hover:underline">
                        {a.patient.firstName} {a.patient.lastName}
                      </Link>
                    </div>
                    <div className="flex items-center gap-2">
                      <RiskBadge level={a.patient.riskLevel} />
                      <StatusBadge status={a.status} type="appt" />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDatetime(a.startTime)}</span>
                    {a.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{a.location}</span>}
                    <span>{a.type}</span>
                    <span>Dr. {a.provider.name}</span>
                  </div>
                </div>
                <AppointmentActions id={a.id} status={a.status} />
              </div>
            ))
          )}
        </div>

        {/* Past */}
        {past.length > 0 && (
          <>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Recent Past</h3>
            <div className="space-y-2">
              {past.slice(0, 10).map((a) => (
                <div key={a.id} className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-4 opacity-70">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">{a.title} — {a.patient.firstName} {a.patient.lastName}</p>
                    <p className="text-xs text-gray-400">{formatDatetime(a.startTime)}</p>
                  </div>
                  <StatusBadge status={a.status} type="appt" />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
