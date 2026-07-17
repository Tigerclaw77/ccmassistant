import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck2,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  Gauge,
  LockKeyhole,
  MessageSquareText,
  PlayCircle,
  ShieldCheck,
  Stethoscope,
  UsersRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const benefits = [
  {
    icon: Gauge,
    title: "Clear coordinator priorities",
    description: "See which patients need outreach, documentation, or follow-up without rebuilding the day from scattered lists.",
  },
  {
    icon: Stethoscope,
    title: "Focused provider review",
    description: "Bring forward only the clinical decisions, approvals, and care-plan items that need a provider's attention.",
  },
  {
    icon: FileCheck2,
    title: "Evidence-first billing",
    description: "Connect documented work, monthly time, and review history before a patient-month moves to billing.",
  },
];

const workflow = [
  { icon: UsersRound, label: "Organize", text: "Enroll patients and assign the care team." },
  { icon: MessageSquareText, label: "Coordinate", text: "Guide monthly outreach and care-plan work." },
  { icon: ClipboardCheck, label: "Document", text: "Capture time and supporting evidence as work happens." },
  { icon: CalendarCheck2, label: "Review", text: "Confirm readiness before the billing team acts." },
];

export default function HomePage() {
  return (
    <main className="bg-white">
      <section className="hero-band relative isolate overflow-hidden border-b" aria-labelledby="hero-title">
        <Image
          alt="A physician and care coordinator reviewing care-management work together"
          className="object-cover object-center"
          fill
          priority
          sizes="100vw"
          src="/images/ccm-team-hero.png"
        />
        <div className="absolute inset-0 bg-white/12" aria-hidden="true" />
        <div className="relative mx-auto flex h-full max-w-7xl items-center px-5 sm:px-8 lg:px-10">
          <div className="max-w-xl pb-4 pt-8">
            <p className="eyebrow">Chronic care management, organized</p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight text-[#102a2c] sm:text-5xl" id="hero-title">
              CCM Assistant
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-8 text-slate-700">
              Help your practice coordinate monthly CCM work, focus provider attention, and prepare defensible billing evidence in one secure workspace.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link className="button-primary" href="#request-demo">
                Request demo <ArrowRight aria-hidden="true" size={17} />
              </Link>
              <Link className="button-secondary" href="/demo">
                <PlayCircle aria-hidden="true" size={17} /> Watch demo
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-slate-700">
              <span className="flex items-center gap-2"><ShieldCheck aria-hidden="true" className="text-teal-700" size={17} /> Role-aware access</span>
              <span className="flex items-center gap-2"><BadgeCheck aria-hidden="true" className="text-teal-700" size={17} /> Traceable monthly evidence</span>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b bg-[#f4f7f7] py-14 sm:py-18" aria-labelledby="benefits-title">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="max-w-2xl">
            <p className="eyebrow">A calmer monthly workflow</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-950" id="benefits-title">The right work, in the right hands</h2>
            <p className="mt-3 text-base leading-7 text-slate-600">Designed for repeated care-management work where clarity, documentation, and handoffs matter.</p>
          </div>
          <div className="mt-9 grid gap-px overflow-hidden rounded-md border bg-slate-200 md:grid-cols-3">
            {benefits.map(({ icon: Icon, title, description }) => (
              <article className="bg-white p-6" key={title}>
                <span className="inline-flex size-10 items-center justify-center rounded-md bg-teal-50 text-teal-700"><Icon aria-hidden="true" size={21} /></span>
                <h3 className="mt-5 text-lg font-semibold text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b py-16" id="how-it-works" aria-labelledby="workflow-title">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
            <div>
              <p className="eyebrow">How it works</p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-950" id="workflow-title">One path through the month</h2>
              <p className="mt-4 max-w-md text-base leading-7 text-slate-600">CCM Assistant keeps coordinators, providers, billing staff, and practice leaders aligned without giving every role the same screen.</p>
            </div>
            <ol className="grid gap-4 sm:grid-cols-2">
              {workflow.map(({ icon: Icon, label, text }, index) => (
                <li className="surface flex gap-4 p-5" key={label}>
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-[#17383b] text-white"><Icon aria-hidden="true" size={20} /></span>
                  <div>
                    <p className="text-xs font-semibold text-teal-700">0{index + 1}</p>
                    <h3 className="mt-1 font-semibold text-slate-950">{label}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="grid border-b lg:grid-cols-2" id="security">
        <div className="bg-[#17383b] px-5 py-14 text-white sm:px-8 lg:px-[max(2.5rem,calc((100vw-80rem)/2+2.5rem))]">
          <LockKeyhole aria-hidden="true" className="text-teal-300" size={28} />
          <h2 className="mt-5 text-2xl font-semibold">Security that supports the workflow</h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">CCM Assistant is designed around authenticated access, multi-factor verification, role boundaries, practice isolation, and audit history. Practices remain responsible for their own HIPAA policies, agreements, and operational safeguards.</p>
        </div>
        <div className="bg-[#f4f7f7] px-5 py-14 sm:px-8 lg:px-12">
          <p className="eyebrow">Who it is for</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">A shared system with focused workspaces</h2>
          <ul className="mt-5 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
            {["Practice owners and administrators", "Reviewing providers", "CCM coordinators", "Billing and management teams"].map((item) => (
              <li className="flex items-start gap-2" key={item}><CheckCircle2 aria-hidden="true" className="mt-0.5 shrink-0 text-teal-700" size={17} />{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-white py-16" id="request-demo">
        <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-7 px-5 sm:px-8 md:flex-row md:items-center">
          <div>
            <p className="eyebrow">For pilot practices</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-950">See how CCM Assistant fits your team</h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">Request a guided walkthrough focused on your coordinators, providers, and monthly review process.</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Link className="button-primary" href="/request-demo">Request demo</Link>
            <Link className="button-secondary" href="/login">Sign in</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
