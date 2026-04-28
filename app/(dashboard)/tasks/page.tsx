import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TopBar } from "@/components/layout/TopBar";
import { StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { TaskActions } from "@/components/tasks/TaskActions";
import { NewTaskModal } from "@/components/tasks/NewTaskModal";

async function getTasks(userId: string) {
  const now = new Date();
  await prisma.task.updateMany({
    where: { status: { in: ["PENDING", "IN_PROGRESS"] }, dueDate: { lt: now } },
    data: { status: "OVERDUE" },
  });

  return prisma.task.findMany({
    include: {
      patient: { select: { id: true, firstName: true, lastName: true } },
      assignee: { select: { id: true, name: true } },
      creator: { select: { id: true, name: true } },
    },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
  });
}

const STATUS_ORDER = ["OVERDUE", "IN_PROGRESS", "PENDING", "COMPLETED"];

export default async function TasksPage() {
  const session = await auth();
  const tasks = await getTasks(session!.user.id);

  const myTasks = tasks.filter((t) => t.assigneeId === session!.user.id);
  const allTasks = tasks;

  const overdue = tasks.filter((t) => t.status === "OVERDUE");
  const pending = tasks.filter((t) => t.status === "PENDING");
  const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS");
  const completed = tasks.filter((t) => t.status === "COMPLETED");

  return (
    <div>
      <TopBar title="Tasks" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-4 text-sm">
            {overdue.length > 0 && <span className="text-red-600 font-medium">{overdue.length} overdue</span>}
            <span className="text-gray-500">{pending.length} pending</span>
            <span className="text-blue-500">{inProgress.length} in progress</span>
            <span className="text-gray-400">{completed.length} completed</span>
          </div>
          <NewTaskModal />
        </div>

        {/* Overdue */}
        {overdue.length > 0 && (
          <Section title="Overdue" titleClass="text-red-600" tasks={overdue} sessionUserId={session!.user.id} />
        )}

        {/* In Progress */}
        {inProgress.length > 0 && (
          <Section title="In Progress" titleClass="text-blue-600" tasks={inProgress} sessionUserId={session!.user.id} />
        )}

        {/* Pending */}
        <Section title="Pending" titleClass="text-gray-700" tasks={pending} sessionUserId={session!.user.id} />

        {/* Completed */}
        {completed.length > 0 && (
          <Section title="Completed" titleClass="text-gray-400" tasks={completed} sessionUserId={session!.user.id} />
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  titleClass,
  tasks,
  sessionUserId,
}: {
  title: string;
  titleClass: string;
  tasks: Awaited<ReturnType<typeof getTasks>>;
  sessionUserId: string;
}) {
  return (
    <div className="mb-6">
      <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${titleClass}`}>{title} ({tasks.length})</h3>
      <div className="space-y-2">
        {tasks.map((t) => (
          <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <p className="font-medium text-gray-900">{t.title}</p>
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={t.priority} />
                  <StatusBadge status={t.status} />
                </div>
              </div>
              {t.description && <p className="text-sm text-gray-500 mt-1">{t.description}</p>}
              <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400">
                {t.patient && (
                  <Link href={`/patients/${t.patient.id}`} className="text-blue-500 hover:underline">
                    {t.patient.firstName} {t.patient.lastName}
                  </Link>
                )}
                {t.assignee && <span>Assigned to: {t.assignee.name}</span>}
                {t.dueDate && <span>Due: {formatDate(t.dueDate)}</span>}
                <span>By: {t.creator.name}</span>
              </div>
            </div>
            <TaskActions
              id={t.id}
              status={t.status}
              isAssignee={t.assigneeId === sessionUserId}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
