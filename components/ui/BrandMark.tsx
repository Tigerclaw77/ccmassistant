import { HeartPulse } from "lucide-react";

export default function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-teal-700 text-white shadow-sm">
        <HeartPulse aria-hidden="true" size={20} strokeWidth={2.2} />
      </span>
      {compact ? null : (
        <span className="font-semibold text-slate-950">CCM Assistant</span>
      )}
    </span>
  );
}
