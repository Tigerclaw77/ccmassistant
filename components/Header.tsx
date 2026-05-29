"use client";

import Link from "next/link";

export default function Header() {
  function setTheme(theme: string) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }

  return (
    <div className="w-full border-b px-6 py-3 flex items-center justify-between">
      {/* Left */}
      <div className="font-semibold text-lg">
        CCM Assistant
      </div>

      {/* Middle */}
      <div className="flex gap-6 text-sm">
        <Link href="/dashboard/worklist">Worklist</Link>
        <Link href="/dashboard/billing">Billing</Link>
        <Link href="/patients">Patients</Link>
      </div>

      {/* Right */}
      <div className="flex gap-2">
        <button onClick={() => setTheme("clinical")} className="border px-2 py-1 rounded">
          Clinical
        </button>
        <button onClick={() => setTheme("dark")} className="border px-2 py-1 rounded">
          Dark
        </button>
      </div>
    </div>
  );
}
