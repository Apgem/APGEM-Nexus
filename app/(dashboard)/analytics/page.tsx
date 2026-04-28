import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TopBar } from "@/components/layout/TopBar";
import { RiskBadge } from "@/components/ui/Badge";
import { subDays, startOfWeek, format } from "date-fns";
import { AnalyticsCharts } from "@/components/analytics/AnalyticsCharts";
import Link from "next/link";

async function getAnalyticsData() {
  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);

  const [riskGroups, totalPatients, taskStats, apptStats, taskStatusGroups, criticalPatients] =
    await Promise.all([
      prisma.patient.groupBy({ by: ["riskLevel"], _count: { id: true }, where: { isActive: true } }),
      prisma.patient.count({ where: { isActive: true } }),
      prisma.task.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { status: true, createdAt: true },
      }),
      prisma.appointment.findMany({
        where: { startTime: { gte: thirtyDaysAgo } },
        select: { status: true, startTime: true },
      }),
      prisma.task.groupBy({ by: ["status"], _count: { id: true } }),
      prisma.patient.findMany({
        where: { riskLevel: { in: ["CRITICAL", "HIGH"] }, isActive: true },
        select: { id: true, firstName: true, lastName: true, riskLevel: true, riskScore: true, conditions: true },
        orderBy: { riskScore: "desc" },
        take: 8,
      }),
    ]);

  // Weekly task adherence (last 8 weeks)
  const weeklyAdherence = [];
  for (let i = 7; i >= 0; i--) {
    const weekStart = startOfWeek(subDays(now, i * 7));
    const weekEnd = startOfWeek(subDays(now, (i - 1) * 7));
    const weekTasks = taskStats.filter(
      (t) => new Date(t.createdAt) >= weekStart && new Date(t.createdAt) < weekEnd
    );
    const completed = weekTasks.filter((t) => t.status === "COMPLETED").length;
    const total = weekTasks.length;
    weeklyAdherence.push({
      week: format(weekStart, "MMM d"),
      rate: total > 0 ? Math.round((completed / total) * 100) : 0,
      completed,
      total,
    });
  }

  // Monthly no-show rate (last 3 months)
  const monthlyNoShow = [];
  for (let i = 2; i >= 0; i--) {
    const monthStart = subDays(now, (i + 1) * 30);
    const monthEnd = subDays(now, i * 30);
    const monthAppts = apptStats.filter(
      (a) => new Date(a.startTime) >= monthStart && new Date(a.startTime) < monthEnd
    );
    const noShows = monthAppts.filter((a) => a.status === "NO_SHOW").length;
    const total = monthAppts.length;
    monthlyNoShow.push({
      month: format(monthStart, "MMM yyyy"),
      rate: total > 0 ? Math.round((noShows / total) * 100) : 0,
      noShows,
      total,
    });
  }

  const riskDistribution = riskGroups.map((g) => ({
    name: g.riskLevel,
    value: g._count.id,
  }));

  const taskStatusSummary = taskStatusGroups.reduce(
    (acc, g) => { acc[g.status] = g._count.id; return acc; },
    {} as Record<string, number>
  );

  return {
    totalPatients,
    riskDistribution,
    weeklyAdherence,
    monthlyNoShow,
    taskStatusSummary,
    criticalPatients,
  };
}

export default async function AnalyticsPage() {
  const session = await auth();
  const data = await getAnalyticsData();

  const totalTasks = Object.values(data.taskStatusSummary).reduce((a, b) => a + b, 0);
  const completedTasks = data.taskStatusSummary["COMPLETED"] ?? 0;
  const overallAdherence = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div>
      <TopBar title="Analytics & Outcomes" />
      <div className="p-6 space-y-6">
        {/* Summary KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Patients", value: data.totalPatients, sub: "Active" },
            { label: "High/Critical Risk", value: data.criticalPatients.length, sub: "Need attention", color: "text-red-600" },
            { label: "Task Adherence", value: `${overallAdherence}%`, sub: `${completedTasks}/${totalTasks} tasks` },
            {
              label: "Avg No-Show Rate",
              value: `${Math.round(data.monthlyNoShow.reduce((a, b) => a + b.rate, 0) / Math.max(data.monthlyNoShow.length, 1))}%`,
              sub: "Last 90 days",
            },
          ].map((k) => (
            <div key={k.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className={`text-2xl font-bold ${k.color ?? "text-gray-900"}`}>{k.value}</p>
              <p className="text-xs font-medium text-gray-700 mt-0.5">{k.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <AnalyticsCharts
          riskDistribution={data.riskDistribution}
          weeklyAdherence={data.weeklyAdherence}
          monthlyNoShow={data.monthlyNoShow}
          taskStatusSummary={data.taskStatusSummary}
        />

        {/* High Risk Patients Table */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">High-Risk Patients — Intervention Needed</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {data.criticalPatients.map((p) => {
              const conditions = p.conditions ? JSON.parse(p.conditions) : [];
              return (
                <Link key={p.id} href={`/patients/${p.id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-red-600">{p.firstName[0]}{p.lastName[0]}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{p.firstName} {p.lastName}</p>
                    <p className="text-xs text-gray-400">{conditions.slice(0, 2).join(", ")}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{p.riskScore}</p>
                      <p className="text-xs text-gray-400">Risk Score</p>
                    </div>
                    <RiskBadge level={p.riskLevel} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
