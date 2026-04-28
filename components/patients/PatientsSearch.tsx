"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import { Search } from "lucide-react";

const RISK_LEVELS = ["", "CRITICAL", "HIGH", "MEDIUM", "LOW"];
const RISK_LABELS: Record<string, string> = {
  "": "All Risk Levels",
  CRITICAL: "Critical",
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

export function PatientsSearch({
  defaultSearch,
  defaultRisk,
}: {
  defaultSearch: string;
  defaultRisk: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(defaultSearch);
  const [risk, setRisk] = useState(defaultRisk);

  const update = useCallback(
    (s: string, r: string) => {
      const params = new URLSearchParams();
      if (s) params.set("search", s);
      if (r) params.set("risk", r);
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname]
  );

  return (
    <>
      <div className="relative flex-1 min-w-48">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            update(e.target.value, risk);
          }}
          placeholder="Search by name or MRN..."
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <select
        value={risk}
        onChange={(e) => {
          setRisk(e.target.value);
          update(search, e.target.value);
        }}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      >
        {RISK_LEVELS.map((r) => (
          <option key={r} value={r}>
            {RISK_LABELS[r]}
          </option>
        ))}
      </select>
    </>
  );
}
