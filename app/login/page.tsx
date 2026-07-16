import Link from "next/link";
import { Suspense } from "react";
import LoginForm from "../../components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Login</h1>
      <Suspense fallback={<div className="text-sm text-gray-600">Loading...</div>}>
        <LoginForm />
      </Suspense>
      <p className="text-sm text-gray-600">
        New to CCM Assistant? <Link className="underline" href="/signup">Create an account</Link>.
      </p>
      <p className="text-sm text-gray-600">
        <Link className="underline" href="/forgot-password">Forgot password?</Link>
      </p>
    </main>
  );
}
