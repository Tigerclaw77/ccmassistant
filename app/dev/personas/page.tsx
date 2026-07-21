import { notFound } from "next/navigation";
import DevelopmentPersonaHub from "../../../components/dev/DevelopmentPersonaHub";
import { isDevelopmentPersonaEnabled } from "../../../lib/development-persona";

export const dynamic = "force-dynamic";

export default function DevelopmentPersonasPage() {
  if (!isDevelopmentPersonaEnabled()) notFound();
  return <DevelopmentPersonaHub />;
}
