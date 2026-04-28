"use client";

import { useRouter } from "next/navigation";
import { CheckCheck } from "lucide-react";

export function MarkReadButton({ id }: { id: string }) {
  const router = useRouter();

  async function markRead() {
    await fetch(`/api/messages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
    });
    router.refresh();
  }

  return (
    <button
      onClick={markRead}
      className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
    >
      <CheckCheck className="w-3 h-3" /> Mark read
    </button>
  );
}
