export type NotificationMessage = {
  body: string;
  containsPhi: boolean;
  recipientId: string;
  subject: string;
};

export interface NotificationProvider {
  send(message: NotificationMessage): Promise<{ externalId: string; status: "queued" | "sent" }>;
}

export type ClinicalReportExportRequest = {
  format: "csv" | "html" | "pdf";
  practiceId: string;
  reportId: string;
  requestedBy: string;
};

export interface ClinicalReportExporter {
  export(request: ClinicalReportExportRequest): Promise<{ artifactId: string; expiresAt: string }>;
}

export type SecureMessage = {
  body: string;
  patientId: string;
  practiceId: string;
  recipientId: string;
  relatedWorkItemId?: string | null;
};

export interface SecureMessageProvider {
  send(message: SecureMessage): Promise<{ externalId: string; status: "queued" | "sent" }>;
}

// Production adapters are intentionally not selected in Founder Review Sprint 1.
// Route handlers depend on these contracts only after a vendor is approved.
