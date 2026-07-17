import { LoaderCircle } from "lucide-react";

export default function LoadingState({ label = "Loading workspace" }: { label?: string }) {
  return (
    <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-slate-600" role="status">
      <LoaderCircle aria-hidden="true" className="animate-spin text-teal-700" size={20} />
      <span>{label}</span>
    </div>
  );
}
