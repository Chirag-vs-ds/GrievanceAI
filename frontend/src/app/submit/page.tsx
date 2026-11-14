"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  BrainCircuit,
  Building2,
  CheckCircle2,
  FileCheck2,
  FileText,
  Flag,
  LoaderCircle,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from "lucide-react";

const API_URL = "/api/grievances/predict";
const MIN_LENGTH = 5;
const MAX_LENGTH = 2000;

type Prediction = {
  category: string;
  score: number;
};

type GrievanceResult = {
  message: string;
  grievance_id: string;
  complaint: string;
  predicted_category: string;
  suggested_department: string;
  priority: string;
  status: string;
  manual_review_required: boolean;
  top_predictions: Prediction[];
  created_at: string;
};

function isGrievanceResult(value: unknown): value is GrievanceResult {
  if (typeof value !== "object" || value === null) return false;
  const data = value as Record<string, unknown>;
  const stringFields = [
    "message", "grievance_id", "complaint", "predicted_category",
    "suggested_department", "priority", "status", "created_at",
  ];
  return (
    stringFields.every((key) => typeof data[key] === "string" && data[key] !== "") &&
    typeof data.manual_review_required === "boolean" &&
    Array.isArray(data.top_predictions) &&
    data.top_predictions.length >= 3 &&
    data.top_predictions.every((prediction: unknown) => {
      if (typeof prediction !== "object" || prediction === null) return false;
      return (
        "category" in prediction && typeof prediction.category === "string" &&
        "score" in prediction && typeof prediction.score === "number" &&
        Number.isFinite(prediction.score) && prediction.score >= 0 && prediction.score <= 100
      );
    })
  );
}
function getErrorMessage(value: unknown): string {
  if (typeof value === "string") return value;

  if (Array.isArray(value)) {
    const message = value.find(
      (item): item is { msg: string } =>
        typeof item === "object" &&
        item !== null &&
        "msg" in item &&
        typeof item.msg === "string",
    )?.msg;

    if (message) return message;
  }

  return "We could not submit your grievance. Please try again.";
}
export default function SubmitGrievancePage() {
  const [complaint, setComplaint] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<GrievanceResult | null>(null);

  const trimmedLength = complaint.trim().length;
  const isValid =
    trimmedLength >= MIN_LENGTH && complaint.length <= MAX_LENGTH;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    setError("");
    setResult(null);

    if (trimmedLength < MIN_LENGTH) {
      setError("Please enter at least 5 meaningful characters.");
      return;
    }

    if (complaint.length > MAX_LENGTH) {
      setError("Your complaint cannot exceed 2,000 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complaint: complaint.trim() }),
      });

      const data: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const detail =
          typeof data === "object" && data !== null && "detail" in data
            ? data.detail
            : null;
        throw new Error(`Submission failed (HTTP ${response.status}). ${getErrorMessage(detail)}`);
      }

      if (!isGrievanceResult(data)) {
        throw new Error(
          "The service returned an invalid response. Your grievance may have been saved; check its status before submitting again.",
        );
      }

      setResult(data);
    } catch (submissionError) {
      setError(
        submissionError instanceof TypeError
          ? "Could not connect to the grievance service. Check your connection and that the service is running. Browser access may also be blocked. Submission could not be confirmed; check before retrying."
          : submissionError instanceof Error
            ? submissionError.message
            : "We could not submit your grievance. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F9FC] text-slate-800">
      <div className="bg-[#123B66] text-white">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-1 px-5 py-2 text-xs sm:flex-row sm:items-center">
          <p>AI-Powered Citizen Grievance Management Prototype</p>
          <p>Accessible â€¢ Transparent â€¢ Efficient</p>
        </div>
      </div>

      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#123B66] text-white">
              <ShieldCheck size={25} aria-hidden="true" />
            </span>
            <span>
              <span className="block text-xl font-bold tracking-tight text-[#123B66]">
                GrievanceAI
              </span>
              <span className="block text-[10px] tracking-wider text-slate-500">
                INTELLIGENT GRIEVANCE SYSTEM
              </span>
            </span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm font-semibold text-[#123B66] transition hover:border-[#123B66] hover:bg-blue-50"
          >
            <ArrowLeft size={17} aria-hidden="true" />
            <span className="hidden sm:inline">Back to Home</span>
            <span className="sm:hidden">Home</span>
          </Link>
        </nav>
      </header>

      <section className="border-b border-blue-100 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:py-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-3.5 py-2 text-xs font-bold tracking-wide text-[#B85E0A]">
            <FileText size={15} aria-hidden="true" />
            GRIEVANCE REGISTRATION
          </div>
          <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-[#123B66] sm:text-4xl">
            Submit a Grievance
          </h1>
          <p className="mt-3 max-w-2xl leading-7 text-slate-600">
            Describe your concern clearly. The system will analyse it and
            suggest a category and department for human review.
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)] lg:py-14">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5 sm:px-8">
            <h2 className="text-xl font-bold text-[#123B66]">
              Complaint details
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Fields marked with an asterisk are required.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8" noValidate>
            <label
              htmlFor="complaint"
              className="block text-sm font-semibold text-slate-800"
            >
              Complaint description <span className="text-red-600">*</span>
            </label>
            <p id="complaint-help" className="mt-2 text-sm text-slate-500">
              Include the issue, what happened, and any relevant context. Do not
              enter Aadhaar numbers, biometric data, passwords, or OTPs.
            </p>

            <textarea
              id="complaint"
              name="complaint"
              value={complaint}
              onChange={(event) => {
                setComplaint(event.target.value);
                if (error) setError("");
              }}
              minLength={MIN_LENGTH}
              maxLength={MAX_LENGTH}
              rows={10}
              required
              disabled={isSubmitting}
              aria-describedby="complaint-help complaint-count"
              aria-invalid={Boolean(error)}
              placeholder="Example: I am unable to receive an OTP while trying to use the authentication service..."
              className="mt-4 w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-sm leading-7 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#123B66] focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
            />

            <div
              id="complaint-count"
              className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs"
            >
              <span
                className={
                  complaint.length > 0 && trimmedLength < MIN_LENGTH
                    ? "font-medium text-amber-700"
                    : "text-slate-500"
                }
              >
                Minimum {MIN_LENGTH} characters
              </span>
              <span
                className={
                  complaint.length > 1900
                    ? "font-semibold text-amber-700"
                    : "text-slate-500"
                }
              >
                {complaint.length.toLocaleString()} / {MAX_LENGTH.toLocaleString()}
              </span>
            </div>

            {error && (
              <div
                role="alert"
                className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
              >
                <AlertCircle className="mt-0.5 shrink-0" size={19} aria-hidden="true" />
                <p>{error}</p>
              </div>
            )}

            <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-slate-500">
                AI recommendations support review and do not make final decisions.
              </p>
              <button
                type="submit"
                disabled={!isValid || isSubmitting}
                className="inline-flex min-w-48 items-center justify-center gap-2 rounded-lg bg-[#123B66] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/15 transition hover:bg-[#0B2D50] focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none"
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircle className="animate-spin" size={18} aria-hidden="true" />
                    Submittingâ€¦
                  </>
                ) : (
                  <>
                    <Sparkles size={18} aria-hidden="true" />
                    Submit Grievance
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        <aside className="space-y-5">
          <div className="rounded-2xl bg-[#123B66] p-6 text-white shadow-lg shadow-blue-950/10">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-orange-300">
              <BrainCircuit size={24} aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-lg font-bold">What happens next?</h2>
            <ol className="mt-5 space-y-4 text-sm text-blue-100">
              <li className="flex gap-3">
                <span className="font-bold text-orange-300">01</span>
                Your complaint is securely registered.
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-orange-300">02</span>
                The model suggests a category and department.
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-orange-300">03</span>
                You receive a grievance ID for tracking.
              </li>
            </ol>
          </div>

          <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 shrink-0 text-[#B85E0A]" size={20} aria-hidden="true" />
              <div>
                <h2 className="font-semibold text-[#7A3E08]">Protect your information</h2>
                <p className="mt-1 text-sm leading-6 text-[#8D541E]">
                  Use only fictional or non-sensitive details in this educational prototype.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {result && (
        <section
          aria-live="polite"
          className="mx-auto max-w-7xl px-5 pb-14"
        >
          <div className="overflow-hidden rounded-2xl border border-green-200 bg-white shadow-lg shadow-green-900/5">
            <div className="flex flex-col gap-4 bg-green-50 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 shrink-0 text-green-700" size={25} aria-hidden="true" />
                <div>
                  <h2 className="text-xl font-bold text-green-900">
                    Grievance submitted successfully
                  </h2>
                  <p className="mt-1 text-sm text-green-800">
                    Save this grievance ID to track your submission.
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-green-200 bg-white px-5 py-3">
                <p className="text-[11px] font-bold tracking-wider text-slate-500">
                  GRIEVANCE ID
                </p>
                <p className="mt-1 font-mono text-lg font-bold text-[#123B66]">
                  {result.grievance_id}
                </p>
              </div>
            </div>

            {result.manual_review_required && (
              <div className="flex items-start gap-3 border-y border-amber-200 bg-amber-50 px-6 py-4 text-sm text-amber-900 sm:px-8">
                <TriangleAlert className="mt-0.5 shrink-0" size={20} aria-hidden="true" />
                <p>
                  <strong>Manual review recommended.</strong> The model was not sufficiently confident, so a person should verify this classification.
                </p>
              </div>
            )}

            <div className="grid gap-6 p-6 sm:grid-cols-3 sm:p-8">
              {[
                { icon: FileCheck2, label: "Predicted category", value: result.predicted_category },
                { icon: Building2, label: "Suggested department", value: result.suggested_department },
                { icon: Flag, label: "Recommended priority", value: result.priority },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                    <Icon className="text-[#F28C28]" size={21} aria-hidden="true" />
                    <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {item.label}
                    </p>
                    <p className="mt-2 font-bold leading-6 text-[#123B66]">{item.value}</p>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-slate-100 px-6 py-7 sm:px-8">
              <h3 className="font-bold text-[#123B66]">Top 3 predictions</h3>
              <p className="mt-1 text-xs text-slate-500">
                Scores are model estimates and are not calibrated probabilities.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {result.top_predictions.slice(0, 3).map((prediction, index) => (
                  <div key={prediction.category} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-slate-700">
                        {index + 1}. {prediction.category}
                      </span>
                      <span className="font-mono text-sm font-bold text-[#123B66]">
                        {prediction.score.toFixed(2)}%
                      </span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-[#F28C28]"
                        style={{ width: `${Math.min(100, Math.max(0, prediction.score))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <footer className="bg-[#0B2D50] px-5 py-7 text-center text-xs text-blue-200">
        Â© {new Date().getFullYear()} GrievanceAI. Independent educational prototypeâ€”not an official government or UIDAI service.
      </footer>
    </main>
  );
}
