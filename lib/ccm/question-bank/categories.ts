import type { QuestionCategory } from "./types";

export const QUESTION_CATEGORIES = [
  { id: "general_health", label: "General health", description: "Overall health and change from baseline." },
  { id: "medication_adherence", label: "Medication adherence", description: "Medication use, access, tolerance, and understanding." },
  { id: "symptoms", label: "Symptoms", description: "New, worsening, or concerning symptoms." },
  { id: "functional_status", label: "Functional status", description: "Activities of daily living, mobility, and independence." },
  { id: "falls", label: "Falls", description: "Falls, injuries, recurrence, and safety response." },
  { id: "blood_pressure", label: "Blood pressure", description: "Home monitoring, readings, and related symptoms." },
  { id: "diabetes", label: "Diabetes", description: "Glucose monitoring, hypoglycemia, and diabetes complications." },
  { id: "copd", label: "COPD", description: "Respiratory symptoms, rescue treatment, and exacerbation risk." },
  { id: "chf", label: "CHF", description: "Weight, edema, breathing, and fluid-status changes." },
  { id: "asthma", label: "Asthma", description: "Asthma control, rescue medication, and symptom burden." },
  { id: "mental_health", label: "Mental health", description: "Mood, anxiety, safety, and support needs." },
  { id: "pain", label: "Pain", description: "Pain severity, location, function, and treatment response." },
  { id: "preventive_care", label: "Preventive care", description: "Preventive services and overdue care." },
  { id: "social_determinants", label: "Social determinants", description: "Housing, finances, caregiving, and access barriers." },
  { id: "transportation", label: "Transportation", description: "Transportation barriers affecting care access." },
  { id: "nutrition", label: "Nutrition", description: "Food access, appetite, and nutrition-plan barriers." },
  { id: "sleep", label: "Sleep", description: "Sleep quality, duration, and symptom impact." },
  { id: "care_coordination", label: "Care coordination", description: "Unresolved care-team and service needs." },
  { id: "specialist_follow_up", label: "Specialist follow-up", description: "Specialist visits, recommendations, and pending follow-up." },
  { id: "hospitalizations", label: "Hospitalizations", description: "Admissions, discharge needs, and transitional care." },
  { id: "emergency_visits", label: "Emergency visits", description: "Emergency or urgent-care use and follow-up." },
  { id: "patient_goals", label: "Patient goals", description: "Patient priorities and progress toward care-plan goals." },
] as const satisfies readonly QuestionCategory[];

export const QUESTION_CATEGORIES_BY_ID = Object.fromEntries(
  QUESTION_CATEGORIES.map((category) => [category.id, category]),
) as Record<(typeof QUESTION_CATEGORIES)[number]["id"], QuestionCategory>;
