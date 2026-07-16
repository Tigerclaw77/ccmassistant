import type { JsonValue, PatientCondition } from "./types";

export type IntakeDemographics = {
  dateOfBirth: string | null;
  displayName: string;
  email: string | null;
  phone: string | null;
  preferredContactMethod: string | null;
};

export type IntakeInput = {
  chronicConditions: Array<Pick<PatientCondition, "code" | "code_system" | "condition_name">>;
  clinicalNotes: string;
  demographics: IntakeDemographics;
  medications: string;
};

export type IntakeSummary = {
  care_needs: string;
  chronic_conditions: string;
  documentation_notes: string;
  medications: string;
  patient_overview: string;
};

export type IntakeDraft = {
  confidenceScore: number;
  draftSummary: IntakeSummary;
  followUpQuestions: string[];
  generatedBy: "openai" | "fallback";
  missingInformation: string[];
  qualityFlags: string[];
};

export const INTAKE_SUMMARY_PROMPT = `You assist a Chronic Care Management coordinator.
Use only the provided patient intake inputs.
Return JSON only, with this shape:
{
  "draftSummary": {
    "patient_overview": "short editable paragraph",
    "chronic_conditions": "short editable paragraph",
    "medications": "short editable paragraph",
    "care_needs": "short editable paragraph",
    "documentation_notes": "short editable paragraph"
  },
  "missingInformation": ["plain-language missing item"],
  "followUpQuestions": ["plain-language follow-up question"],
  "confidenceScore": 0.0,
  "qualityFlags": ["short quality or safety note"]
}
Do not diagnose, recommend treatment changes, or present the draft as final clinical documentation.
If information is missing, say so plainly.`;

function nonEmpty(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
}

function splitLines(value: string): string[] {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(String).map((item) => item.trim()).filter(Boolean);
}

function normalizeSummary(value: unknown, fallback: IntakeSummary): IntakeSummary {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return fallback;
  }

  const object = value as Record<string, unknown>;

  return {
    care_needs: String(object.care_needs ?? fallback.care_needs),
    chronic_conditions: String(object.chronic_conditions ?? fallback.chronic_conditions),
    documentation_notes: String(
      object.documentation_notes ?? fallback.documentation_notes,
    ),
    medications: String(object.medications ?? fallback.medications),
    patient_overview: String(object.patient_overview ?? fallback.patient_overview),
  };
}

export function intakeInputToJson(input: IntakeInput): JsonValue {
  return {
    chronicConditions: input.chronicConditions.map((condition) => ({
      code: condition.code,
      code_system: condition.code_system,
      condition_name: condition.condition_name,
    })),
    clinicalNotes: input.clinicalNotes,
    demographics: {
      dateOfBirth: input.demographics.dateOfBirth,
      displayName: input.demographics.displayName,
      email: input.demographics.email,
      phone: input.demographics.phone,
      preferredContactMethod: input.demographics.preferredContactMethod,
    },
    medications: input.medications,
  };
}

export function intakeSummaryToJson(summary: IntakeSummary): JsonValue {
  return {
    care_needs: summary.care_needs,
    chronic_conditions: summary.chronic_conditions,
    documentation_notes: summary.documentation_notes,
    medications: summary.medications,
    patient_overview: summary.patient_overview,
  };
}

export function stringArrayToJson(values: string[]): JsonValue {
  return values.map(String);
}

export function fallbackIntakeDraft(input: IntakeInput): IntakeDraft {
  const conditionNames = input.chronicConditions.map((condition) => condition.condition_name);
  const medications = splitLines(input.medications);
  const missingInformation: string[] = [];
  const followUpQuestions: string[] = [];
  const qualityFlags: string[] = ["Draft requires human review before use."];

  if (!nonEmpty(input.demographics.dateOfBirth)) {
    missingInformation.push("Date of birth is missing.");
  }

  if (!nonEmpty(input.demographics.phone) && !nonEmpty(input.demographics.email)) {
    missingInformation.push("A reliable patient contact method is missing.");
    followUpQuestions.push("What is the best phone number or email for monthly CCM contact?");
  }

  if (conditionNames.length < 2) {
    missingInformation.push("At least two qualifying chronic conditions should be documented.");
  }

  if (medications.length === 0) {
    missingInformation.push("Current medication list is missing.");
    followUpQuestions.push("What medications, vitamins, or supplements are you taking now?");
  }

  if (!nonEmpty(input.clinicalNotes)) {
    missingInformation.push("Recent symptoms, goals, barriers, or care concerns are not documented.");
    followUpQuestions.push("What health concerns or daily challenges should the care team know about?");
  }

  if (missingInformation.length === 0) {
    followUpQuestions.push("Has anything changed with symptoms, medications, or care access since the last visit?");
  }

  const summary: IntakeSummary = {
    care_needs: input.clinicalNotes.trim()
      ? `Clinical notes identify these care-management needs or context: ${input.clinicalNotes.trim()}`
      : "Care-management needs require coordinator or provider review because no clinical notes were entered.",
    chronic_conditions: conditionNames.length
      ? `Documented chronic conditions: ${conditionNames.join(", ")}.`
      : "No chronic conditions were documented for this intake.",
    documentation_notes:
      "This is an editable intake draft generated from the current patient record and coordinator-entered notes. It should be reviewed before use in the care plan or billing evidence.",
    medications: medications.length
      ? `Medication list entered for review: ${medications.join(", ")}.`
      : "No current medications were entered.",
    patient_overview: `${input.demographics.displayName || "The patient"} is being reviewed for CCM intake.${input.demographics.dateOfBirth ? ` Date of birth: ${input.demographics.dateOfBirth}.` : ""}`,
  };

  const completenessSignals = [
    nonEmpty(input.demographics.dateOfBirth),
    nonEmpty(input.demographics.phone) || nonEmpty(input.demographics.email),
    conditionNames.length >= 2,
    medications.length > 0,
    nonEmpty(input.clinicalNotes),
  ];
  const confidenceScore =
    completenessSignals.filter(Boolean).length / completenessSignals.length;

  return {
    confidenceScore,
    draftSummary: summary,
    followUpQuestions,
    generatedBy: "fallback",
    missingInformation,
    qualityFlags,
  };
}

function extractJsonObject(value: string): string {
  const first = value.indexOf("{");
  const last = value.lastIndexOf("}");

  if (first === -1 || last === -1 || last <= first) {
    throw new Error("AI response did not contain JSON");
  }

  return value.slice(first, last + 1);
}

export async function generateIntakeDraft(input: IntakeInput): Promise<IntakeDraft> {
  const fallback = fallbackIntakeDraft(input);
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return fallback;
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      body: JSON.stringify({
        messages: [
          { content: INTAKE_SUMMARY_PROMPT, role: "system" },
          { content: JSON.stringify(intakeInputToJson(input)), role: "user" },
        ],
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        response_format: { type: "json_object" },
        temperature: 0.2,
      }),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("AI intake request failed");
    }

    const result = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = result.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("AI intake response was empty");
    }

    const parsed = JSON.parse(extractJsonObject(content)) as Record<string, unknown>;
    const confidenceScore = Number(parsed.confidenceScore ?? fallback.confidenceScore);

    return {
      confidenceScore:
        Number.isFinite(confidenceScore) && confidenceScore >= 0 && confidenceScore <= 1
          ? confidenceScore
          : fallback.confidenceScore,
      draftSummary: normalizeSummary(parsed.draftSummary, fallback.draftSummary),
      followUpQuestions: normalizeStringArray(parsed.followUpQuestions),
      generatedBy: "openai",
      missingInformation: normalizeStringArray(parsed.missingInformation),
      qualityFlags: normalizeStringArray(parsed.qualityFlags).length
        ? normalizeStringArray(parsed.qualityFlags)
        : fallback.qualityFlags,
    };
  } catch {
    return {
      ...fallback,
      qualityFlags: [
        ...fallback.qualityFlags,
        "AI generation was unavailable; fallback draft was generated from entered data.",
      ],
    };
  }
}
