import Link from "next/link";
import type { CcmEnrollment, Patient } from "../../lib/ccm/types";
import { statusLabel } from "../../lib/ccm/labels";

type Props = {
  enrollmentsByPatientId: Record<string, CcmEnrollment | undefined>;
  patients: Patient[];
};

function statusClass(value: string | null | undefined): string {
  if (value === "active" || value === "eligible" || value === "obtained") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (value === "declined" || value === "revoked" || value === "ineligible") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-gray-200 bg-gray-50 text-gray-700";
}

function StatusBadge({ value }: { value: string | null | undefined }) {
  return (
    <span
      className={`inline-flex rounded-md border px-2 py-1 text-xs font-medium ${statusClass(
        value,
      )}`}
    >
      {statusLabel(value)}
    </span>
  );
}

export default function PatientTable({ enrollmentsByPatientId, patients }: Props) {
  if (patients.length === 0) {
    return (
      <div className="rounded-md border bg-white p-5 text-sm text-gray-600">
        No patients yet. Add one enrolled patient to begin the first billable CCM month.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border bg-white text-black">
      <table className="w-full min-w-[760px] border-collapse text-left text-sm">
        <thead className="border-b bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-4 py-3 font-semibold">Patient</th>
            <th className="px-4 py-3 font-semibold">Contact</th>
            <th className="px-4 py-3 font-semibold">Enrollment</th>
            <th className="px-4 py-3 font-semibold">Eligibility</th>
            <th className="px-4 py-3 font-semibold">Consent</th>
            <th className="px-4 py-3 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {patients.map((patient) => {
            const enrollment = enrollmentsByPatientId[patient.id];

            return (
              <tr key={patient.id} className="border-b last:border-b-0">
                <td className="px-4 py-3 align-top">
                  <Link
                    className="font-medium underline underline-offset-2"
                    href={`/patients/${patient.id}`}
                  >
                    {patient.display_name}
                  </Link>
                  {patient.external_id ? (
                    <div className="mt-1 text-xs text-gray-500">
                      {patient.external_id}
                    </div>
                  ) : null}
                </td>
                <td className="px-4 py-3 align-top text-gray-700">
                  <div>{patient.phone || "No phone"}</div>
                  <div className="text-xs text-gray-500">{patient.email || "No email"}</div>
                </td>
                <td className="px-4 py-3 align-top">
                  <StatusBadge value={enrollment?.status} />
                </td>
                <td className="px-4 py-3 align-top">
                  <StatusBadge value={enrollment?.eligibility_status} />
                </td>
                <td className="px-4 py-3 align-top">
                  <StatusBadge value={enrollment?.consent_status} />
                </td>
                <td className="px-4 py-3 align-top">
                  <StatusBadge value={patient.status} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
