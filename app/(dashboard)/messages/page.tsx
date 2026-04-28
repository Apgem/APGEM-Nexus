import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TopBar } from "@/components/layout/TopBar";
import { timeAgo } from "@/lib/utils";
import { MessageSquare, AlertCircle } from "lucide-react";
import { NewMessageModal } from "@/components/messages/NewMessageModal";
import { MarkReadButton } from "@/components/messages/MarkReadButton";

async function getMessages(userId: string) {
  return prisma.message.findMany({
    where: { OR: [{ senderId: userId }, { receiverId: userId }] },
    include: {
      sender: { select: { id: true, name: true, role: true } },
      receiver: { select: { id: true, name: true, role: true } },
      replies: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-700",
  DOCTOR: "bg-blue-100 text-blue-700",
  NURSE: "bg-green-100 text-green-700",
  PATIENT: "bg-gray-100 text-gray-600",
};

export default async function MessagesPage() {
  const session = await auth();
  const messages = await getMessages(session!.user.id);
  const unread = messages.filter((m) => m.receiverId === session!.user.id && !m.readAt);

  return (
    <div>
      <TopBar title="Messages" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">
            {unread.length > 0 ? (
              <span className="text-blue-600 font-medium">{unread.length} unread</span>
            ) : (
              "All caught up"
            )}
          </p>
          <NewMessageModal />
        </div>

        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400">No messages yet</p>
            </div>
          ) : (
            messages.map((m) => {
              const isReceived = m.receiverId === session!.user.id;
              const isUnread = isReceived && !m.readAt;
              const other = isReceived ? m.sender : m.receiver;

              return (
                <div
                  key={m.id}
                  className={`bg-white rounded-xl border p-4 transition-colors ${
                    isUnread ? "border-blue-200 bg-blue-50/30" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-gray-600">{other.name[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-gray-900">{other.name}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${ROLE_COLORS[other.role]}`}>
                            {other.role}
                          </span>
                          {m.isUrgent && (
                            <span className="flex items-center gap-0.5 text-xs text-red-600 font-medium">
                              <AlertCircle className="w-3 h-3" /> URGENT
                            </span>
                          )}
                          {!isReceived && <span className="text-xs text-gray-400">Sent</span>}
                        </div>
                        <p className="text-sm font-medium text-gray-800 mt-0.5">{m.subject}</p>
                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{m.body}</p>
                        {m.replies.length > 0 && (
                          <p className="text-xs text-gray-400 mt-1">{m.replies.length} repl{m.replies.length === 1 ? "y" : "ies"}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className="text-xs text-gray-400">{timeAgo(m.createdAt)}</span>
                      {isUnread && <MarkReadButton id={m.id} />}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
