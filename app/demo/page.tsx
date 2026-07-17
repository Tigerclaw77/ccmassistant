import { ArrowLeft, PlayCircle } from "lucide-react";
import Link from "next/link";

export default function DemoPage() {
  return (
    <main className="flex min-h-[calc(100svh-65px)] items-center justify-center bg-[#f4f7f7] px-5 py-12">
      <section className="surface w-full max-w-2xl p-7 text-center sm:p-10">
        <span className="mx-auto inline-flex size-12 items-center justify-center rounded-md bg-teal-50 text-teal-700"><PlayCircle aria-hidden="true" size={26} /></span>
        <p className="eyebrow mt-6">Demo practice</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Guided product demo coming soon</h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-600">This route is reserved for a no-signup demonstration of the coordinator, provider, billing, and management workspaces. It does not contain synthetic patient data yet.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link className="button-primary" href="/request-demo">Request a guided demo</Link>
          <Link className="button-secondary" href="/"><ArrowLeft aria-hidden="true" size={17} /> Back to overview</Link>
        </div>
      </section>
    </main>
  );
}
