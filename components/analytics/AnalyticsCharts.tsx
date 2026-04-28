"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const RISK_COLORS: Record<string, string> = {
  LOW: "#22c55e",
  MEDIUM: "#eab308",
  HIGH: "#f97316",
  CRITICAL: "#ef4444",
};

const TASK_COLORS: Record<string, string> = {
  PENDING: "#94a3b8",
  IN_PROGRESS: "#3b82f6",
  COMPLETED: "#22c55e",
  OVERDUE: "#ef4444",
};

interface Props {
  riskDistribution: { name: string; value: number }[];
  weeklyAdherence: { week: string; rate: number; completed: number; total: number }[];
  monthlyNoShow: { month: string; rate: number; noShows: number; total: number }[];
  taskStatusSummary: Record<string, number>;
}

export function AnalyticsCharts({ riskDistribution, weeklyAdherence, monthlyNoShow, taskStatusSummary }: Props) {
  const taskStatusData = Object.entries(taskStatusSummary).map(([status, count]) => ({
    status: status.replace("_", " "),
    count,
    fill: TASK_COLORS[status] ?? "#94a3b8",
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Risk Distribution Pie */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Patient Risk Distribution</h3>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={riskDistribution}
              cx="50%"
              cy="50%"
              outerRadius={90}
              dataKey="value"
              label={({ name, value }) => `${name}: ${value}`}
              labelLine={true}
            >
              {riskDistribution.map((entry) => (
                <Cell key={entry.name} fill={RISK_COLORS[entry.name] ?? "#94a3b8"} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Task Status Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Task Status Overview</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={taskStatusData} layout="vertical" margin={{ left: 20, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis type="category" dataKey="status" tick={{ fontSize: 12 }} width={80} />
            <Tooltip />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {taskStatusData.map((entry) => (
                <Cell key={entry.status} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Weekly Adherence Line */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Weekly Care Plan Adherence (%)</h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={weeklyAdherence}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
            <Tooltip formatter={(v) => [`${v}%`, "Adherence"]} />
            <Line
              type="monotone"
              dataKey="rate"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: "#3b82f6", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly No-Show Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Monthly No-Show Rate (%)</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={monthlyNoShow}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
            <Tooltip
              formatter={(v, _name, p) => [
                `${v}% (${(p.payload as { noShows: number; total: number }).noShows}/${(p.payload as { noShows: number; total: number }).total})`,
                "No-Show Rate",
              ]}
            />
            <Bar dataKey="rate" fill="#f97316" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
