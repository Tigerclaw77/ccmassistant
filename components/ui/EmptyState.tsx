import type { LucideIcon } from "lucide-react";
import Link from "next/link";

type EmptyStateProps = {
  actionHref?: string;
  actionLabel?: string;
  description: string;
  icon: LucideIcon;
  title: string;
};

export default function EmptyState({
  actionHref,
  actionLabel,
  description,
  icon: Icon,
  title,
}: EmptyStateProps) {
  return (
    <div className="empty-state">
      <span className="empty-state-icon">
        <Icon aria-hidden="true" size={22} />
      </span>
      <h2 className="mt-4 text-base font-semibold text-slate-950">{title}</h2>
      <p className="mt-1 max-w-lg text-sm leading-6 text-slate-600">{description}</p>
      {actionHref && actionLabel ? (
        <Link className="button-primary mt-5" href={actionHref}>
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
