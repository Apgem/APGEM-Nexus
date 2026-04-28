"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function NewAppointmentPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const defaultPatientId = sp.get("patientId") ?? "";

  const [patients, setPatients] = useState<{ id: string; firstName: string; lastName: string }[]>([]);
  const [providers, setProviders] = useState<{ id: string; name: string; role: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/patients").then((r) => r.json()).then((d) => setPatients(d.data ?? []));
    fetch("/api/users").then((r) => r.json()).then((d) =>
      setProviders((d.data ?? []).filter((u: { role: string }) => ["DOCTOR", "NURSE"].includes(u.role)))
    );
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const startTime = new Date(`${fd.get("date")}T${fd.get("startTime")}`);
    const endTime = new Date(startTime.getTime() + parseInt(fd.get("duration") as string) * 60000);

    const body = {
      title: fd.get("title"),
      patientId: fd.get("patientId"),
      providerId: fd.get("providerId"),
      type: fd.get("type"),
      location: fd.get("location"),
      notes: fd.get("notes"),
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
    };

    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Failed to schedule appointment");
    } else {
      router.push("/appointments");
    }
  }

  return (
    <div>
      <TopBar title="Schedule Appointment" />
      <div className="p-6 max-w-2xl">
        <Link href="/appointments" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6 w-fit">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Appointment Details</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input name="title" required defaultValue="Follow-up Visit" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient *</label>
                <select name="patientId" required defaultValue={defaultPatientId} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select patient...</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provider *</label>
                <select name="providerId" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select provider...</option>
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input name="date" type="date" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
                <input name="startTime" type="time" required defaultValue="09:00" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                <select name="duration" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="15">15 min</option>
                  <option value="30" selected>30 min</option>
                  <option value="45">45 min</option>
                  <option value="60">1 hour</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select name="type" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {["Follow-up", "Initial Visit", "Telehealth", "Lab Review", "Specialist Consult", "Post-Discharge"].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input name="location" placeholder="e.g. Room 204 or Telehealth" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea name="notes" rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Schedule Appointment
            </button>
            <Link href="/appointments" className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
