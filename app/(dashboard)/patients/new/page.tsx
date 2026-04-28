"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";
import { ArrowLeft, Loader2, Plus, X } from "lucide-react";

export default function NewPatientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [conditions, setConditions] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [medications, setMedications] = useState<string[]>([]);
  const [conditionInput, setConditionInput] = useState("");
  const [allergyInput, setAllergyInput] = useState("");
  const [medicationInput, setMedicationInput] = useState("");

  function addToList(val: string, list: string[], setList: (v: string[]) => void, setInput: (v: string) => void) {
    const trimmed = val.trim();
    if (trimmed && !list.includes(trimmed)) setList([...list, trimmed]);
    setInput("");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const body = {
      mrn: fd.get("mrn"),
      firstName: fd.get("firstName"),
      lastName: fd.get("lastName"),
      dateOfBirth: fd.get("dateOfBirth"),
      gender: fd.get("gender"),
      phone: fd.get("phone"),
      email: fd.get("email"),
      address: fd.get("address"),
      emergencyContact: fd.get("emergencyContact"),
      bloodType: fd.get("bloodType"),
      insuranceProvider: fd.get("insuranceProvider"),
      insuranceId: fd.get("insuranceId"),
      notes: fd.get("notes"),
      conditions: JSON.stringify(conditions),
      allergies: JSON.stringify(allergies),
      medications: JSON.stringify(medications),
      admissionDate: fd.get("admissionDate") || undefined,
    };

    const res = await fetch("/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Failed to create patient");
    } else {
      const d = await res.json();
      router.push(`/patients/${d.data.id}`);
    }
  }

  return (
    <div>
      <TopBar title="Add New Patient" />
      <div className="p-6 max-w-3xl">
        <Link href="/patients" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6 w-fit">
          <ArrowLeft className="w-4 h-4" /> Back to Patients
        </Link>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <Field label="First Name" name="firstName" required />
              <Field label="Last Name" name="lastName" required />
              <Field label="Date of Birth" name="dateOfBirth" type="date" required />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                <select name="gender" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <Field label="MRN" name="mrn" required placeholder="e.g. MRN-2024-001" />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Blood Type</label>
                <select name="bloodType" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Unknown</option>
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bt) => (
                    <option key={bt} value={bt}>{bt}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Contact Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Phone" name="phone" type="tel" />
              <Field label="Email" name="email" type="email" />
              <div className="col-span-2">
                <Field label="Address" name="address" />
              </div>
              <div className="col-span-2">
                <Field label="Emergency Contact" name="emergencyContact" placeholder="Name, relationship, phone" />
              </div>
            </div>
          </div>

          {/* Insurance */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Insurance</h3>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Insurance Provider" name="insuranceProvider" />
              <Field label="Insurance ID" name="insuranceId" />
            </div>
          </div>

          {/* Clinical */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Clinical Information</h3>

            {/* Conditions */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Conditions/Diagnoses</label>
              <div className="flex gap-2 mb-2">
                <input
                  value={conditionInput}
                  onChange={(e) => setConditionInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addToList(conditionInput, conditions, setConditions, setConditionInput))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Type condition and press Enter or +"
                />
                <button type="button" onClick={() => addToList(conditionInput, conditions, setConditions, setConditionInput)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {conditions.map((c) => (
                  <span key={c} className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">
                    {c}
                    <button type="button" onClick={() => setConditions(conditions.filter((x) => x !== c))}><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            </div>

            {/* Allergies */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
              <div className="flex gap-2 mb-2">
                <input
                  value={allergyInput}
                  onChange={(e) => setAllergyInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addToList(allergyInput, allergies, setAllergies, setAllergyInput))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Type allergy and press Enter or +"
                />
                <button type="button" onClick={() => addToList(allergyInput, allergies, setAllergies, setAllergyInput)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {allergies.map((a) => (
                  <span key={a} className="flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-700 text-xs rounded-full">
                    {a}
                    <button type="button" onClick={() => setAllergies(allergies.filter((x) => x !== a))}><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            </div>

            {/* Medications */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Medications</label>
              <div className="flex gap-2 mb-2">
                <input
                  value={medicationInput}
                  onChange={(e) => setMedicationInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addToList(medicationInput, medications, setMedications, setMedicationInput))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Type medication and press Enter or +"
                />
                <button type="button" onClick={() => addToList(medicationInput, medications, setMedications, setMedicationInput)} className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {medications.map((m) => (
                  <span key={m} className="flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded-full">
                    {m}
                    <button type="button" onClick={() => setMedications(medications.filter((x) => x !== m))}><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            </div>

            <Field label="Last Admission Date" name="admissionDate" type="date" />
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Clinical Notes</label>
              <textarea
                name="notes"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Additional clinical notes..."
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Register Patient
            </button>
            <Link href="/patients" className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label, name, type = "text", required, placeholder,
}: {
  label: string; name: string; type?: string; required?: boolean; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && "*"}
      </label>
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
