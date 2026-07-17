"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import PatientTable from "../../components/patients/PatientTable";
import type { CcmEnrollment, Patient } from "../../lib/ccm/types";
import { getSupabaseAuthHeaders } from "../../lib/supabase";
import { Plus, Search } from "lucide-react";
import LoadingState from "../../components/ui/LoadingState";

type ActivePracticeResponse = { error?: string; practice?: { id: string; name: string } };
type PatientsResponse = {
  enrollmentsByPatientId?: Record<string, CcmEnrollment>;
  error?: string;
  patients?: Patient[];
  total?: number;
};

const PAGE_SIZE = 25;

export default function PatientsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [practiceId, setPracticeId] = useState<string | null>(null);
  const [practiceName, setPracticeName] = useState<string | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [enrollments, setEnrollments] = useState<Record<string, CcmEnrollment>>({});
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchDraft, setSearchDraft] = useState(searchParams.get("search") ?? "");
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";
  const sort = searchParams.get("sort") ?? "display_name";
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const setFilters = useCallback((updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    router.replace(`/patients?${next}`);
  }, [router, searchParams]);

  useEffect(() => {
    let active = true;
    async function loadPractice() {
      const stored = localStorage.getItem("activePracticeId");
      const response = await fetch("/api/practices/active", { headers: { ...(await getSupabaseAuthHeaders()), ...(stored ? { "x-active-practice-id": stored } : {}) } });
      const result = (await response.json()) as ActivePracticeResponse;
      if (!active) return;
      if (!response.ok || !result.practice) {
        setError(result.error ?? "No active practice found");
        setLoading(false);
        return;
      }
      localStorage.setItem("activePracticeId", result.practice.id);
      setPracticeId(result.practice.id);
      setPracticeName(result.practice.name);
    }
    void loadPractice();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!practiceId) return;
    const activePracticeId = practiceId;
    let active = true;
    async function loadPatients() {
      setLoading(true);
      const query = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE), practiceId: activePracticeId, sort });
      if (search) query.set("search", search);
      if (status) query.set("status", status);
      const response = await fetch(`/api/patients?${query}`, { headers: await getSupabaseAuthHeaders() });
      const result = (await response.json()) as PatientsResponse;
      if (!active) return;
      if (!response.ok) setError(result.error ?? "Unable to load patients");
      else {
        setError(null);
        setPatients(result.patients ?? []);
        setEnrollments(result.enrollmentsByPatientId ?? {});
        setTotal(result.total ?? 0);
      }
      setLoading(false);
    }
    void loadPatients();
    return () => { active = false; };
  }, [page, practiceId, search, sort, status]);

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    setFilters({ page: null, search: searchDraft.trim() || null });
  }

  return (
    <main className="page-shell">
      <div className="flex items-center justify-between gap-4">
        <div><p className="eyebrow">Patient registry</p><h1 className="page-title mt-1">Patients</h1><div className="page-description">{practiceName ?? "Practice"} - {total} patient records</div></div>
        <Link href="/patients/new" className="button-primary"><Plus aria-hidden="true" size={17} /> Add patient</Link>
      </div>
      <form className="surface grid gap-3 p-4 md:grid-cols-[minmax(16rem,1fr)_10rem_12rem_auto]" onSubmit={submitSearch}>
        <label className="space-y-1 text-sm"><span className="font-medium">Find patient</span><input className="w-full rounded-md border px-3 py-2" onChange={(event) => setSearchDraft(event.target.value)} placeholder="Name, DOB, external ID, or phone" value={searchDraft} /></label>
        <label className="space-y-1 text-sm"><span className="font-medium">Status</span><select className="w-full rounded-md border px-3 py-2" onChange={(event) => setFilters({ page: null, status: event.target.value || null })} value={status}><option value="">All</option><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
        <label className="space-y-1 text-sm"><span className="font-medium">Sort</span><select className="w-full rounded-md border px-3 py-2" onChange={(event) => setFilters({ page: null, sort: event.target.value })} value={sort}><option value="display_name">Patient name</option><option value="dob">Date of birth</option><option value="external_id">External ID</option><option value="status">Status</option></select></label>
        <button className="button-primary self-end" type="submit"><Search aria-hidden="true" size={16} /> Search</button>
      </form>
      {error ? <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
      {loading ? <LoadingState label="Loading patient registry" /> : <PatientTable enrollmentsByPatientId={enrollments} patients={patients} />}
      <div className="flex items-center justify-between text-sm"><span>Page {page} of {pageCount}</span><div className="flex gap-2"><button className="rounded-md border px-3 py-2 disabled:opacity-50" disabled={page <= 1} onClick={() => setFilters({ page: String(page - 1) })}>Previous</button><button className="rounded-md border px-3 py-2 disabled:opacity-50" disabled={page >= pageCount} onClick={() => setFilters({ page: String(page + 1) })}>Next</button></div></div>
    </main>
  );
}
