export const PATIENT_COMMUNICATION_KINDS = [
  "program_invitation",
  "checkin_invitation",
  "checkin_reminder",
  "checkin_followup",
  "checkin_completed",
  "enrollment_confirmed",
  "password_reset",
  "account_verification",
] as const;

export type PatientCommunicationKind = (typeof PATIENT_COMMUNICATION_KINDS)[number];

export type PatientCommunicationVariables = {
  actionUrl: string;
  patientFirstName?: string | null;
  practiceName: string;
  supportEmail?: string | null;
  supportPhone?: string | null;
};

export type PatientCommunicationTemplate = {
  kind: PatientCommunicationKind;
  subject: string;
  preheader: string;
  heading: string;
  paragraphs: string[];
  actionLabel: string;
  reassurance: string;
};

export const PATIENT_COMMUNICATION_TEMPLATES: Record<PatientCommunicationKind, PatientCommunicationTemplate> = {
  program_invitation: {
    kind: "program_invitation",
    subject: "An invitation from {{practiceName}}",
    preheader: "Learn about monthly support from your care team.",
    heading: "Your care team is inviting you to chronic care management",
    paragraphs: [
      "{{practiceName}} offers monthly support for people managing two or more ongoing health conditions.",
      "Your care team can explain what is included, any cost you may have, and how to stop participating. Joining is your choice.",
    ],
    actionLabel: "Review the invitation",
    reassurance: "This message does not replace urgent or emergency care.",
  },
  checkin_invitation: {
    kind: "checkin_invitation",
    subject: "Your monthly check-in from {{practiceName}}",
    preheader: "Tell your care team how you have been doing.",
    heading: "It is time for your monthly check-in",
    paragraphs: [
      "Please answer a few questions about your health, medications, and care needs.",
      "Your answers go to your care team at {{practiceName}}. Use the secure button below instead of replying to this email.",
    ],
    actionLabel: "Start secure check-in",
    reassurance: "If you have urgent symptoms, call your care team or seek emergency help. Do not wait for a reply to this check-in.",
  },
  checkin_reminder: {
    kind: "checkin_reminder",
    subject: "Reminder: complete your monthly check-in",
    preheader: "Your secure check-in is still waiting.",
    heading: "Your care team is waiting to hear from you",
    paragraphs: [
      "Your monthly check-in for {{practiceName}} has not been completed yet.",
      "Please use the secure button below. If you already completed it, you can ignore this reminder.",
    ],
    actionLabel: "Complete check-in",
    reassurance: "Need help? Contact {{practiceName}} using the information below.",
  },
  checkin_followup: {
    kind: "checkin_followup",
    subject: "We still need your monthly check-in",
    preheader: "Please respond or contact your care team.",
    heading: "Please check in with your care team",
    paragraphs: [
      "We have not received your monthly check-in.",
      "Use the secure button below, or contact {{practiceName}} if you would rather speak with someone.",
    ],
    actionLabel: "Open secure check-in",
    reassurance: "This inbox is not monitored for urgent medical needs.",
  },
  checkin_completed: {
    kind: "checkin_completed",
    subject: "Your check-in was received",
    preheader: "Thank you. Your care team can now review your answers.",
    heading: "Thank you for checking in",
    paragraphs: [
      "{{practiceName}} received your monthly check-in.",
      "Your care team will review your answers and contact you if follow-up is needed.",
    ],
    actionLabel: "View contact information",
    reassurance: "Submitting a check-in does not create an emergency response. Seek immediate help for urgent symptoms.",
  },
  enrollment_confirmed: {
    kind: "enrollment_confirmed",
    subject: "Your chronic care management enrollment",
    preheader: "Monthly support from {{practiceName}} is now active.",
    heading: "Your monthly care support is active",
    paragraphs: [
      "You are enrolled in chronic care management with {{practiceName}}.",
      "Your care team may contact you each month to review your health, medications, goals, and care needs. Contact the practice with questions or if you want to stop participating.",
    ],
    actionLabel: "View care information",
    reassurance: "Keep using your usual urgent and emergency care options when needed.",
  },
  password_reset: {
    kind: "password_reset",
    subject: "Reset your CCM Assistant password",
    preheader: "Use this secure link to choose a new password.",
    heading: "Reset your password",
    paragraphs: [
      "A password reset was requested for your CCM Assistant account.",
      "Use the button below to choose a new password. If you did not request this, do not use the link and contact your administrator.",
    ],
    actionLabel: "Reset password",
    reassurance: "CCM Assistant staff will never ask for your password or verification code.",
  },
  account_verification: {
    kind: "account_verification",
    subject: "Verify your CCM Assistant account",
    preheader: "Confirm your email address to finish account setup.",
    heading: "Verify your email address",
    paragraphs: [
      "Use the button below to confirm your email and continue setting up your CCM Assistant account.",
      "If you did not expect this invitation, do not verify the account and contact your administrator.",
    ],
    actionLabel: "Verify email",
    reassurance: "CCM Assistant staff will never ask for your password or verification code.",
  },
};

export const FUTURE_SMS_PLACEHOLDERS = [
  { kind: "checkin_invitation", status: "not_enabled", purpose: "Secure check-in invitation" },
  { kind: "checkin_reminder", status: "not_enabled", purpose: "Check-in reminder" },
  { kind: "checkin_completed", status: "not_enabled", purpose: "Completion confirmation" },
] as const;

function valueOrFallback(value: string | null | undefined, fallback: string): string {
  return value?.trim() || fallback;
}

function interpolate(value: string, variables: PatientCommunicationVariables): string {
  return value
    .replaceAll("{{practiceName}}", variables.practiceName)
    .replaceAll("{{patientFirstName}}", valueOrFallback(variables.patientFirstName, "there"));
}

function supportLine(variables: PatientCommunicationVariables): string {
  const parts = [variables.supportPhone, variables.supportEmail].filter(Boolean);
  return parts.length ? `Questions? Contact ${variables.practiceName}: ${parts.join(" or ")}.` : `Questions? Contact ${variables.practiceName}.`;
}

export function renderPatientCommunicationText(
  kind: PatientCommunicationKind,
  variables: PatientCommunicationVariables,
): { subject: string; text: string } {
  const template = PATIENT_COMMUNICATION_TEMPLATES[kind];
  const greeting = `Hello ${valueOrFallback(variables.patientFirstName, "there")},`;
  const paragraphs = template.paragraphs.map((paragraph) => interpolate(paragraph, variables));
  return {
    subject: interpolate(template.subject, variables),
    text: [
      greeting,
      "",
      interpolate(template.heading, variables),
      "",
      ...paragraphs.flatMap((paragraph) => [paragraph, ""]),
      `${template.actionLabel}: ${variables.actionUrl}`,
      "",
      interpolate(template.reassurance, variables),
      supportLine(variables),
    ].join("\n"),
  };
}
