"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Play, X } from "lucide-react";

export function TaskActions({
  id,
  status,
  isAssignee,
}: {
  id: string;
  status: string;
  isAssignee: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function update(newStatus: string) {
    setLoading(true);
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setLoading(false);
    router.refresh();
  }

  if (status === "COMPLETED") return null;

  return (
    <div className="flex gap-1">
      {(status === "PENDING" || status === "OVERDUE") && (
        <button
          onClick={() => update("IN_PROGRESS")}
          disabled={loading}
          title="Start"
          className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
        >
          <Play className="w-3.5 h-3.5" />
        </button>
      )}
      <button
        onClick={() => update("COMPLETED")}
        disabled={loading}
        title="Complete"
        className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
      >
        <Check className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
