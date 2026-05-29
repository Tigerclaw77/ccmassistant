import Link from "next/link";
import { Suspense } from "react";
import SignupForm from "../../components/auth/SignupForm";

export default function SignupPage() {
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Signup</h1>
      <Suspense fallback={<div className="text-sm text-gray-600">Loading...</div>}>
        <SignupForm />
      </Suspense>
      <p className="text-sm text-gray-600">
        Already have an account? <Link className="underline" href="/login">Log in</Link>.
      </p>
    </main>
  );
}
