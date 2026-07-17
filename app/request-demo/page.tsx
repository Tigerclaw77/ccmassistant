import { ArrowLeft, CalendarDays, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function RequestDemoPage() {
  return (
    <main className="flex min-h-[calc(100svh-65px)] items-center justify-center bg-[#f4f7f7] px-5 py-12">
      <section className="surface w-full max-w-2xl p-7 sm:p-10">
        <span className="inline-flex size-11 items-center justify-center rounded-md bg-teal-50 text-teal-700"><CalendarDays aria-hidden="true" size={23} /></span>
        <p className="eyebrow mt-6">Pilot walkthrough</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Request a CCM Assistant demo</h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">Demo scheduling is being prepared for pilot practices. Your CCM Assistant implementation contact can arrange a walkthrough in the meantime.</p>
        <ul className="mt-6 space-y-3 text-sm text-slate-700">
          {["Coordinator monthly workflow", "Provider review workspace", "Evidence and billing review", "Practice management visibility"].map((item) => (
            <li className="flex items-center gap-3" key={item}><CheckCircle2 aria-hidden="true" className="text-teal-700" size={17} />{item}</li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link className="button-primary" href="/login">Sign in to an existing practice</Link>
          <Link className="button-secondary" href="/"><ArrowLeft aria-hidden="true" size={17} /> Back to overview</Link>
        </div>
      </section>
    </main>
  );
}
