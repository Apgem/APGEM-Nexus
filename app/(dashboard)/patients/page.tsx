import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";
import { RiskBadge, StatusBadge } from "@/components/ui/Badge";
import { formatDate, getAge } from "@/lib/utils";
import { UserPlus, Search } from "lucide-react";
import { PatientsSearch } from "@/components/patients/PatientsSearch";

async function getPatients(search: string, risk: string) {
  const where = {
    isActive: true,
    ...(search
      ? {
          OR: [
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { mrn: { contains: search } },
          ],
        }
      : {}),
    ...(risk ? { riskLevel: risk } : {}),
  };

  return prisma.patient.findMany({
    where,
    include: {
      primaryProvider: { select: { id: true, name: true } },
      _count: { select: { tasks: true, appointments: true } },
    },
    orderBy: [{ riskScore: "desc" }, { lastName: "asc" }],
  });
}

const RISK_ORDER = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; risk?: string }>;
}) {
  const { search = "", risk = "" } = await searchParams;
  const session = await auth();
  const patients = await getPatients(search, risk);

  return (
    <div>
      <TopBar title="Patient Registry" />
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-gray-500">{patients.length} active patients</p>
          </div>
          <Link
            href="/patients/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Add Patient
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 mb-4">
          <div className="p-4 flex flex-wrap gap-3">
            <PatientsSearch defaultSearch={search} defaultRisk={risk} />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">MRN</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Age/Gender</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Risk</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Provider</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tasks</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {patients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No patients found
                  </td>
                </tr>
              ) : (
                patients.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/patients/${p.id}`} className="flex items-center gap-3 group">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold text-blue-600">{p.firstName[0]}{p.lastName[0]}</span>
                        </div>
                        <span className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                          {p.lastName}, {p.firstName}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.mrn}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {getAge(p.dateOfBirth)}y / {p.gender[0]}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <RiskBadge level={p.riskLevel} />
                        <span className="text-xs text-gray-400">{p.riskScore}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{p.primaryProvider?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{p._count.tasks}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(p.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
