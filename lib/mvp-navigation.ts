import type { AccessRole } from "./ccm/types.ts";

export type MvpNavItem = {
  exact?: boolean;
  href: string;
  label: string;
  match?: string | null;
};

export function navigationForAccessRoles(accessRoles: readonly AccessRole[]): MvpNavItem[] {
  if (!accessRoles.length) return [];

  if (accessRoles.includes("organization_owner") || accessRoles.includes("practice_administrator")) {
    return [
      { href: "/dashboard/worklist", label: "Worklist" },
      { href: "/patients", label: "Patients" },
      { href: "/dashboard/provider", label: "Provider review" },
      { href: "/dashboard/billing", label: "Billing" },
      { href: "/settings", label: "Settings" },
    ];
  }

  if (accessRoles.includes("compliance_administrator")) {
    return [
      { href: "/dashboard/compliance", label: "Compliance" },
      { href: "/patients", label: "Patients" },
    ];
  }

  if (accessRoles.includes("provider")) {
    return [
      { href: "/dashboard/provider", label: "Attention" },
      { href: "/patients", label: "Patients" },
    ];
  }

  if (accessRoles.includes("billing_administrator")) {
    return [{ href: "/dashboard/billing", label: "Billing" }];
  }

  if (accessRoles.includes("front_desk") || accessRoles.includes("read_only")) {
    return [{ href: "/patients", label: "Patients" }];
  }

  if (accessRoles.includes("coordinator") || accessRoles.includes("clinical_staff")) {
    return [
      { href: "/dashboard/worklist", label: "Worklist" },
      { href: "/patients", label: "Patients" },
    ];
  }

  return [];
}
