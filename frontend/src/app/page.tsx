
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  FileText,
  Search,
  ShieldCheck,
  BrainCircuit,
  Building2,
  Clock3,
  CheckCircle2,
  LockKeyhole,
  Phone,
  Mail,
} from "lucide-react";

const services = [
  {
    icon: FileText,
    title: "Submit a Grievance",
    description: "Register your complaint and let our AI system identify its category and appropriate department.",
    href: "/submit",
    action: "Submit complaint",
  },
  {
    icon: Search,
    title: "Track Your Grievance",
    description: "Check the current status and progress of your previously submitted grievance.",
    href: "/track",
    action: "Track complaint",
  },
];

const steps = [
  {
    number: "01",
    title: "Submit",
    description: "Describe your issue in simple language through the online grievance form.",
  },
  {
    number: "02",
    title: "AI Classification",
    description: "The NLP model analyses the complaint and suggests a relevant category.",
  },
  {
    number: "03",
    title: "Department Routing",
    description: "The system recommends the department responsible for handling the issue.",
  },
  {
    number: "04",
    title: "Track Progress",
    description: "Use your grievance ID to check the latest recorded status.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F7F9FC] text-slate-800">
      {/* Top information bar */}
      <div className="bg-[#123B66] text-white">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-2 px-5 py-2 text-xs sm:flex-row sm:items-center">
          <p>AI-Powered Citizen Grievance Management Prototype</p>
          <p>Accessible • Transparent • Efficient</p>
        </div>
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#123B66] text-white">
              <ShieldCheck size={25} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#123B66]">
                GrievanceAI
              </h1>
              <p className="text-[10px] tracking-wider text-slate-500">
                INTELLIGENT GRIEVANCE SYSTEM
              </p>
            </div>
          </Link>

          <div className="hidden items-center gap-8 text-sm font-medium md:flex">
            <Link href="/" className="text-[#123B66]">Home</Link>
            <a href="#services" className="transition hover:text-[#F28C28]">Services</a>
            <a href="#how-it-works" className="transition hover:text-[#F28C28]">How It Works</a>
            <a href="#about" className="transition hover:text-[#F28C28]">About</a>
          </div>

          <Link
            href="/track"
            className="rounded-lg bg-[#123B66] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0B2D50]"
          >
            Track Grievance
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-white">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-blue-50 blur-3xl" />
        <div className="absolute -bottom-40 -left-20 h-80 w-80 rounded-full bg-orange-50 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 md:grid-cols-2 md:py-28">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-semibold text-[#123B66]">
              <BrainCircuit size={15} />
              AI-POWERED GRIEVANCE MANAGEMENT
            </div>

            <h2 className="max-w-2xl text-4xl font-extrabold leading-tight tracking-tight text-[#123B66] sm:text-5xl lg:text-6xl">
              Your Voice Matters.
              <span className="mt-2 block text-[#F28C28]">
                We Help Route It.
              </span>
            </h2>

            <p className="mt-6 max-w-xl text-base leading-8 text-slate-600">
              A smarter way to submit and track public-service grievances.
              Our AI-powered system analyses complaints and recommends the
              appropriate department for review.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                href="/submit"
                className="inline-flex items-center gap-2 rounded-lg bg-[#123B66] px-6 py-3.5 font-semibold text-white shadow-lg shadow-blue-900/15 transition hover:-translate-y-0.5 hover:bg-[#0B2D50]"
              >
                Submit a Grievance <ArrowRight size={18} />
              </Link>
              <Link
                href="/track"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-3.5 font-semibold text-[#123B66] transition hover:border-[#123B66]"
              >
                Track Status <Search size={18} />
              </Link>
            </div>

            <div className="mt-9 flex flex-wrap gap-6 text-sm text-slate-500">
              <span className="flex items-center gap-2">
                <ShieldCheck size={17} className="text-green-600" />
                Simple submission
              </span>
              <span className="flex items-center gap-2">
                <BrainCircuit size={17} className="text-[#F28C28]" />
                AI-assisted routing
              </span>
            </div>
          </div>

          {/* Hero illustration */}
          <div className="relative mx-auto w-full max-w-lg">
            <div className="rounded-3xl border border-slate-200 bg-[#F7F9FC] p-6 shadow-xl shadow-slate-200/70 sm:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500">GRIEVANCE PROCESS</p>
                  <h3 className="mt-1 text-xl font-bold text-[#123B66]">Smart Resolution Flow</h3>
                </div>
                <div className="rounded-xl bg-blue-100 p-3 text-[#123B66]">
                  <BrainCircuit size={28} />
                </div>
              </div>

              <div className="mt-8 space-y-5">
                {[
                  { icon: FileText, title: "Complaint Submitted", subtitle: "Citizen grievance received", color: "bg-blue-100 text-blue-700" },
                  { icon: BrainCircuit, title: "AI Classification", subtitle: "Category prediction completed", color: "bg-orange-100 text-orange-700" },
                  { icon: Building2, title: "Department Suggested", subtitle: "Recommended for review", color: "bg-purple-100 text-purple-700" },
                  { icon: CheckCircle2, title: "Status Tracking", subtitle: "Monitor grievance progress", color: "bg-green-100 text-green-700" },
                ].map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="flex items-center gap-4">
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${item.color}`}>
                        <Icon size={22} />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-[#123B66]">{item.title}</p>
                        <p className="mt-1 text-xs text-slate-500">{item.subtitle}</p>
                      </div>
                      <span className="text-xs font-semibold text-slate-400">0{index + 1}</span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 rounded-xl border border-blue-100 bg-white p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#123B66]">
                  <Clock3 size={17} />
                  Transparent status updates
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Follow the recorded progress of your grievance using its unique ID.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="mx-auto max-w-7xl px-5 py-20">
        <div className="text-center">
          <p className="text-sm font-bold tracking-widest text-[#F28C28]">OUR SERVICES</p>
          <h2 className="mt-3 text-3xl font-bold text-[#123B66] sm:text-4xl">
            How Can We Help You?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-500">
            Access the services you need through a simple and user-friendly platform.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <Link
                key={service.title}
                href={service.href}
                className="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-[#123B66] transition group-hover:bg-[#123B66] group-hover:text-white">
                  <Icon size={27} />
                </div>
                <h3 className="mt-6 text-xl font-bold text-[#123B66]">{service.title}</h3>
                <p className="mt-3 min-h-16 leading-7 text-slate-500">
                  {service.description}
                </p>
                <div className="mt-6 flex items-center gap-2 font-semibold text-[#F28C28]">
                  {service.action} <ArrowUpRight size={18} />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-[#123B66] py-20 text-white">
        <div className="mx-auto max-w-7xl px-5">
          <div className="text-center">
            <p className="text-sm font-bold tracking-widest text-orange-300">SIMPLE PROCESS</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">How GrievanceAI Works</h2>
            <p className="mx-auto mt-4 max-w-2xl leading-7 text-blue-100">
              From complaint submission to department recommendation, understand every step.
            </p>
          </div>

          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <div key={step.number} className="rounded-2xl border border-white/15 bg-white/5 p-6">
                <p className="text-3xl font-extrabold text-orange-300">{step.number}</p>
                <h3 className="mt-5 text-lg font-bold">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-blue-100">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="mx-auto max-w-7xl px-5 py-20">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <p className="text-sm font-bold tracking-widest text-[#F28C28]">ABOUT THE PROJECT</p>
            <h2 className="mt-3 text-3xl font-bold text-[#123B66]">
              Technology Supporting Better Grievance Management
            </h2>
            <p className="mt-5 leading-8 text-slate-600">
              GrievanceAI is an independent prototype demonstrating how natural
              language processing can help classify citizen complaints and
              recommend suitable departments.
            </p>
            <p className="mt-4 leading-8 text-slate-600">
              The system supports grievance tracking and administrative review.
              AI predictions are suggestions and do not replace human decisions.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-orange-50 p-3 text-[#F28C28]">
                <ShieldCheck size={28} />
              </div>
              <div>
                <h3 className="font-bold text-[#123B66]">Responsible AI Approach</h3>
                <p className="mt-1 text-sm text-slate-500">Human review remains important</p>
              </div>
            </div>
            <div className="my-6 h-px bg-slate-100" />
            <ul className="space-y-4 text-sm text-slate-600">
              <li className="flex gap-3"><CheckCircle2 className="shrink-0 text-green-600" size={19} /> AI-assisted complaint classification</li>
              <li className="flex gap-3"><CheckCircle2 className="shrink-0 text-green-600" size={19} /> Suggested department routing</li>
              <li className="flex gap-3"><CheckCircle2 className="shrink-0 text-green-600" size={19} /> Manual review for uncertain predictions</li>
              <li className="flex gap-3"><CheckCircle2 className="shrink-0 text-green-600" size={19} /> Grievance status tracking</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0B2D50] text-white">
        <div className="mx-auto max-w-7xl px-5 py-12">
          <div className="grid gap-10 md:grid-cols-3">
            <div>
              <h2 className="text-2xl font-bold">GrievanceAI</h2>
              <p className="mt-3 max-w-sm text-sm leading-7 text-blue-100">
                An AI-powered citizen grievance classification and intelligent routing prototype.
              </p>
            </div>
            <div>
              <h3 className="font-semibold">Quick Links</h3>
              <div className="mt-4 flex flex-col gap-3 text-sm text-blue-100">
                <Link href="/submit" className="hover:text-orange-300">Submit a Grievance</Link>
                <Link href="/track" className="hover:text-orange-300">Track a Grievance</Link>
                <a href="#how-it-works" className="hover:text-orange-300">How It Works</a>
                <Link href="/admin/login" className="inline-flex w-fit items-center gap-2 rounded-sm hover:text-orange-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-300">
                  <LockKeyhole size={14} aria-hidden="true" />
                  Admin Login
                </Link>
              </div>
            </div>
            <div>
              <h3 className="font-semibold">Project Information</h3>
              <p className="mt-4 text-sm leading-7 text-blue-100">
                This is an independent educational prototype. It is not an official
                government or UIDAI service.
              </p>
            </div>
          </div>

          <div className="mt-10 border-t border-white/15 pt-6 text-center text-xs text-blue-200">
            © {new Date().getFullYear()} GrievanceAI. Independent prototype for educational purposes.
          </div>
        </div>
      </footer>
    </main>
  );
}
