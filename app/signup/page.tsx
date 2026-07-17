import Link from "next/link";
import { Suspense } from "react";
import AuthShell from "../../components/auth/AuthShell";
import SignupForm from "../../components/auth/SignupForm";

export default function SignupPage() {
  return (
    <AuthShell title="Create your practice owner account" description="Start with the person responsible for practice setup. Additional roles will be added from the practice workspace.">
      <Suspense fallback={<div className="text-sm text-slate-600">Preparing account setup...</div>}>
        <SignupForm />
      </Suspense>
      <p className="mt-6 border-t pt-5 text-sm text-slate-600">Already have access? <Link className="font-semibold text-teal-700 hover:text-teal-800" href="/login">Sign in</Link>.</p>
    </AuthShell>
  );
}
