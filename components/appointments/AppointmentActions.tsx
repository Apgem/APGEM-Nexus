"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

const STATUSES = ["CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"];

export function AppointmentActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function updateStatus(newStatus: string) {
    setLoading(true);
    setOpen(false);
    await fetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className="flex items-center gap-1 px-2 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        Actions <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-32">
          {STATUSES.filter((s) => s !== status).map((s) => (
            <button
              key={s}
              onClick={() => updateStatus(s)}
              className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors"
            >
              Mark {s.replace("_", " ")}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
