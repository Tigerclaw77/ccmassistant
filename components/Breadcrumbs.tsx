import Link from "next/link";

type BreadcrumbItem = {
  href?: string;
  label: string;
};

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-slate-600">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => (
          <li className="flex items-center gap-2" key={`${item.label}-${index}`}>
            {index > 0 ? <span className="text-slate-400">/</span> : null}
            {item.href ? (
              <Link className="hover:text-slate-950 hover:underline" href={item.href}>
                {item.label}
              </Link>
            ) : (
              <span className="text-slate-950">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
