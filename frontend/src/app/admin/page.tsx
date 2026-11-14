"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    AlertCircle,
    BarChart3,
    CheckCircle2,
    CircleDot,
    Clock3,
    FileText,
    Home,
    History,
    LoaderCircle,
    RefreshCw,
    ShieldAlert,
    ShieldCheck,
    Workflow,
} from "lucide-react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

const API_BASE_URL = "";

async function adminFetch(url: string, options: RequestInit = {}) {
    const response = await fetch(url, { ...options, credentials: "include", cache: "no-store" });
    if (response.status === 401) {
        window.location.replace("/admin/login?reason=expired");
        throw new Error("Session expired. Please sign in again.");
    }
    return response;
}
const STATUS_OPTIONS = ["Pending", "In Progress", "Resolved"] as const;
const CHART_COLORS = ["#123B66", "#F28C28", "#2878B5", "#2E8B57", "#7656A8", "#C8553D"];

type DistributionItem = { count: number };
type CategoryDistribution = DistributionItem & { category: string };
type DepartmentDistribution = DistributionItem & { department: string };
type PriorityDistribution = DistributionItem & { priority: string };

type Analytics = {
    total_grievances: number;
    status_summary: { pending: number; in_progress: number; resolved: number };
    category_distribution: CategoryDistribution[];
    department_distribution: DepartmentDistribution[];
    priority_distribution: PriorityDistribution[];
};

type Grievance = {
    grievance_id: string;
    complaint: string;
    category: string;
    department: string;
    priority: string | null;
    status: string | null;
    created_at: string | null;
};

type GrievanceList = { total: number; grievances: Grievance[] };

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function isDistribution(value: unknown, key: string): boolean {
    return Array.isArray(value) && value.every(
        (item) => isRecord(item) && typeof item[key] === "string" && typeof item.count === "number",
    );
}

function isAnalytics(value: unknown): value is Analytics {
    if (!isRecord(value) || !isRecord(value.status_summary)) return false;
    return (
        typeof value.total_grievances === "number" &&
        typeof value.status_summary.pending === "number" &&
        typeof value.status_summary.in_progress === "number" &&
        typeof value.status_summary.resolved === "number" &&
        isDistribution(value.category_distribution, "category") &&
        isDistribution(value.department_distribution, "department") &&
        isDistribution(value.priority_distribution, "priority")
    );
}

function isGrievanceList(value: unknown): value is GrievanceList {
    if (!isRecord(value) || typeof value.total !== "number" || !Array.isArray(value.grievances)) return false;
    return value.grievances.every((item) => {
        if (!isRecord(item)) return false;
        return ["grievance_id", "complaint", "category", "department"].every(
            (key) => typeof item[key] === "string",
        ) && ["priority", "status", "created_at"].every(
            (key) => item[key] === null || typeof item[key] === "string",
        );
    });
}

async function apiError(response: Response, fallback: string): Promise<Error> {
    const data: unknown = await response.json().catch(() => null);
    const detail = isRecord(data) && typeof data.detail === "string" ? data.detail : fallback;
    return new Error(`${detail} (HTTP ${response.status})`);
}

function formatDate(value: string | null): string {
    if (!value) return "Not available";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Not available";
    return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(date);
}

function statusClasses(status: string | null): string {
    if (status === "Resolved") return "border-green-200 bg-green-50 text-green-800";
    if (status === "In Progress") return "border-blue-200 bg-blue-50 text-blue-800";
    return "border-amber-200 bg-amber-50 text-amber-800";
}

export default function AdminDashboardPage() {
    const router = useRouter();
    const [section, setSection] = useState<"overview" | "activity">("overview");
    const [authenticated, setAuthenticated] = useState(false);
    const [sessionError, setSessionError] = useState("");
    const [loggingOut, setLoggingOut] = useState(false);
    useEffect(() => {
        const controller = new AbortController();
        async function validate() {
            try {
                const response = await adminFetch("/api/admin/me", { signal: controller.signal });
                if (!response.ok) throw new Error("Unable to validate your session. Reload to retry.");
                setAuthenticated(true);
            } catch (err) {
                if (!controller.signal.aborted) setSessionError(err instanceof Error ? err.message : "Session validation failed.");
            }
        }
        void validate();
        const timer = window.setInterval(() => void validate(), 30000);
        window.addEventListener("focus", validate);
        return () => { controller.abort(); window.clearInterval(timer); window.removeEventListener("focus", validate); };
    }, []);

    async function logout() {
        setLoggingOut(true);
        try {
            const response = await adminFetch("/api/admin/logout", { method: "POST" });
            if (!response.ok) throw new Error("Logout failed. Please try again.");
            setAuthenticated(false);
            router.replace("/admin/login?reason=logout");
        } catch (err) { setError(err instanceof Error ? err.message : "Logout failed."); }
        finally { setLoggingOut(false); }
    }
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [grievances, setGrievances] = useState<Grievance[]>([]);
    const [categoryFilter, setCategoryFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [updateMessage, setUpdateMessage] = useState("");

    const loadDashboard = useCallback(async (signal?: AbortSignal) => {
        if (!authenticated) return;
        setIsLoading(true);
        setError("");

        const params = new URLSearchParams();
        if (categoryFilter) params.set("category", categoryFilter);
        if (statusFilter) params.set("status", statusFilter);
        const listUrl = `${API_BASE_URL}/api/grievances/${params.size ? `?${params}` : ""}`;

        try {
            const [summaryResponse, listResponse] = await Promise.all([
                adminFetch(`${API_BASE_URL}/api/admin/analytics/summary`, { signal }),
                adminFetch(listUrl, { signal }),
            ]);
            if (!summaryResponse.ok) throw await apiError(summaryResponse, "Unable to load dashboard analytics.");
            if (!listResponse.ok) throw await apiError(listResponse, "Unable to load grievances.");

            const [summaryData, listData]: [unknown, unknown] = await Promise.all([
                summaryResponse.json(),
                listResponse.json(),
            ]);
            if (!isAnalytics(summaryData) || !isGrievanceList(listData)) {
                throw new Error("The API returned an unexpected dashboard response.");
            }
            setAnalytics(summaryData);
            setGrievances(listData.grievances);
        } catch (loadError) {
            if (loadError instanceof DOMException && loadError.name === "AbortError") return;
            setError(
                loadError instanceof TypeError
                    ? "Could not connect to the GrievanceAI API. Confirm that FastAPI is running."
                    : loadError instanceof Error
                        ? loadError.message
                        : "Unable to load the dashboard.",
            );
        } finally {
            if (!signal?.aborted) setIsLoading(false);
        }
    }, [categoryFilter, statusFilter, authenticated]);

    useEffect(() => {
        const controller = new AbortController();
        const task = window.setTimeout(() => void loadDashboard(controller.signal), 0);
        return () => {
            window.clearTimeout(task);
            controller.abort();
        };
    }, [loadDashboard]);

    const categories = useMemo(
        () => analytics?.category_distribution.map((item) => item.category).sort() ?? [],
        [analytics],
    );

    async function updateStatus(grievanceId: string, newStatus: string) {
        if (!STATUS_OPTIONS.includes(newStatus as (typeof STATUS_OPTIONS)[number])) return;
        setUpdatingId(grievanceId);
        setError("");
        setUpdateMessage("");
        try {
            const response = await adminFetch(
                `${API_BASE_URL}/api/grievances/${encodeURIComponent(grievanceId)}/status`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: newStatus }),
                },
            );
            if (!response.ok) throw await apiError(response, "Unable to update grievance status.");
            const data: unknown = await response.json();
            if (!isRecord(data) || data.grievance_id !== grievanceId || data.new_status !== newStatus) {
                throw new Error("The API returned an unexpected status update response.");
            }
            setUpdateMessage(`${grievanceId} updated to ${newStatus}.`);
            await loadDashboard();
        } catch (updateError) {
            setError(
                updateError instanceof TypeError
                    ? "Could not connect to the API while updating the status."
                    : updateError instanceof Error
                        ? updateError.message
                        : "Unable to update grievance status.",
            );
        } finally {
            setUpdatingId(null);
        }
    }

    const cards = [
        { label: "Total Grievances", value: analytics?.total_grievances ?? 0, icon: FileText, color: "bg-blue-50 text-[#123B66]" },
        { label: "Pending", value: analytics?.status_summary.pending ?? 0, icon: Clock3, color: "bg-amber-50 text-amber-700" },
        { label: "In Progress", value: analytics?.status_summary.in_progress ?? 0, icon: Workflow, color: "bg-sky-50 text-sky-700" },
        { label: "Resolved", value: analytics?.status_summary.resolved ?? 0, icon: CheckCircle2, color: "bg-green-50 text-green-700" },
    ];

    if (!authenticated) return <main className="flex min-h-screen items-center justify-center bg-[#F7F9FC] p-6 text-[#123B66]"><p role="status">{sessionError || "Checking your admin session…"}</p></main>;

    return (
        <main className="min-h-screen bg-[#F7F9FC] text-slate-800">
            <div className="bg-[#0B2D50] text-white">
                <div className="mx-auto flex max-w-[1500px] flex-col justify-between gap-1 px-5 py-2 text-xs sm:flex-row sm:items-center">
                    <p>GrievanceAI Administrative Workspace</p>
                    <p>Educational prototype • Administrator access</p>
                </div>
            </div>

            <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
                <nav className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-5 py-4" aria-label="Admin navigation">
                    <Link href="/" className="flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-[#123B66]">
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#123B66] text-white"><ShieldCheck size={24} aria-hidden="true" /></span>
                        <span><span className="block text-xl font-bold text-[#123B66]">GrievanceAI</span><span className="block text-[10px] tracking-wider text-slate-500">ADMIN DASHBOARD</span></span>
                    </Link>
                    <div className="flex gap-3"><Link href="/" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-[#123B66] hover:bg-blue-50"><Home size={17} aria-hidden="true" />Home</Link><button onClick={() => void logout()} disabled={loggingOut} className="rounded-lg bg-[#123B66] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{loggingOut ? "Logging out…" : "Log out"}</button></div>
                </nav>
            </header>

            <div className="mx-auto max-w-[1500px] space-y-8 px-5 py-8 sm:py-10">
                <section className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                    <div>
                        <p className="text-sm font-bold tracking-widest text-[#C7670E]">ADMINISTRATION</p>
                        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#123B66] sm:text-4xl">Grievance Dashboard</h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Monitor submitted grievances, review operational trends, and update recorded workflow statuses.</p>
                    </div>
                    {section === "overview" && <button type="button" onClick={() => void loadDashboard()} disabled={isLoading} className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-[#123B66] bg-white px-4 py-2.5 text-sm font-semibold text-[#123B66] hover:bg-blue-50 disabled:opacity-50">
                        <RefreshCw size={17} className={isLoading ? "animate-spin" : ""} aria-hidden="true" />Refresh data
                    </button>}
                </section>

                <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="note">
                    <ShieldAlert size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
                    <p><strong>Administrator workspace:</strong> Signed-in access is required. This educational prototype uses fictional data.</p>
                </div>

                {error && <div role="alert" className="flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><span className="flex items-start gap-3"><AlertCircle size={20} className="mt-0.5 shrink-0" aria-hidden="true" />{error}</span><button type="button" onClick={() => void loadDashboard()} className="shrink-0 font-semibold underline">Retry</button></div>}
                {updateMessage && <div role="status" className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800"><CheckCircle2 size={19} aria-hidden="true" />{updateMessage}</div>}

                <nav aria-label="Dashboard sections" className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2">
                    {([ ["overview", "Overview & Grievances", BarChart3], ["activity", "Activity Logs", History] ] as const).map(([value, label, Icon]) => (
                        <button key={value} type="button" aria-pressed={section === value} onClick={() => setSection(value)} className={`inline-flex items-center gap-2 rounded-lg border-b-2 px-4 py-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-[#123B66] ${section === value ? "border-[#F28C28] bg-[#123B66] text-white" : "border-transparent text-[#123B66] hover:bg-slate-50"}`}><Icon size={18} aria-hidden="true" />{label}</button>
                    ))}
                </nav>

                {section === "activity" ? <ActivityLogs /> : <>
                <section aria-label="Grievance overview" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {cards.map(({ label, value, icon: Icon, color }) => (
                        <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between gap-3"><span className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}><Icon size={22} aria-hidden="true" /></span>{isLoading && !analytics && <LoaderCircle size={18} className="animate-spin text-slate-400" aria-hidden="true" />}</div>
                            <p className="mt-5 text-3xl font-extrabold text-[#123B66]">{isLoading && !analytics ? "—" : value}</p>
                            <p className="mt-1 text-sm font-medium text-slate-500">{label}</p>
                        </article>
                    ))}
                </section>

                {analytics && analytics.total_grievances > 0 ? (
                    <section aria-label="Grievance analytics" className="grid gap-6 xl:grid-cols-2">
                        <ChartCard title="Category Distribution" subtitle="Grievances grouped by predicted category">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={analytics.category_distribution} margin={{ top: 10, right: 10, left: -18, bottom: 48 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <XAxis dataKey="category" angle={-25} textAnchor="end" interval={0} tick={{ fontSize: 11 }} />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                    <Tooltip /><Bar dataKey="count" name="Grievances" fill="#123B66" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        <ChartCard title="Priority Distribution" subtitle="Current priority mix across all grievances">
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart><Pie data={analytics.priority_distribution} dataKey="count" nameKey="priority" innerRadius={58} outerRadius={95} paddingAngle={3} label={({ name, value }) => `${name}: ${value}`}>
                                    {analytics.priority_distribution.map((item, index) => <Cell key={item.priority} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                                </Pie><Tooltip /><Legend /></PieChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        <div className="xl:col-span-2">
                            <ChartCard title="Department Distribution" subtitle="Grievances routed to each suggested department">
                                <div className="space-y-4 pt-3">
                                    {analytics.department_distribution.map((item, index) => {
                                        const percent = analytics.total_grievances ? (item.count / analytics.total_grievances) * 100 : 0;
                                        return <div key={item.department}><div className="mb-2 flex items-end justify-between gap-4 text-sm"><span className="font-medium text-slate-700">{item.department}</span><span className="shrink-0 font-bold text-[#123B66]">{item.count} <span className="font-normal text-slate-400">({percent.toFixed(0)}%)</span></span></div><div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} /></div></div>;
                                    })}
                                </div>
                            </ChartCard>
                        </div>
                    </section>
                ) : !isLoading && !error ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><BarChart3 size={34} className="mx-auto text-slate-400" aria-hidden="true" /><h2 className="mt-4 font-bold text-[#123B66]">No analytics available</h2><p className="mt-2 text-sm text-slate-500">Analytics will appear after grievances are submitted.</p></div>
                ) : null}

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-labelledby="management-heading">
                    <div className="flex flex-col justify-between gap-5 border-b border-slate-200 p-5 sm:p-6 lg:flex-row lg:items-end">
                        <div><h2 id="management-heading" className="text-xl font-bold text-[#123B66]">Grievance Management</h2><p className="mt-1 text-sm text-slate-500">{isLoading ? "Loading records…" : `${grievances.length} record${grievances.length === 1 ? "" : "s"} shown`}</p></div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <label className="text-xs font-semibold text-slate-600">Category<select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="mt-1 block w-full min-w-48 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal text-slate-800 outline-none focus:border-[#123B66] focus:ring-2 focus:ring-blue-100"><option value="">All categories</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
                            <label className="text-xs font-semibold text-slate-600">Status<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="mt-1 block w-full min-w-44 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal text-slate-800 outline-none focus:border-[#123B66] focus:ring-2 focus:ring-blue-100"><option value="">All statuses</option>{STATUS_OPTIONS.map((status) => <option key={status}>{status}</option>)}</select></label>
                        </div>
                    </div>

                    {isLoading ? (
                        <div role="status" className="flex items-center justify-center gap-3 p-16 text-sm text-slate-600"><LoaderCircle size={22} className="animate-spin text-[#123B66]" aria-hidden="true" />Loading grievances…</div>
                    ) : grievances.length === 0 ? (
                        <div className="p-14 text-center"><CircleDot size={32} className="mx-auto text-slate-400" aria-hidden="true" /><h3 className="mt-4 font-bold text-[#123B66]">No matching grievances</h3><p className="mt-2 text-sm text-slate-500">Change or clear the filters to view other records.</p><button type="button" onClick={() => { setCategoryFilter(""); setStatusFilter(""); }} className="mt-5 text-sm font-semibold text-[#123B66] underline underline-offset-4">Clear filters</button></div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1120px] text-left text-sm">
                                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-4">ID</th><th className="px-5 py-4">Complaint</th><th className="px-5 py-4">Category</th><th className="px-5 py-4">Department</th><th className="px-5 py-4">Priority</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Submitted</th></tr></thead>
                                <tbody className="divide-y divide-slate-100">
                                    {grievances.map((grievance) => <tr key={grievance.grievance_id} className="align-top hover:bg-blue-50/30"><td className="whitespace-nowrap px-5 py-5 font-mono font-semibold text-[#123B66]">{grievance.grievance_id}</td><td className="max-w-sm px-5 py-5"><p className="line-clamp-3 leading-6 text-slate-700" title={grievance.complaint}>{grievance.complaint}</p></td><td className="px-5 py-5 font-medium text-slate-700">{grievance.category}</td><td className="max-w-xs px-5 py-5 leading-6 text-slate-600">{grievance.department}</td><td className="px-5 py-5"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{grievance.priority || "Not set"}</span></td><td className="px-5 py-5"><label className="sr-only" htmlFor={`status-${grievance.grievance_id}`}>Update status for {grievance.grievance_id}</label><select id={`status-${grievance.grievance_id}`} value={grievance.status || "Pending"} disabled={updatingId === grievance.grievance_id} onChange={(event) => void updateStatus(grievance.grievance_id, event.target.value)} className={`rounded-lg border px-3 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-wait ${statusClasses(grievance.status)}`}>{STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}</select>{updatingId === grievance.grievance_id && <LoaderCircle size={15} className="ml-2 inline animate-spin text-[#123B66]" aria-label="Updating status" />}</td><td className="whitespace-nowrap px-5 py-5 text-slate-600">{formatDate(grievance.created_at)}</td></tr>)}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
                </>}
            </div>

            <footer className="mt-8 bg-[#0B2D50] px-5 py-7 text-center text-xs leading-6 text-blue-200">GrievanceAI is an independent educational prototype. Use fictional data only.</footer>
        </main>
    );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
    return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="text-lg font-bold text-[#123B66]">{title}</h2><p className="mt-1 text-sm text-slate-500">{subtitle}</p><div className="mt-5">{children}</div></article>;
}

type ActivityLog = {
    id: number;
    admin_username: string;
    action_type: string;
    grievance_id: string | null;
    previous_status: string | null;
    new_status: string | null;
    created_at: string | null;
};
type ActivityList = { total: number; page: number; limit: number; activity_logs: ActivityLog[] };

const ACTION_LABELS: Record<string, string> = {
    ADMIN_LOGIN: "Admin Login",
    ADMIN_LOGOUT: "Admin Logout",
    ADMIN_LOGIN_FAILED: "Failed Login",
    STATUS_UPDATE: "Status Update",
};

function actionClasses(action: string): string {
    if (action === "ADMIN_LOGIN_FAILED") return "bg-red-50 text-red-800";
    if (action === "ADMIN_LOGIN") return "bg-green-50 text-green-800";
    if (action === "ADMIN_LOGOUT") return "bg-blue-50 text-[#123B66]";
    return "bg-orange-50 text-[#C7670E]";
}

function isActivityList(value: unknown): value is ActivityList {
    if (!isRecord(value) || !Number.isInteger(value.total) || Number(value.total) < 0 ||
        !Number.isInteger(value.page) || !Number.isInteger(value.limit) || !Array.isArray(value.activity_logs)) return false;
    return value.activity_logs.every((item) => isRecord(item) && Number.isInteger(item.id) &&
        typeof item.admin_username === "string" && typeof item.action_type === "string" &&
        ["grievance_id", "previous_status", "new_status", "created_at"].every((key) => item[key] === null || typeof item[key] === "string"));
}

function formatActivityDate(value: string | null): string {
    if (!value) return "Not available";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Not available";
    return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "medium" }).format(date);
}

function ActivityLogs() {
    const [page, setPage] = useState(1);
    const [actionType, setActionType] = useState("");
    const [filterInput, setFilterInput] = useState("");
    const [data, setData] = useState<ActivityList | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [refresh, setRefresh] = useState(0);
    const limit = 10;

    useEffect(() => {
        const controller = new AbortController();
        async function load() {
            setLoading(true);
            setError("");
            const params = new URLSearchParams({ page: String(page), limit: String(limit) });
            if (actionType) params.set("action_type", actionType);
            try {
                const response = await adminFetch(`/api/admin/activity-logs?${params}`, { signal: controller.signal });
                if (!response.ok) throw await apiError(response, "Unable to load activity logs.");
                const result: unknown = await response.json();
                if (!isActivityList(result) || result.page !== page || result.limit !== limit) {
                    throw new Error("The API returned an unexpected activity logs response.");
                }
                if (!controller.signal.aborted) setData(result);
            } catch (err) {
                if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Unable to load activity logs.");
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }
        const task = window.setTimeout(() => void load(), 0);
        return () => { window.clearTimeout(task); controller.abort(); };
    }, [page, actionType, refresh]);

    function applyFilter(value: string) {
        setActionType(value.trim());
        setPage(1);
        setLoading(true);
        setRefresh((current) => current + 1);
    }
    const buttonClass = "rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-[#123B66] hover:bg-blue-50 disabled:opacity-50";

    return <section aria-labelledby="activity-heading" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 sm:p-6 lg:flex-row lg:items-end">
            <div><h2 id="activity-heading" className="flex items-center gap-2 text-xl font-bold text-[#123B66]"><History size={22} aria-hidden="true" />Activity Logs</h2><p className="mt-1 text-sm text-slate-500">Administrative actions, newest first.</p></div>
            <button type="button" disabled={loading} onClick={() => { setLoading(true); setRefresh((current) => current + 1); }} className={`${buttonClass} inline-flex items-center justify-center gap-2`}><RefreshCw size={17} aria-hidden="true" />Refresh logs</button>
        </div>
        <form onSubmit={(event) => { event.preventDefault(); applyFilter(filterInput); }} className="flex flex-wrap items-end gap-3 border-b border-slate-200 bg-slate-50 p-5">
            <label className="text-xs font-semibold text-slate-600">Action type<input list="activity-action-types" value={filterInput} onChange={(event) => setFilterInput(event.target.value)} placeholder="All actions" maxLength={50} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal text-slate-800 focus:outline-[#123B66]" /><datalist id="activity-action-types">{Object.entries(ACTION_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</datalist></label>
            <button type="submit" className="rounded-lg bg-[#123B66] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0B2D50]">Apply filter</button>
            <button type="button" onClick={() => { setFilterInput(""); applyFilter(""); }} className={buttonClass}>Clear</button>
            <p className="w-full text-xs text-slate-500">Select an action or enter an exact action type. Clear to show all actions.</p>
        </form>
        {loading ? <div role="status" className="flex items-center justify-center gap-3 p-16 text-sm text-slate-600"><LoaderCircle size={22} className="animate-spin text-[#123B66]" aria-hidden="true" />Loading activity logs…</div> : error ?
            <div role="alert" className="m-5 flex flex-wrap items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><AlertCircle size={20} aria-hidden="true" /><span>{error}</span><button type="button" onClick={() => { setLoading(true); setRefresh((current) => current + 1); }} className="font-semibold underline">Retry</button></div> : <>
            {data?.activity_logs.length ? <div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-sm">
                <caption className="sr-only">Administrator activity records</caption>
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>{["ID", "Admin", "Action", "Grievance ID", "Previous Status", "New Status", "Date & Time"].map((heading) => <th key={heading} scope="col" className="px-5 py-4">{heading}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-100">{data.activity_logs.map((log) => <tr key={log.id} className="align-top hover:bg-blue-50/30">
                    <td className="px-5 py-5 font-mono font-semibold text-[#123B66]">{log.id}</td>
                    <td className="break-all px-5 py-5 font-medium">{log.admin_username}</td>
                    <td className="px-5 py-5"><span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${actionClasses(log.action_type)}`}>{ACTION_LABELS[log.action_type] ?? log.action_type}</span>{log.action_type === "STATUS_UPDATE" && <p className="mt-1 whitespace-nowrap text-xs text-slate-600">{log.previous_status ?? "Not set"} → {log.new_status ?? "Not set"}</p>}</td>
                    <td className="whitespace-nowrap px-5 py-5 font-mono text-[#123B66]">{log.grievance_id ?? "—"}</td>
                    <td className="whitespace-nowrap px-5 py-5">{log.previous_status ?? "—"}</td>
                    <td className="whitespace-nowrap px-5 py-5"><span className={`rounded-full border px-3 py-1 text-xs font-semibold ${log.new_status ? statusClasses(log.new_status) : "border-slate-200 bg-slate-50 text-slate-600"}`}>{log.new_status ?? "—"}</span></td>
                    <td className="whitespace-nowrap px-5 py-5 text-slate-600">{formatActivityDate(log.created_at)}</td>
                </tr>)}</tbody>
            </table></div> : <div className="p-14 text-center"><History size={32} className="mx-auto text-slate-400" aria-hidden="true" /><h3 className="mt-4 font-bold text-[#123B66]">No activity records found</h3><p className="mt-2 text-sm text-slate-500">No records match this page and filter. Clear the filter or return to an earlier page.</p></div>}
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 p-5">
                <p role="status" className="text-sm text-slate-600">{data?.total ?? 0} matching records · Page {page} of {Math.max(1, Math.ceil((data?.total ?? 0) / limit))}</p>
                <div className="flex gap-2"><button type="button" disabled={page <= 1} onClick={() => { setLoading(true); setPage((current) => current - 1); }} className={buttonClass}>Previous</button><button type="button" disabled={!data || page * limit >= data.total} onClick={() => { setLoading(true); setPage((current) => current + 1); }} className={buttonClass}>Next</button></div>
            </div>
        </>}
    </section>;
}
