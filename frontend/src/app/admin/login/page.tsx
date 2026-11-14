"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, LoaderCircle } from "lucide-react";

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/admin/me", { credentials: "include", cache: "no-store", signal: controller.signal })
      .then((response) => {
        if (response.ok) router.replace("/admin");
        else if (new URLSearchParams(window.location.search).get("reason") === "expired") setNotice("Your session expired or is invalid. Please sign in again.");
        else if (new URLSearchParams(window.location.search).get("reason") === "logout") setNotice("You have been logged out.");
      }).catch(() => {});
    return () => controller.abort();
  }, [router]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (response.status === 401) throw new Error("Invalid username or password.");
      if (response.status === 403) throw new Error("Login is blocked from this website address. For the local demo, open http://localhost:3000/admin/login on the computer running GrievanceAI and sign in there.");
      if (response.status === 429) throw new Error("Too many attempts. Wait one minute and try again.");
      if (!response.ok) throw new Error("Login is unavailable. Check that the administrator has been provisioned and the service is running.");
      const session = await fetch("/api/admin/me", { credentials: "include", cache: "no-store" });
      if (!session.ok) throw new Error("The session could not be established. Check your cookie and HTTPS configuration.");
      setPassword(""); router.replace("/admin");
    } catch (err) {
      setError(err instanceof TypeError ? "Cannot reach the service. Please try again." : err instanceof Error ? err.message : "Login failed.");
    } finally { setBusy(false); }
  }
  return <main className="flex min-h-screen items-center justify-center bg-[#F7F9FC] px-5 py-12 text-slate-800"><section className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg"><div className="border-t-4 border-[#F28C28] bg-[#123B66] p-8 text-white"><ShieldCheck size={36} aria-hidden="true" /><p className="mt-5 text-xs font-bold tracking-widest text-orange-300">GRIEVANCEAI ADMINISTRATION</p><h1 className="mt-2 text-3xl font-bold">Admin sign in</h1><p className="mt-3 text-sm text-blue-100">Sign in to review and manage grievances.</p></div><form onSubmit={login} className="space-y-5 p-8">{notice && <p role="status" className="rounded-lg bg-blue-50 p-3 text-sm text-[#123B66]">{notice}</p>}{error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}<label className="block text-sm font-semibold">Username<input required maxLength={100} autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} disabled={busy} className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-3 focus:outline-[#123B66]" /></label><label className="block text-sm font-semibold">Password<input required type="password" maxLength={1024} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={busy} className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-3 focus:outline-[#123B66]" /></label><button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#123B66] py-3 font-semibold text-white hover:bg-[#0B2D50] disabled:opacity-60">{busy && <LoaderCircle size={18} className="animate-spin" />} {busy ? "Signing in…" : "Sign in"}</button><Link href="/" className="block text-center text-sm text-[#123B66] underline">Return to homepage</Link></form></section></main>;
}
