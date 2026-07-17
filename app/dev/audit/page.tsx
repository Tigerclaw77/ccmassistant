import { notFound } from "next/navigation";
import DevelopmentAuditHub from "../../../components/dev/DevelopmentAuditHub";
import { isDevelopmentAuditEnabled } from "../../../lib/development-audit";

export const dynamic = "force-dynamic";

export default function DevelopmentAuditPage() {
  if (!isDevelopmentAuditEnabled()) notFound();
  return <DevelopmentAuditHub />;
}
