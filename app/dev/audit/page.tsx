import { notFound, redirect } from "next/navigation";
import { isDevelopmentPersonaEnabled } from "../../../lib/development-persona";

export const dynamic = "force-dynamic";

export default function DevelopmentAuditPage() {
  if (!isDevelopmentPersonaEnabled()) notFound();
  redirect("/dev/personas");
}
