import Link from "next/link";
import { Suspense } from "react";
import AuthShell from "../../components/auth/AuthShell";
import LoginForm from "../../components/auth/LoginForm";

export default function LoginPage() {
  return (
    <AuthShell title="Welcome back" description="Sign in to continue to your practice workspace.">
      <Suspense fallback={<div className="text-sm text-slate-600">Preparing secure sign-in...</div>}>
        <LoginForm />
      </Suspense>
      <div className="mt-6 space-y-3 border-t pt-5 text-sm text-slate-600">
        <p><Link className="font-semibold text-teal-700 hover:text-teal-800" href="/forgot-password">Forgot your password?</Link></p>
        <p>Setting up a new practice? <Link className="font-semibold text-teal-700 hover:text-teal-800" href="/signup">Create an owner account</Link>.</p>
      </div>
    </AuthShell>
  );
}
