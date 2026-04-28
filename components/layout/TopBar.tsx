"use client";

import { Bell, User } from "lucide-react";
import { useSession } from "next-auth/react";

const ROLE_BADGE: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-700",
  DOCTOR: "bg-blue-100 text-blue-700",
  NURSE: "bg-green-100 text-green-700",
  PATIENT: "bg-gray-100 text-gray-700",
};

export function TopBar({ title }: { title?: string }) {
  const { data: session } = useSession();
  const role = session?.user?.role ?? "USER";

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      <div className="flex items-center gap-3">
        <button className="relative p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <User className="w-4 h-4 text-blue-600" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-900 leading-tight">
              {session?.user?.name}
            </p>
            <span
              className={`inline-block text-xs font-medium px-1.5 py-0.5 rounded-full ${ROLE_BADGE[role] ?? ROLE_BADGE.PATIENT}`}
            >
              {role}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
