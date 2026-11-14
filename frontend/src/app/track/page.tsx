"use client";

import Link from "next/link";
import { type FormEvent, useRef, useState } from "react";
import {
  AlertCircle, ArrowLeft, Building2, CalendarDays, CheckCircle2,
  Clock3, FileText, Flag, LoaderCircle, RotateCcw, Search, ShieldCheck,
} from "lucide-react";

type Grievance = {
  grievance_id: string;
  complaint: string;
  category: string;
  department: string;
  priority: string | null;
  status: string | null;
  created_at: string | null;
};

function isGrievance(value: unknown): value is Grievance {
  if (typeof value !== "object" || value === null) return false;
  const data = value as Record<string, unknown>;
  return ["grievance_id", "complaint", "category", "department"].every(
    (key) => typeof data[key] === "string" && data[key] !== "",
  ) && ["priority", "status", "created_at"].every(
    (key) => data[key] === null || typeof data[key] === "string",
  );
}

function formatDate(value: string | null): string {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  // The API returns a local timestamp without a timezone; do not assume UTC.
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  }).format(date);
}

const stages = [
  { label: "Pending", icon: Clock3, description: "Awaiting review", color: "border-amber-300 bg-amber-50 text-amber-900" },
  { label: "In Progress", icon: LoaderCircle, description: "Being reviewed", color: "border-blue-300 bg-blue-50 text-blue-900" },
  { label: "Resolved", icon: CheckCircle2, description: "Marked resolved", color: "border-green-300 bg-green-50 text-green-900" },
];

export default function TrackGrievancePage() {
  const [grievanceId, setGrievanceId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [inputError, setInputError] = useState(false);
  const [result, setResult] = useState<Grievance | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestPending = useRef(false);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (requestPending.current) return;
    setError("");
    setInputError(false);
    setResult(null);
    const id = grievanceId.trim().toUpperCase();
    setGrievanceId(id);

    if (!/^GRV-\d{4}-\d{4,}$/.test(id) || id.length > 30) {
      setInputError(true);
      setError("Enter a valid grievance ID, such as GRV-2026-0004.");
      inputRef.current?.focus();
      return;
    }

    requestPending.current = true;
    setIsLoading(true);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(
        `/api/grievances/${encodeURIComponent(id)}`,
        { method: "GET", cache: "no-store", signal: controller.signal },
      );
      const data: unknown = await response.json().catch(() => null);

      if (response.status === 404) {
        throw new Error("No grievance was found with this ID. Check your submission receipt and try again.");
      }
      if (!response.ok) {
        const detail = typeof data === "object" && data !== null && "detail" in data && typeof data.detail === "string"
          ? data.detail : "We could not retrieve your grievance. Please try again shortly.";
        throw new Error(`Search failed (HTTP ${response.status}). ${detail}`);
      }
      if (!isGrievance(data) || data.grievance_id.toUpperCase() !== id) {
        throw new Error("The service returned an unexpected response. Please try again shortly.");
      }
      setResult(data);
    } catch (searchError) {
      setError(
        controller.signal.aborted
          ? "The search timed out. Please try again."
          : searchError instanceof TypeError
            ? "Could not connect to the grievance service. Check your connection and try again."
            : searchError instanceof Error
              ? searchError.message
              : "We could not retrieve your grievance. Please try again.",
      );
    } finally {
      window.clearTimeout(timeout);
      requestPending.current = false;
      setIsLoading(false);
    }
  }

  function searchAgain() {
    setResult(null);
    setError("");
    setInputError(false);
    setGrievanceId("");
    inputRef.current?.focus();
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#F7F9FC] text-slate-800">
      <div className="bg-[#123B66] text-white">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-1 px-5 py-2 text-xs sm:flex-row">
          <p>AI-Powered Citizen Grievance Management Prototype</p>
          <p>Accessible • Transparent • Efficient</p>
        </div>
      </div>
      <header className="border-b border-slate-200 bg-white">
        <nav aria-label="Main navigation" className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-4">
          <Link href="/" className="flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-[#123B66]">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#123B66] text-white"><ShieldCheck size={25} aria-hidden="true" /></span>
            <span><span className="block text-xl font-bold tracking-tight text-[#123B66]">GrievanceAI</span><span className="block text-[10px] tracking-wider text-slate-500">INTELLIGENT GRIEVANCE SYSTEM</span></span>
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-semibold text-[#123B66] hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-[#123B66]">
            <ArrowLeft size={17} aria-hidden="true" /><span>Home</span>
          </Link>
        </nav>
      </header>

      <section className="border-b border-blue-100 bg-white">
        <div className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
          <p className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-4 py-2 text-xs font-bold tracking-wide text-[#B85E0A]"><Search size={15} aria-hidden="true" />GRIEVANCE TRACKING</p>
          <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-[#123B66] sm:text-4xl">Track Your Grievance</h1>
          <p className="mt-3 max-w-2xl leading-7 text-slate-600">Use your grievance ID to view your complaint details and its latest recorded status.</p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-5xl flex-1 space-y-7 px-5 py-10 sm:py-12">
        <section aria-labelledby="search-heading" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 id="search-heading" className="text-xl font-bold text-[#123B66]">Find your grievance</h2>
          <form onSubmit={handleSearch} noValidate className="mt-5" aria-busy={isLoading}>
            <label htmlFor="grievance-id" className="block text-sm font-semibold">Grievance ID <span className="text-red-600">*</span></label>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <input ref={inputRef} id="grievance-id" name="grievance-id" required maxLength={30} autoComplete="off" spellCheck={false}
                value={grievanceId} disabled={isLoading} placeholder="e.g. GRV-2026-0004"
                aria-invalid={inputError} aria-describedby={inputError ? "id-help search-error" : "id-help"}
                onChange={(event) => { setGrievanceId(event.target.value); setError(""); setInputError(false); setResult(null); }}
                className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3.5 font-mono text-sm text-slate-800 outline-none placeholder:font-sans placeholder:text-slate-400 focus:border-[#123B66] focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50" />
              <button type="submit" disabled={isLoading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#123B66] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#0B2D50] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#123B66] disabled:cursor-wait disabled:opacity-60">
                {isLoading ? <LoaderCircle size={18} className="animate-spin" aria-hidden="true" /> : <Search size={18} aria-hidden="true" />}
                {isLoading ? "Searching…" : "Search Grievance"}
              </button>
            </div>
            <p id="id-help" className="mt-3 text-xs leading-5 text-slate-500">Your grievance ID was provided when you submitted your complaint.</p>
            {error && <div id="search-error" role="alert" className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><AlertCircle size={20} className="shrink-0" aria-hidden="true" /><p>{error}</p></div>}
          </form>
        </section>

        <div aria-live="polite" aria-atomic="true">
          {isLoading && <p role="status" className="text-center text-sm text-slate-600">Retrieving your latest grievance details…</p>}
          {result && (
            <section aria-labelledby="result-heading" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col justify-between gap-4 border-b border-slate-100 bg-blue-50/60 p-6 sm:flex-row sm:items-center sm:p-8">
                <div><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Grievance found</p><h2 id="result-heading" className="mt-2 break-all font-mono text-xl font-bold text-[#123B66] sm:text-2xl">{result.grievance_id}</h2></div>
                <span className={`self-start rounded-full border px-4 py-2 text-sm font-semibold ${stages.find((stage) => stage.label === result.status)?.color ?? "border-slate-200 bg-slate-100 text-slate-700"}`}>Current status: {result.status || "Not available"}</span>
              </div>
              <div className="space-y-8 p-6 sm:p-8">
                <div>
                  <h3 className="font-bold text-[#123B66]">Current progress</h3>
                  <ul className="mt-4 grid gap-3 sm:grid-cols-3" aria-label="Grievance status stages">
                    {stages.map((stage) => {
                      const active = result.status === stage.label;
                      const Icon = stage.icon;
                      return <li key={stage.label} aria-current={active ? "step" : undefined} className={`flex items-start gap-3 rounded-xl border p-4 ${active ? stage.color : "border-slate-200 bg-slate-50 text-slate-500"}`}>
                        <Icon size={22} className="mt-0.5 shrink-0" aria-hidden="true" />
                        <div><p className="text-sm font-bold">{stage.label}{active && <span className="ml-2 text-xs">(Current)</span>}</p><p className="mt-1 text-xs">{stage.description}</p></div>
                      </li>;
                    })}
                  </ul>
                  <p className="mt-3 text-xs text-slate-500">This shows the current recorded status, not a history of status changes.</p>
                </div>

                <dl className="grid gap-4 sm:grid-cols-2">
                  {[
                    { label: "Predicted category", value: result.category, icon: FileText },
                    { label: "Suggested department", value: result.department, icon: Building2 },
                    { label: "Priority", value: result.priority || "Not available", icon: Flag },
                    { label: "Submission date", value: formatDate(result.created_at), icon: CalendarDays },
                  ].map(({ label, value, icon: Icon }) => <div key={label} className="min-w-0 rounded-xl border border-slate-200 p-5"><dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"><Icon size={18} className="text-[#B85E0A]" aria-hidden="true" />{label}</dt><dd className="mt-3 break-words font-semibold leading-6 text-[#123B66]">{value}</dd></div>)}
                </dl>
                <div><h3 className="font-bold text-[#123B66]">Complaint description</h3><p className="mt-3 whitespace-pre-wrap break-words rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700">{result.complaint}</p></div>
                <div className="border-t border-slate-100 pt-6"><button type="button" onClick={searchAgain} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#123B66] px-5 py-3 text-sm font-semibold text-[#123B66] transition hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#123B66] sm:w-auto"><RotateCcw size={17} aria-hidden="true" />Search again</button></div>
              </div>
            </section>
          )}
        </div>
        {!result && !isLoading && <p className="text-center text-sm text-slate-500">Need to register a concern? <Link href="/submit" className="font-semibold text-[#123B66] underline underline-offset-4">Submit a grievance</Link></p>}
      </div>
      <footer className="bg-[#0B2D50] px-5 py-7 text-center text-xs leading-6 text-blue-200">GrievanceAI is an independent educational prototype. It is not an official government or UIDAI service.</footer>
    </main>
  );
}
