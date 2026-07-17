import { CheckCircle2, LockKeyhole } from "lucide-react";
import Link from "next/link";
import BrandMark from "../ui/BrandMark";

export default function AuthShell({
  children,
  description,
  title,
}: {
  children: React.ReactNode;
  description: string;
  title: string;
}) {
  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="auth-title">
        <Link href="/" aria-label="CCM Assistant home">
          <BrandMark />
        </Link>
        <div className="mt-8">
          <p className="eyebrow">Secure practice access</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950" id="auth-title">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        </div>
        <div className="mt-7">{children}</div>
      </section>

      <aside className="auth-assurance" aria-label="Security information">
        <div className="max-w-md">
          <span className="inline-flex size-11 items-center justify-center rounded-md bg-white/10 text-teal-200">
            <LockKeyhole aria-hidden="true" size={23} />
          </span>
          <h2 className="mt-5 text-xl font-semibold text-white">Built for accountable care management</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Secure access, role-aware workspaces, and traceable monthly evidence help your team stay focused on patient care.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-slate-200">
            {[
              "Multi-factor authentication",
              "Practice-scoped access controls",
              "Audit-ready activity history",
            ].map((item) => (
              <li className="flex items-center gap-3" key={item}>
                <CheckCircle2 aria-hidden="true" className="text-teal-300" size={17} />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </main>
  );
}
