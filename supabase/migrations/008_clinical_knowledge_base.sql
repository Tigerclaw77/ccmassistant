-- Clinical knowledge base foundation.
-- This migration is intentionally read-first: it models reusable clinical knowledge
-- without wiring it into the existing first-billable-month workflow.

create extension if not exists pgcrypto;

do $$ begin
  create type public.kb_answer_type as enum (
    'yes_no',
    'multiple_choice',
    'numeric',
    'free_text',
    'date',
    'scale_1_10',
    'blood_pressure',
    'blood_sugar',
    'weight',
    'temperature',
    'pulse',
    'pulse_ox',
    'medication_list',
    'structured_measurement'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.kb_clinical_importance as enum (
    'routine',
    'elevated',
    'high',
    'critical'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.icd10_codes (
  code text primary key,
  description text not null,
  category text,
  is_billable boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.management_clusters (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null default 'general',
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cluster_icd10_map (
  cluster_id uuid not null references public.management_clusters(id) on delete cascade,
  icd10_code text not null references public.icd10_codes(code) on delete cascade,
  mapping_type text not null default 'representative',
  notes text,
  created_at timestamptz not null default now(),
  primary key (cluster_id, icd10_code)
);

create table if not exists public.clinical_objectives (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cluster_objective_map (
  cluster_id uuid not null references public.management_clusters(id) on delete cascade,
  objective_id uuid not null references public.clinical_objectives(id) on delete cascade,
  priority integer not null default 100,
  created_at timestamptz not null default now(),
  primary key (cluster_id, objective_id)
);

create table if not exists public.question_families (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  suggested_cadence text not null default 'monthly',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.objective_family_map (
  objective_id uuid not null references public.clinical_objectives(id) on delete cascade,
  family_id uuid not null references public.question_families(id) on delete cascade,
  priority integer not null default 100,
  created_at timestamptz not null default now(),
  primary key (objective_id, family_id)
);

create table if not exists public.clinical_questions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  question_text text not null,
  description text,
  answer_type public.kb_answer_type not null,
  options jsonb not null default '[]'::jsonb,
  required boolean not null default true,
  severity integer not null default 1 check (severity between 1 and 5),
  clinical_importance public.kb_clinical_importance not null default 'routine',
  suggested_cadence text not null default 'monthly',
  follow_up_trigger jsonb not null default '{}'::jsonb,
  provider_review_required boolean not null default false,
  retired boolean not null default false,
  version integer not null default 1 check (version > 0),
  active boolean not null default true,
  language text not null default 'en',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.question_family_members (
  family_id uuid not null references public.question_families(id) on delete cascade,
  question_id uuid not null references public.clinical_questions(id) on delete cascade,
  sort_order integer not null default 100,
  required_override boolean,
  created_at timestamptz not null default now(),
  primary key (family_id, question_id)
);

create table if not exists public.clinical_question_tags (
  question_id uuid not null references public.clinical_questions(id) on delete cascade,
  tag text not null,
  tag_type text not null default 'topic',
  created_at timestamptz not null default now(),
  primary key (question_id, tag, tag_type)
);

create table if not exists public.question_versions (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.clinical_questions(id) on delete cascade,
  version integer not null check (version > 0),
  question_text text not null,
  description text,
  answer_type public.kb_answer_type not null,
  options jsonb not null default '[]'::jsonb,
  change_note text,
  created_at timestamptz not null default now(),
  unique (question_id, version)
);

create table if not exists public.question_dependencies (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.clinical_questions(id) on delete cascade,
  depends_on_question_id uuid not null references public.clinical_questions(id) on delete cascade,
  operator text not null default 'equals',
  expected_value jsonb not null default 'null'::jsonb,
  action text not null default 'show',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint question_dependencies_not_self check (question_id <> depends_on_question_id)
);

create table if not exists public.question_rotation_rules (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references public.question_families(id) on delete cascade,
  question_id uuid references public.clinical_questions(id) on delete cascade,
  rule_type text not null default 'cadence',
  cadence text not null default 'monthly',
  max_questions_per_checkin integer check (max_questions_per_checkin is null or max_questions_per_checkin > 0),
  min_days_between integer check (min_days_between is null or min_days_between >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint question_rotation_rule_scope check (family_id is not null or question_id is not null)
);

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'icd10_codes',
    'management_clusters',
    'clinical_objectives',
    'question_families',
    'clinical_questions'
  ]
  loop
    if not exists (
      select 1
      from pg_trigger
      where tgname = 'set_updated_at'
        and tgrelid = format('public.%I', target_table)::regclass
    ) then
      execute format(
        'create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()',
        target_table
      );
    end if;
  end loop;
end $$;

alter table public.icd10_codes enable row level security;
alter table public.management_clusters enable row level security;
alter table public.cluster_icd10_map enable row level security;
alter table public.clinical_objectives enable row level security;
alter table public.cluster_objective_map enable row level security;
alter table public.question_families enable row level security;
alter table public.objective_family_map enable row level security;
alter table public.clinical_questions enable row level security;
alter table public.question_family_members enable row level security;
alter table public.clinical_question_tags enable row level security;
alter table public.question_versions enable row level security;
alter table public.question_dependencies enable row level security;
alter table public.question_rotation_rules enable row level security;

create policy icd10_codes_authenticated_select on public.icd10_codes for select to authenticated using (true);
create policy management_clusters_authenticated_select on public.management_clusters for select to authenticated using (true);
create policy cluster_icd10_map_authenticated_select on public.cluster_icd10_map for select to authenticated using (true);
create policy clinical_objectives_authenticated_select on public.clinical_objectives for select to authenticated using (true);
create policy cluster_objective_map_authenticated_select on public.cluster_objective_map for select to authenticated using (true);
create policy question_families_authenticated_select on public.question_families for select to authenticated using (true);
create policy objective_family_map_authenticated_select on public.objective_family_map for select to authenticated using (true);
create policy clinical_questions_authenticated_select on public.clinical_questions for select to authenticated using (true);
create policy question_family_members_authenticated_select on public.question_family_members for select to authenticated using (true);
create policy clinical_question_tags_authenticated_select on public.clinical_question_tags for select to authenticated using (true);
create policy question_versions_authenticated_select on public.question_versions for select to authenticated using (true);
create policy question_dependencies_authenticated_select on public.question_dependencies for select to authenticated using (true);
create policy question_rotation_rules_authenticated_select on public.question_rotation_rules for select to authenticated using (true);

grant select on
  public.icd10_codes,
  public.management_clusters,
  public.cluster_icd10_map,
  public.clinical_objectives,
  public.cluster_objective_map,
  public.question_families,
  public.objective_family_map,
  public.clinical_questions,
  public.question_family_members,
  public.clinical_question_tags,
  public.question_versions,
  public.question_dependencies,
  public.question_rotation_rules
to authenticated;

create index if not exists management_clusters_category_idx on public.management_clusters(category);
create index if not exists management_clusters_name_idx on public.management_clusters using gin (to_tsvector('english', name || ' ' || coalesce(description, '')));
create index if not exists cluster_icd10_map_code_idx on public.cluster_icd10_map(icd10_code);
create index if not exists cluster_objective_map_objective_idx on public.cluster_objective_map(objective_id);
create index if not exists objective_family_map_family_idx on public.objective_family_map(family_id);
create index if not exists question_family_members_question_idx on public.question_family_members(question_id);
create index if not exists clinical_question_tags_tag_idx on public.clinical_question_tags(tag);
create index if not exists clinical_questions_search_idx on public.clinical_questions using gin (to_tsvector('english', question_text || ' ' || coalesce(description, '')));

insert into public.clinical_objectives (slug, name, description)
values
  ('medication_adherence', 'Medication adherence', 'Assess whether the patient is taking medications as directed.'),
  ('monitor_symptoms', 'Monitor symptoms', 'Track current symptoms and changes since the prior check-in.'),
  ('monitor_progression', 'Monitor progression', 'Detect worsening, improvement, or progression of chronic disease.'),
  ('monitor_home_measurements', 'Monitor home measurements', 'Collect home readings such as BP, glucose, weight, oxygen, or pulse.'),
  ('identify_side_effects', 'Identify side effects', 'Identify medication or treatment side effects requiring review.'),
  ('assess_functional_status', 'Assess functional status', 'Assess ability to perform daily activities and maintain independence.'),
  ('identify_barriers', 'Identify barriers', 'Identify barriers to care, treatment, equipment, food, transportation, or medication access.'),
  ('hospitalization_screening', 'Hospitalization screening', 'Screen for admissions or facility stays since the last check-in.'),
  ('er_visit_screening', 'ER visit screening', 'Screen for emergency department or urgent care utilization.'),
  ('lifestyle', 'Lifestyle', 'Assess lifestyle factors such as nutrition, activity, sleep, and self-management.'),
  ('preventive_care', 'Preventive care', 'Track preventive services, exams, vaccinations, and screenings.'),
  ('follow_up_compliance', 'Follow-up compliance', 'Assess whether appointments, testing, referrals, and follow-ups are completed.'),
  ('education', 'Education', 'Identify education needs and reinforce condition-specific self-management.'),
  ('needs_assessment', 'Needs assessment', 'Capture broader patient needs for future care planning.')
on conflict (slug) do update
set name = excluded.name,
    description = excluded.description,
    active = true;

insert into public.question_families (slug, name, description, suggested_cadence)
values
  ('medication_adherence', 'Medication adherence', 'Medication-taking behavior, missed doses, and regimen understanding.', 'monthly'),
  ('blood_pressure', 'Blood pressure', 'Home blood pressure readings, symptoms, and measurement habits.', 'monthly'),
  ('blood_glucose', 'Blood glucose', 'Home glucose monitoring, hypoglycemia, hyperglycemia, and supplies.', 'monthly'),
  ('weight_monitoring', 'Weight monitoring', 'Home weight changes and fluid-related warning signs.', 'monthly'),
  ('vision_changes', 'Vision changes', 'Vision symptoms, eye medication adherence, and eye-care follow-up.', 'monthly'),
  ('respiratory_symptoms', 'Respiratory symptoms', 'Breathing status, inhaler use, oxygen, cough, and exacerbation signals.', 'monthly'),
  ('mood', 'Mood', 'Mood, anxiety, interest, safety, and social support.', 'monthly'),
  ('falls', 'Falls', 'Falls, near falls, balance, home hazards, and assistive device use.', 'monthly'),
  ('sleep', 'Sleep', 'Sleep duration, quality, daytime fatigue, and sleep treatment adherence.', 'monthly'),
  ('pain', 'Pain', 'Pain intensity, function impact, medication use, and red flags.', 'monthly'),
  ('nutrition', 'Nutrition', 'Food intake, appetite, diet adherence, hydration, and food access.', 'monthly'),
  ('exercise', 'Exercise', 'Activity level, limitations, symptoms with exertion, and goals.', 'monthly'),
  ('equipment', 'Equipment', 'Durable medical equipment, home devices, supplies, and use barriers.', 'monthly'),
  ('transportation', 'Transportation', 'Transportation barriers affecting appointments, labs, pharmacy, and care access.', 'monthly'),
  ('medication_access', 'Medication access', 'Refills, cost, pharmacy issues, and supply barriers.', 'monthly'),
  ('hospitalizations', 'Hospitalizations', 'Admissions, discharge instructions, medication changes, and follow-up after hospitalization.', 'monthly'),
  ('er_visits', 'ER visits', 'Emergency and urgent care visits, reasons, and follow-up needs.', 'monthly'),
  ('care_coordination', 'Care coordination', 'Appointments, referrals, labs, results, and unresolved care-team needs.', 'monthly'),
  ('functional_status', 'Functional status', 'Activities of daily living, mobility, independence, and home safety.', 'monthly')
on conflict (slug) do update
set name = excluded.name,
    description = excluded.description,
    suggested_cadence = excluded.suggested_cadence,
    active = true;

insert into public.management_clusters (slug, name, category, description)
values
  ('hypertension', 'Hypertension', 'cardiovascular', 'Blood pressure management and cardiovascular risk reduction.'),
  ('resistant_hypertension', 'Resistant Hypertension', 'cardiovascular', 'Hypertension requiring multiple therapies or close monitoring.'),
  ('type_2_diabetes', 'Type 2 Diabetes', 'endocrine', 'Glucose monitoring, medication adherence, and complication screening.'),
  ('type_1_diabetes', 'Type 1 Diabetes', 'endocrine', 'Insulin-dependent diabetes monitoring and safety.'),
  ('prediabetes', 'Prediabetes', 'endocrine', 'Lifestyle and progression monitoring for elevated glucose risk.'),
  ('chf', 'Congestive Heart Failure', 'cardiovascular', 'Fluid status, weight monitoring, symptoms, and medication adherence.'),
  ('coronary_artery_disease', 'Coronary Artery Disease', 'cardiovascular', 'Angina, medication adherence, risk factors, and follow-up.'),
  ('atrial_fibrillation', 'Atrial Fibrillation', 'cardiovascular', 'Rate/rhythm symptoms, anticoagulation, and follow-up.'),
  ('peripheral_artery_disease', 'Peripheral Artery Disease', 'cardiovascular', 'Leg symptoms, wounds, activity tolerance, and vascular follow-up.'),
  ('hyperlipidemia', 'Hyperlipidemia', 'cardiometabolic', 'Medication adherence and lifestyle risk reduction.'),
  ('copd', 'COPD', 'pulmonary', 'Respiratory symptoms, inhaler adherence, oxygen, and exacerbation screening.'),
  ('asthma', 'Asthma', 'pulmonary', 'Control, triggers, rescue inhaler use, and action-plan awareness.'),
  ('chronic_respiratory_failure', 'Chronic Respiratory Failure', 'pulmonary', 'Oxygen, dyspnea, pulse ox, and escalation symptoms.'),
  ('sleep_apnea', 'Sleep Apnea', 'sleep', 'Sleep quality, PAP use, mask fit, and fatigue.'),
  ('chronic_kidney_disease', 'Chronic Kidney Disease', 'renal', 'Blood pressure, labs, swelling, medication safety, and nephrology follow-up.'),
  ('end_stage_renal_disease', 'End Stage Renal Disease', 'renal', 'Dialysis adherence, access issues, symptoms, and care coordination.'),
  ('depression', 'Depression', 'behavioral_health', 'Mood, interest, medication, safety, and support.'),
  ('anxiety', 'Anxiety', 'behavioral_health', 'Anxiety symptoms, sleep, functioning, medications, and support.'),
  ('bipolar_disorder', 'Bipolar Disorder', 'behavioral_health', 'Mood stability, sleep, medications, and safety.'),
  ('substance_use_disorder', 'Substance Use Disorder', 'behavioral_health', 'Recovery support, cravings, medications, and safety.'),
  ('dementia', 'Dementia', 'neurologic', 'Cognition, function, safety, caregiver support, and medications.'),
  ('mild_cognitive_impairment', 'Mild Cognitive Impairment', 'neurologic', 'Memory changes, function, safety, and follow-up.'),
  ('parkinson_disease', 'Parkinson Disease', 'neurologic', 'Mobility, falls, medication timing, swallowing, and function.'),
  ('stroke_history', 'History of Stroke', 'neurologic', 'Function, symptoms, therapy follow-up, and secondary prevention.'),
  ('seizure_disorder', 'Seizure Disorder', 'neurologic', 'Seizure activity, medication adherence, and safety.'),
  ('migraine', 'Migraine', 'neurologic', 'Headache frequency, triggers, medication use, and red flags.'),
  ('osteoarthritis', 'Osteoarthritis', 'musculoskeletal', 'Pain, function, activity, medications, and mobility support.'),
  ('rheumatoid_arthritis', 'Rheumatoid Arthritis', 'musculoskeletal', 'Pain, stiffness, function, medications, and specialist follow-up.'),
  ('osteoporosis', 'Osteoporosis', 'musculoskeletal', 'Falls, fractures, medication adherence, calcium/vitamin D, and safety.'),
  ('chronic_back_pain', 'Chronic Back Pain', 'musculoskeletal', 'Pain, function, therapy, medications, and red flags.'),
  ('fibromyalgia', 'Fibromyalgia', 'musculoskeletal', 'Pain, fatigue, sleep, function, and self-management.'),
  ('glaucoma', 'Glaucoma', 'ophthalmology', 'Eye-drop adherence, vision changes, and ophthalmology follow-up.'),
  ('dry_eye', 'Dry Eye', 'ophthalmology', 'Symptoms, treatment adherence, visual comfort, and triggers.'),
  ('macular_degeneration', 'Macular Degeneration', 'ophthalmology', 'Vision changes, injection follow-up, and safety.'),
  ('diabetic_retinopathy', 'Diabetic Retinopathy', 'ophthalmology', 'Vision changes, glucose control, and eye-care follow-up.'),
  ('cataract', 'Cataract', 'ophthalmology', 'Vision function, surgery planning, and follow-up.'),
  ('hypothyroidism', 'Hypothyroidism', 'endocrine', 'Medication timing, symptoms, and lab follow-up.'),
  ('hyperthyroidism', 'Hyperthyroidism', 'endocrine', 'Symptoms, medications, pulse, and lab follow-up.'),
  ('obesity', 'Obesity', 'metabolic', 'Weight, nutrition, activity, barriers, and goals.'),
  ('metabolic_syndrome', 'Metabolic Syndrome', 'metabolic', 'Cardiometabolic risk, lifestyle, and measurements.'),
  ('gerd', 'GERD', 'gastrointestinal', 'Reflux symptoms, medication use, diet triggers, and red flags.'),
  ('irritable_bowel_syndrome', 'Irritable Bowel Syndrome', 'gastrointestinal', 'Bowel symptoms, diet, stress, medications, and function.'),
  ('inflammatory_bowel_disease', 'Inflammatory Bowel Disease', 'gastrointestinal', 'Flares, medications, nutrition, and specialist follow-up.'),
  ('cirrhosis', 'Cirrhosis', 'gastrointestinal', 'Fluid, confusion, bleeding symptoms, medications, and follow-up.'),
  ('chronic_hepatitis', 'Chronic Hepatitis', 'gastrointestinal', 'Medication adherence, labs, symptoms, and specialist follow-up.'),
  ('anemia', 'Anemia', 'hematology', 'Fatigue, bleeding symptoms, medication adherence, and lab follow-up.'),
  ('anticoagulation_management', 'Anticoagulation Management', 'hematology', 'Bleeding, clot symptoms, adherence, and monitoring.'),
  ('cancer_survivorship', 'Cancer Survivorship', 'oncology', 'Symptoms, surveillance, treatment effects, and care coordination.'),
  ('breast_cancer_history', 'Breast Cancer History', 'oncology', 'Surveillance, symptoms, treatment effects, and follow-up.'),
  ('prostate_cancer_history', 'Prostate Cancer History', 'oncology', 'Surveillance, urinary symptoms, treatment effects, and follow-up.'),
  ('chronic_pain_syndrome', 'Chronic Pain Syndrome', 'pain', 'Pain control, function, medication safety, and support.'),
  ('opioid_therapy_monitoring', 'Opioid Therapy Monitoring', 'pain', 'Medication safety, side effects, function, and adherence.'),
  ('urinary_incontinence', 'Urinary Incontinence', 'urology', 'Symptoms, supplies, infection signals, and quality of life.'),
  ('benign_prostatic_hyperplasia', 'Benign Prostatic Hyperplasia', 'urology', 'Urinary symptoms, medications, and follow-up.'),
  ('recurrent_uti', 'Recurrent UTI', 'urology', 'Symptoms, prevention, hydration, and timely care.'),
  ('chronic_wounds', 'Chronic Wounds', 'skin_wound', 'Wound changes, supplies, infection signs, and follow-up.'),
  ('pressure_ulcers', 'Pressure Ulcers', 'skin_wound', 'Skin checks, wound care, equipment, and infection signs.'),
  ('psoriasis', 'Psoriasis', 'dermatology', 'Skin symptoms, medications, triggers, and specialist follow-up.'),
  ('eczema', 'Eczema', 'dermatology', 'Itching, skin care, treatment adherence, and triggers.'),
  ('allergic_rhinitis', 'Allergic Rhinitis', 'ent_allergy', 'Symptoms, triggers, medication use, and sleep impact.'),
  ('chronic_sinusitis', 'Chronic Sinusitis', 'ent_allergy', 'Symptoms, medications, triggers, and follow-up.'),
  ('hearing_loss', 'Hearing Loss', 'ent_allergy', 'Function, equipment, safety, and follow-up.'),
  ('frailty', 'Frailty', 'geriatrics', 'Function, falls, nutrition, support, and safety.'),
  ('falls_risk', 'Falls Risk', 'geriatrics', 'Falls, balance, home safety, and equipment.'),
  ('malnutrition_risk', 'Malnutrition Risk', 'geriatrics', 'Weight, appetite, food access, and supplementation.'),
  ('polypharmacy', 'Polypharmacy', 'geriatrics', 'Medication burden, side effects, adherence, and reconciliation.'),
  ('palliative_care_needs', 'Palliative Care Needs', 'supportive_care', 'Symptoms, goals, support, and care coordination.'),
  ('homebound_status', 'Homebound Status', 'supportive_care', 'Function, transportation, safety, and service needs.'),
  ('post_hospital_transition', 'Post Hospital Transition', 'care_transition', 'Discharge instructions, medications, follow-up, and warning signs.'),
  ('post_surgical_followup', 'Post Surgical Follow-up', 'care_transition', 'Wound status, pain, mobility, medications, and appointments.'),
  ('medication_nonadherence_risk', 'Medication Nonadherence Risk', 'care_barrier', 'Missed doses, regimen confusion, costs, and access barriers.'),
  ('transportation_barrier', 'Transportation Barrier', 'care_barrier', 'Transportation access affecting appointments, pharmacy, and testing.'),
  ('food_insecurity', 'Food Insecurity', 'care_barrier', 'Food access and dietary management barriers.'),
  ('housing_instability', 'Housing Instability', 'care_barrier', 'Housing stability, safety, and care access.'),
  ('social_isolation', 'Social Isolation', 'care_barrier', 'Support, loneliness, and safety needs.'),
  ('caregiver_support_needs', 'Caregiver Support Needs', 'care_barrier', 'Caregiver availability, strain, and coordination.'),
  ('preventive_care_gap', 'Preventive Care Gap', 'preventive', 'Screenings, vaccinations, wellness visits, and follow-up.'),
  ('immunization_gap', 'Immunization Gap', 'preventive', 'Vaccine status and access.'),
  ('chronic_dizziness', 'Chronic Dizziness', 'neurologic', 'Dizziness, falls, medications, and red flags.'),
  ('edema', 'Edema', 'cardiovascular', 'Swelling, weight, breathing, and medication adherence.'),
  ('chronic_fatigue', 'Chronic Fatigue', 'general', 'Fatigue, sleep, function, mood, and medical follow-up.'),
  ('chronic_insomnia', 'Chronic Insomnia', 'sleep', 'Sleep patterns, treatments, daytime function, and safety.'),
  ('restless_legs', 'Restless Legs Syndrome', 'sleep', 'Symptoms, sleep impact, medications, and follow-up.'),
  ('thyroid_nodule', 'Thyroid Nodule', 'endocrine', 'Follow-up imaging, symptoms, and specialist care.'),
  ('vitamin_d_deficiency', 'Vitamin D Deficiency', 'metabolic', 'Supplement adherence, falls risk, and lab follow-up.'),
  ('gout', 'Gout', 'musculoskeletal', 'Flares, diet, medications, and follow-up.'),
  ('chronic_venous_insufficiency', 'Chronic Venous Insufficiency', 'vascular', 'Leg swelling, skin changes, compression, and wound risk.'),
  ('lymphedema', 'Lymphedema', 'vascular', 'Swelling, skin care, compression, and infection signs.'),
  ('peripheral_neuropathy', 'Peripheral Neuropathy', 'neurologic', 'Pain, numbness, falls, foot care, and medications.'),
  ('diabetic_foot_risk', 'Diabetic Foot Risk', 'endocrine', 'Foot checks, wounds, footwear, and podiatry follow-up.'),
  ('chronic_constipation', 'Chronic Constipation', 'gastrointestinal', 'Bowel habits, medications, hydration, and red flags.'),
  ('chronic_diarrhea', 'Chronic Diarrhea', 'gastrointestinal', 'Bowel frequency, hydration, triggers, and red flags.'),
  ('overactive_bladder', 'Overactive Bladder', 'urology', 'Urgency, frequency, leakage, medication effects, and quality of life.'),
  ('chronic_allergy', 'Chronic Allergy', 'ent_allergy', 'Symptoms, triggers, treatment adherence, and sleep impact.'),
  ('osteopenia', 'Osteopenia', 'musculoskeletal', 'Bone health, falls, supplements, and follow-up testing.'),
  ('geriatric_memory_concerns', 'Geriatric Memory Concerns', 'geriatrics', 'Memory symptoms, function, safety, and caregiver input.'),
  ('long_term_antiplatelet_therapy', 'Long-term Antiplatelet Therapy', 'hematology', 'Bleeding symptoms, adherence, and procedure planning.'),
  ('recurrent_pneumonia_risk', 'Recurrent Pneumonia Risk', 'pulmonary', 'Respiratory symptoms, vaccinations, aspiration risk, and follow-up.'),
  ('chronic_oxygen_use', 'Chronic Oxygen Use', 'pulmonary', 'Oxygen use, equipment, pulse ox, and safety.'),
  ('pulmonary_hypertension', 'Pulmonary Hypertension', 'pulmonary', 'Dyspnea, swelling, oxygen, and specialist follow-up.'),
  ('chronic_pancreatitis', 'Chronic Pancreatitis', 'gastrointestinal', 'Pain, nutrition, enzymes, glucose, and specialist care.'),
  ('chronic_liver_disease', 'Chronic Liver Disease', 'gastrointestinal', 'Symptoms, medication safety, labs, and specialist follow-up.'),
  ('chronic_migraine', 'Chronic Migraine', 'neurologic', 'Headache frequency, medication use, triggers, and function.'),
  ('spinal_stenosis', 'Spinal Stenosis', 'musculoskeletal', 'Pain, walking tolerance, falls, and treatment follow-up.'),
  ('carpal_tunnel_syndrome', 'Carpal Tunnel Syndrome', 'musculoskeletal', 'Hand symptoms, function, braces, and follow-up.'),
  ('diabetic_nephropathy', 'Diabetic Nephropathy', 'renal', 'Kidney function, diabetes control, BP, and nephrology follow-up.'),
  ('diabetic_neuropathy', 'Diabetic Neuropathy', 'neurologic', 'Foot symptoms, pain, falls, medications, and foot care.'),
  ('diabetic_eye_disease', 'Diabetic Eye Disease', 'ophthalmology', 'Vision symptoms, eye follow-up, and glucose control.'),
  ('chronic_macular_edema', 'Chronic Macular Edema', 'ophthalmology', 'Vision changes, injection follow-up, and symptoms.'),
  ('retinal_vein_occlusion', 'Retinal Vein Occlusion', 'ophthalmology', 'Vision changes, injection follow-up, and risk factor management.'),
  ('low_vision', 'Low Vision', 'ophthalmology', 'Function, safety, equipment, and eye-care follow-up.'),
  ('chronic_headache', 'Chronic Headache', 'neurologic', 'Headache pattern, medication use, triggers, and red flags.'),
  ('chronic_nausea', 'Chronic Nausea', 'gastrointestinal', 'Symptoms, nutrition, hydration, medication effects, and red flags.'),
  ('mobility_limitation', 'Mobility Limitation', 'functional', 'Walking, transfers, falls, equipment, and support.'),
  ('activities_of_daily_living_need', 'Activities of Daily Living Need', 'functional', 'Daily function, caregiver support, safety, and services.'),
  ('home_safety_risk', 'Home Safety Risk', 'functional', 'Home hazards, falls, equipment, and support.'),
  ('advance_care_planning_need', 'Advance Care Planning Need', 'supportive_care', 'Goals, preferences, documents, and care-team discussion.')
on conflict (slug) do update
set name = excluded.name,
    category = excluded.category,
    description = excluded.description,
    active = true;

insert into public.icd10_codes (code, description, category)
values
  ('I10', 'Essential hypertension', 'cardiovascular'),
  ('I11.0', 'Hypertensive heart disease with heart failure', 'cardiovascular'),
  ('E11.9', 'Type 2 diabetes mellitus without complications', 'endocrine'),
  ('E10.9', 'Type 1 diabetes mellitus without complications', 'endocrine'),
  ('R73.03', 'Prediabetes', 'endocrine'),
  ('I50.9', 'Heart failure, unspecified', 'cardiovascular'),
  ('I25.10', 'Atherosclerotic heart disease of native coronary artery', 'cardiovascular'),
  ('I48.91', 'Unspecified atrial fibrillation', 'cardiovascular'),
  ('I73.9', 'Peripheral vascular disease, unspecified', 'vascular'),
  ('E78.5', 'Hyperlipidemia, unspecified', 'cardiometabolic'),
  ('J44.9', 'Chronic obstructive pulmonary disease, unspecified', 'pulmonary'),
  ('J45.909', 'Unspecified asthma, uncomplicated', 'pulmonary'),
  ('J96.10', 'Chronic respiratory failure, unspecified whether with hypoxia or hypercapnia', 'pulmonary'),
  ('G47.33', 'Obstructive sleep apnea', 'sleep'),
  ('N18.30', 'Chronic kidney disease, stage 3 unspecified', 'renal'),
  ('N18.6', 'End stage renal disease', 'renal'),
  ('F32.9', 'Major depressive disorder, single episode, unspecified', 'behavioral_health'),
  ('F41.1', 'Generalized anxiety disorder', 'behavioral_health'),
  ('F31.9', 'Bipolar disorder, unspecified', 'behavioral_health'),
  ('F19.90', 'Other psychoactive substance use, unspecified, uncomplicated', 'behavioral_health'),
  ('F03.90', 'Unspecified dementia, unspecified severity, without behavioral disturbance', 'neurologic'),
  ('G20.A1', 'Parkinson disease without dyskinesia, without fluctuating manifestations', 'neurologic'),
  ('I69.30', 'Unspecified sequelae of cerebral infarction', 'neurologic'),
  ('G40.909', 'Epilepsy, unspecified, not intractable, without status epilepticus', 'neurologic'),
  ('G43.909', 'Migraine, unspecified, not intractable, without status migrainosus', 'neurologic'),
  ('M19.90', 'Unspecified osteoarthritis, unspecified site', 'musculoskeletal'),
  ('M06.9', 'Rheumatoid arthritis, unspecified', 'musculoskeletal'),
  ('M81.0', 'Age-related osteoporosis without current pathological fracture', 'musculoskeletal'),
  ('M54.50', 'Low back pain, unspecified', 'musculoskeletal'),
  ('M79.7', 'Fibromyalgia', 'musculoskeletal'),
  ('H40.9', 'Unspecified glaucoma', 'ophthalmology'),
  ('H04.123', 'Dry eye syndrome of bilateral lacrimal glands', 'ophthalmology'),
  ('H35.30', 'Unspecified macular degeneration', 'ophthalmology'),
  ('E11.319', 'Type 2 diabetes mellitus with unspecified diabetic retinopathy without macular edema', 'ophthalmology'),
  ('H26.9', 'Unspecified cataract', 'ophthalmology'),
  ('E03.9', 'Hypothyroidism, unspecified', 'endocrine'),
  ('E05.90', 'Thyrotoxicosis, unspecified without thyrotoxic crisis or storm', 'endocrine'),
  ('E66.9', 'Obesity, unspecified', 'metabolic'),
  ('K21.9', 'Gastro-esophageal reflux disease without esophagitis', 'gastrointestinal'),
  ('K58.9', 'Irritable bowel syndrome without diarrhea', 'gastrointestinal'),
  ('K51.90', 'Ulcerative colitis, unspecified, without complications', 'gastrointestinal'),
  ('K74.60', 'Unspecified cirrhosis of liver', 'gastrointestinal'),
  ('B18.9', 'Chronic viral hepatitis, unspecified', 'gastrointestinal'),
  ('D64.9', 'Anemia, unspecified', 'hematology'),
  ('Z79.01', 'Long term current use of anticoagulants', 'hematology'),
  ('Z85.3', 'Personal history of malignant neoplasm of breast', 'oncology'),
  ('Z85.46', 'Personal history of malignant neoplasm of prostate', 'oncology'),
  ('G89.29', 'Other chronic pain', 'pain'),
  ('Z79.891', 'Long term current use of opiate analgesic', 'pain'),
  ('N39.46', 'Mixed incontinence', 'urology'),
  ('N40.1', 'Benign prostatic hyperplasia with lower urinary tract symptoms', 'urology'),
  ('N39.0', 'Urinary tract infection, site not specified', 'urology'),
  ('L97.909', 'Non-pressure chronic ulcer of unspecified part of unspecified lower leg', 'skin_wound'),
  ('L89.90', 'Pressure ulcer of unspecified site, unspecified stage', 'skin_wound'),
  ('L40.9', 'Psoriasis, unspecified', 'dermatology'),
  ('L30.9', 'Dermatitis, unspecified', 'dermatology'),
  ('J30.9', 'Allergic rhinitis, unspecified', 'ent_allergy'),
  ('J32.9', 'Chronic sinusitis, unspecified', 'ent_allergy'),
  ('H91.90', 'Unspecified hearing loss, unspecified ear', 'ent_allergy'),
  ('R54', 'Age-related physical debility', 'geriatrics'),
  ('R29.6', 'Repeated falls', 'geriatrics'),
  ('E46', 'Unspecified protein-calorie malnutrition', 'geriatrics'),
  ('Z79.899', 'Other long term current drug therapy', 'geriatrics'),
  ('Z51.5', 'Encounter for palliative care', 'supportive_care'),
  ('Z74.01', 'Bed confinement status', 'supportive_care'),
  ('Z09', 'Encounter for follow-up examination after completed treatment', 'care_transition'),
  ('Z48.89', 'Encounter for other specified surgical aftercare', 'care_transition'),
  ('Z91.148', 'Patient noncompliance with medication regimen for other reason', 'care_barrier'),
  ('Z59.82', 'Transportation insecurity', 'care_barrier'),
  ('Z59.41', 'Food insecurity', 'care_barrier'),
  ('Z59.819', 'Housing instability, housed unspecified', 'care_barrier'),
  ('Z60.4', 'Social exclusion and rejection', 'care_barrier'),
  ('Z74.2', 'Need for assistance at home and no other household member able to render care', 'care_barrier'),
  ('Z00.00', 'Encounter for general adult medical examination without abnormal findings', 'preventive'),
  ('Z28.39', 'Other underimmunization status', 'preventive'),
  ('R42', 'Dizziness and giddiness', 'neurologic'),
  ('R60.9', 'Edema, unspecified', 'cardiovascular'),
  ('R53.82', 'Chronic fatigue, unspecified', 'general'),
  ('F51.01', 'Primary insomnia', 'sleep'),
  ('G25.81', 'Restless legs syndrome', 'sleep'),
  ('E04.1', 'Nontoxic single thyroid nodule', 'endocrine'),
  ('E55.9', 'Vitamin D deficiency, unspecified', 'metabolic'),
  ('M10.9', 'Gout, unspecified', 'musculoskeletal'),
  ('I87.2', 'Venous insufficiency chronic peripheral', 'vascular'),
  ('I89.0', 'Lymphedema, not elsewhere classified', 'vascular'),
  ('G62.9', 'Polyneuropathy, unspecified', 'neurologic'),
  ('E11.42', 'Type 2 diabetes mellitus with diabetic polyneuropathy', 'neurologic'),
  ('K59.09', 'Other constipation', 'gastrointestinal'),
  ('R19.7', 'Diarrhea, unspecified', 'gastrointestinal'),
  ('N32.81', 'Overactive bladder', 'urology'),
  ('M85.80', 'Other specified disorders of bone density and structure, unspecified site', 'musculoskeletal'),
  ('Z79.02', 'Long term current use of antithrombotics/antiplatelets', 'hematology'),
  ('J18.9', 'Pneumonia, unspecified organism', 'pulmonary'),
  ('Z99.81', 'Dependence on supplemental oxygen', 'pulmonary'),
  ('I27.20', 'Pulmonary hypertension, unspecified', 'pulmonary'),
  ('K86.1', 'Other chronic pancreatitis', 'gastrointestinal'),
  ('K76.9', 'Liver disease, unspecified', 'gastrointestinal'),
  ('M48.00', 'Spinal stenosis, site unspecified', 'musculoskeletal'),
  ('G56.00', 'Carpal tunnel syndrome, unspecified upper limb', 'musculoskeletal'),
  ('E11.21', 'Type 2 diabetes mellitus with diabetic nephropathy', 'renal'),
  ('E11.311', 'Type 2 diabetes mellitus with unspecified diabetic retinopathy with macular edema', 'ophthalmology'),
  ('H35.81', 'Retinal edema', 'ophthalmology'),
  ('H34.8192', 'Central retinal vein occlusion, unspecified eye, stable', 'ophthalmology'),
  ('H54.7', 'Unspecified visual loss', 'ophthalmology'),
  ('R51.9', 'Headache, unspecified', 'neurologic'),
  ('R11.0', 'Nausea', 'gastrointestinal'),
  ('R26.89', 'Other abnormalities of gait and mobility', 'functional'),
  ('Z74.1', 'Need for assistance with personal care', 'functional'),
  ('Z91.81', 'History of falling', 'functional'),
  ('Z71.89', 'Other specified counseling', 'supportive_care')
on conflict (code) do update
set description = excluded.description,
    category = excluded.category,
    active = true;

insert into public.cluster_icd10_map (cluster_id, icd10_code, mapping_type)
select cluster.id, seed.code, 'representative'
from (values
  ('hypertension', 'I10'),
  ('resistant_hypertension', 'I11.0'),
  ('type_2_diabetes', 'E11.9'),
  ('type_1_diabetes', 'E10.9'),
  ('prediabetes', 'R73.03'),
  ('chf', 'I50.9'),
  ('coronary_artery_disease', 'I25.10'),
  ('atrial_fibrillation', 'I48.91'),
  ('peripheral_artery_disease', 'I73.9'),
  ('hyperlipidemia', 'E78.5'),
  ('copd', 'J44.9'),
  ('asthma', 'J45.909'),
  ('chronic_respiratory_failure', 'J96.10'),
  ('sleep_apnea', 'G47.33'),
  ('chronic_kidney_disease', 'N18.30'),
  ('end_stage_renal_disease', 'N18.6'),
  ('depression', 'F32.9'),
  ('anxiety', 'F41.1'),
  ('bipolar_disorder', 'F31.9'),
  ('substance_use_disorder', 'F19.90'),
  ('dementia', 'F03.90'),
  ('parkinson_disease', 'G20.A1'),
  ('stroke_history', 'I69.30'),
  ('seizure_disorder', 'G40.909'),
  ('migraine', 'G43.909'),
  ('osteoarthritis', 'M19.90'),
  ('rheumatoid_arthritis', 'M06.9'),
  ('osteoporosis', 'M81.0'),
  ('chronic_back_pain', 'M54.50'),
  ('fibromyalgia', 'M79.7'),
  ('glaucoma', 'H40.9'),
  ('dry_eye', 'H04.123'),
  ('macular_degeneration', 'H35.30'),
  ('diabetic_retinopathy', 'E11.319'),
  ('cataract', 'H26.9'),
  ('hypothyroidism', 'E03.9'),
  ('hyperthyroidism', 'E05.90'),
  ('obesity', 'E66.9'),
  ('gerd', 'K21.9'),
  ('irritable_bowel_syndrome', 'K58.9'),
  ('inflammatory_bowel_disease', 'K51.90'),
  ('cirrhosis', 'K74.60'),
  ('chronic_hepatitis', 'B18.9'),
  ('anemia', 'D64.9'),
  ('anticoagulation_management', 'Z79.01'),
  ('breast_cancer_history', 'Z85.3'),
  ('prostate_cancer_history', 'Z85.46'),
  ('chronic_pain_syndrome', 'G89.29'),
  ('opioid_therapy_monitoring', 'Z79.891'),
  ('urinary_incontinence', 'N39.46'),
  ('benign_prostatic_hyperplasia', 'N40.1'),
  ('recurrent_uti', 'N39.0'),
  ('chronic_wounds', 'L97.909'),
  ('pressure_ulcers', 'L89.90'),
  ('psoriasis', 'L40.9'),
  ('eczema', 'L30.9'),
  ('allergic_rhinitis', 'J30.9'),
  ('chronic_sinusitis', 'J32.9'),
  ('hearing_loss', 'H91.90'),
  ('frailty', 'R54'),
  ('falls_risk', 'R29.6'),
  ('malnutrition_risk', 'E46'),
  ('polypharmacy', 'Z79.899'),
  ('palliative_care_needs', 'Z51.5'),
  ('homebound_status', 'Z74.01'),
  ('post_hospital_transition', 'Z09'),
  ('post_surgical_followup', 'Z48.89'),
  ('medication_nonadherence_risk', 'Z91.148'),
  ('transportation_barrier', 'Z59.82'),
  ('food_insecurity', 'Z59.41'),
  ('housing_instability', 'Z59.819'),
  ('social_isolation', 'Z60.4'),
  ('caregiver_support_needs', 'Z74.2'),
  ('preventive_care_gap', 'Z00.00'),
  ('immunization_gap', 'Z28.39'),
  ('chronic_dizziness', 'R42'),
  ('edema', 'R60.9'),
  ('chronic_fatigue', 'R53.82'),
  ('chronic_insomnia', 'F51.01'),
  ('restless_legs', 'G25.81'),
  ('thyroid_nodule', 'E04.1'),
  ('vitamin_d_deficiency', 'E55.9'),
  ('gout', 'M10.9'),
  ('chronic_venous_insufficiency', 'I87.2'),
  ('lymphedema', 'I89.0'),
  ('peripheral_neuropathy', 'G62.9'),
  ('diabetic_neuropathy', 'E11.42'),
  ('chronic_constipation', 'K59.09'),
  ('chronic_diarrhea', 'R19.7'),
  ('overactive_bladder', 'N32.81'),
  ('osteopenia', 'M85.80'),
  ('long_term_antiplatelet_therapy', 'Z79.02'),
  ('recurrent_pneumonia_risk', 'J18.9'),
  ('chronic_oxygen_use', 'Z99.81'),
  ('pulmonary_hypertension', 'I27.20'),
  ('chronic_pancreatitis', 'K86.1'),
  ('chronic_liver_disease', 'K76.9'),
  ('spinal_stenosis', 'M48.00'),
  ('carpal_tunnel_syndrome', 'G56.00'),
  ('diabetic_nephropathy', 'E11.21'),
  ('diabetic_eye_disease', 'E11.311'),
  ('chronic_macular_edema', 'H35.81'),
  ('retinal_vein_occlusion', 'H34.8192'),
  ('low_vision', 'H54.7'),
  ('chronic_headache', 'R51.9'),
  ('chronic_nausea', 'R11.0'),
  ('mobility_limitation', 'R26.89'),
  ('activities_of_daily_living_need', 'Z74.1'),
  ('home_safety_risk', 'Z91.81'),
  ('advance_care_planning_need', 'Z71.89')
) as seed(cluster_slug, code)
join public.management_clusters cluster on cluster.slug = seed.cluster_slug
on conflict (cluster_id, icd10_code) do nothing;

insert into public.cluster_objective_map (cluster_id, objective_id, priority)
select cluster.id, objective.id, seed.priority
from public.management_clusters cluster
join lateral (
  values
    ('medication_adherence', 10),
    ('monitor_symptoms', 20),
    ('identify_barriers', 70),
    ('follow_up_compliance', 80),
    ('education', 90)
) as seed(objective_slug, priority) on true
join public.clinical_objectives objective on objective.slug = seed.objective_slug
on conflict (cluster_id, objective_id) do nothing;

insert into public.cluster_objective_map (cluster_id, objective_id, priority)
select cluster.id, objective.id, seed.priority
from public.management_clusters cluster
join lateral (
  values
    ('monitor_home_measurements', 30),
    ('lifestyle', 60),
    ('preventive_care', 85)
) as seed(objective_slug, priority) on cluster.category in ('cardiovascular', 'cardiometabolic', 'endocrine', 'metabolic', 'renal', 'pulmonary')
join public.clinical_objectives objective on objective.slug = seed.objective_slug
on conflict (cluster_id, objective_id) do nothing;

insert into public.cluster_objective_map (cluster_id, objective_id, priority)
select cluster.id, objective.id, seed.priority
from public.management_clusters cluster
join lateral (
  values
    ('monitor_progression', 25),
    ('assess_functional_status', 40)
) as seed(objective_slug, priority) on cluster.category in ('ophthalmology', 'neurologic', 'musculoskeletal', 'functional', 'geriatrics', 'vascular')
join public.clinical_objectives objective on objective.slug = seed.objective_slug
on conflict (cluster_id, objective_id) do nothing;

insert into public.cluster_objective_map (cluster_id, objective_id, priority)
select cluster.id, objective.id, seed.priority
from public.management_clusters cluster
join lateral (
  values
    ('hospitalization_screening', 50),
    ('er_visit_screening', 55)
) as seed(objective_slug, priority) on true
join public.clinical_objectives objective on objective.slug = seed.objective_slug
on conflict (cluster_id, objective_id) do nothing;

insert into public.objective_family_map (objective_id, family_id, priority)
select objective.id, family.id, seed.priority
from (values
  ('medication_adherence', 'medication_adherence', 10),
  ('medication_adherence', 'medication_access', 20),
  ('monitor_symptoms', 'respiratory_symptoms', 10),
  ('monitor_symptoms', 'pain', 20),
  ('monitor_symptoms', 'mood', 30),
  ('monitor_symptoms', 'vision_changes', 40),
  ('monitor_progression', 'vision_changes', 10),
  ('monitor_progression', 'functional_status', 20),
  ('monitor_progression', 'care_coordination', 40),
  ('monitor_home_measurements', 'blood_pressure', 10),
  ('monitor_home_measurements', 'blood_glucose', 20),
  ('monitor_home_measurements', 'weight_monitoring', 30),
  ('monitor_home_measurements', 'respiratory_symptoms', 40),
  ('identify_side_effects', 'medication_adherence', 10),
  ('identify_side_effects', 'pain', 30),
  ('assess_functional_status', 'falls', 10),
  ('assess_functional_status', 'exercise', 20),
  ('assess_functional_status', 'equipment', 30),
  ('identify_barriers', 'transportation', 10),
  ('identify_barriers', 'medication_access', 20),
  ('identify_barriers', 'nutrition', 30),
  ('identify_barriers', 'equipment', 40),
  ('hospitalization_screening', 'hospitalizations', 10),
  ('er_visit_screening', 'er_visits', 10),
  ('lifestyle', 'nutrition', 10),
  ('lifestyle', 'exercise', 20),
  ('lifestyle', 'sleep', 30),
  ('preventive_care', 'care_coordination', 10),
  ('preventive_care', 'hospitalizations', 50),
  ('follow_up_compliance', 'care_coordination', 10),
  ('follow_up_compliance', 'transportation', 20),
  ('education', 'care_coordination', 20),
  ('education', 'medication_adherence', 30),
  ('needs_assessment', 'care_coordination', 10),
  ('needs_assessment', 'transportation', 20),
  ('needs_assessment', 'equipment', 30),
  ('needs_assessment', 'nutrition', 40)
) as seed(objective_slug, family_slug, priority)
join public.clinical_objectives objective on objective.slug = seed.objective_slug
join public.question_families family on family.slug = seed.family_slug
on conflict (objective_id, family_id) do nothing;

with seed(family_slug, sort_order, slug, question_text, description, answer_type, severity, clinical_importance, suggested_cadence, follow_up_trigger, provider_review_required, tags) as (
  values
    ('medication_adherence', 10, 'med_current_list_review', 'Please list the medications you are currently taking.', 'Medication reconciliation input.', 'medication_list'::public.kb_answer_type, 2, 'elevated'::public.kb_clinical_importance, 'monthly', '{}'::jsonb, true, array['medication','reconciliation']),
    ('medication_adherence', 20, 'med_taking_as_prescribed', 'Are you taking your medications as prescribed?', 'General adherence screen.', 'yes_no', 3, 'high', 'monthly', '{"answer":"no","action":"review"}'::jsonb, true, array['medication','adherence']),
    ('medication_adherence', 30, 'med_missed_doses', 'Have you missed any medication doses in the past 7 days?', 'Recent missed-dose screen.', 'yes_no', 3, 'high', 'monthly', '{"answer":"yes","action":"review"}'::jsonb, true, array['medication','adherence']),
    ('medication_adherence', 40, 'med_recent_change', 'Have any medications been started, stopped, or changed since your last check-in?', 'Medication change screen.', 'yes_no', 3, 'high', 'monthly', '{"answer":"yes","action":"review"}'::jsonb, true, array['medication','change']),
    ('medication_adherence', 50, 'med_side_effects', 'Are you having side effects or new symptoms you think may be from a medication?', 'Side effect screen.', 'yes_no', 4, 'high', 'monthly', '{"answer":"yes","action":"provider_review"}'::jsonb, true, array['medication','side_effect']),
    ('medication_adherence', 60, 'med_understands_schedule', 'Do you understand when and how to take each medication?', 'Regimen understanding screen.', 'yes_no', 2, 'elevated', 'monthly', '{"answer":"no","action":"educate"}'::jsonb, true, array['medication','education']),
    ('medication_adherence', 70, 'med_stopped_without_direction', 'Have you stopped any medication without being told to stop it?', 'Potential safety issue.', 'yes_no', 4, 'high', 'monthly', '{"answer":"yes","action":"provider_review"}'::jsonb, true, array['medication','safety']),
    ('medication_adherence', 80, 'med_refill_needed', 'Do you need any medication refills before your next check-in?', 'Refill need screen.', 'yes_no', 2, 'elevated', 'monthly', '{"answer":"yes","action":"care_coordination"}'::jsonb, false, array['medication','refill']),
    ('medication_adherence', 90, 'med_uses_organizer', 'Do you use a pill box, reminder, or other system to help take medications?', 'Adherence support screen.', 'yes_no', 1, 'routine', 'quarterly', '{}'::jsonb, false, array['medication','self_management']),
    ('medication_adherence', 100, 'med_questions_for_team', 'Do you have questions about any medication?', 'Medication education need.', 'yes_no', 2, 'elevated', 'monthly', '{"answer":"yes","action":"care_coordination"}'::jsonb, false, array['medication','education']),

    ('blood_pressure', 10, 'bp_latest_reading', 'What was your most recent blood pressure reading?', 'Structured home BP reading.', 'blood_pressure', 3, 'high', 'monthly', '{"systolic_gte":180,"diastolic_gte":120,"action":"urgent_review"}'::jsonb, true, array['blood_pressure','home_measurement']),
    ('blood_pressure', 20, 'bp_checks_home', 'Have you checked your blood pressure at home since your last check-in?', 'Measurement adherence.', 'yes_no', 2, 'elevated', 'monthly', '{"answer":"no","action":"educate"}'::jsonb, false, array['blood_pressure','measurement']),
    ('blood_pressure', 30, 'bp_high_readings', 'Have you had any blood pressure readings higher than your care team told you to report?', 'High BP signal.', 'yes_no', 4, 'high', 'monthly', '{"answer":"yes","action":"provider_review"}'::jsonb, true, array['blood_pressure','high']),
    ('blood_pressure', 40, 'bp_low_readings', 'Have you had any unusually low blood pressure readings?', 'Low BP signal.', 'yes_no', 4, 'high', 'monthly', '{"answer":"yes","action":"provider_review"}'::jsonb, true, array['blood_pressure','low']),
    ('blood_pressure', 50, 'bp_dizziness', 'Have you felt dizzy, faint, or lightheaded?', 'Symptom screen.', 'yes_no', 3, 'high', 'monthly', '{"answer":"yes","action":"review"}'::jsonb, true, array['symptom','dizziness']),
    ('blood_pressure', 60, 'bp_headache_vision', 'Have you had severe headache, chest pain, shortness of breath, or sudden vision changes?', 'Hypertensive warning symptoms.', 'yes_no', 5, 'critical', 'monthly', '{"answer":"yes","action":"urgent_review"}'::jsonb, true, array['red_flag','blood_pressure']),
    ('blood_pressure', 70, 'bp_missed_meds', 'Have you missed any blood pressure medication doses?', 'BP medication adherence.', 'yes_no', 3, 'high', 'monthly', '{"answer":"yes","action":"review"}'::jsonb, true, array['blood_pressure','medication']),
    ('blood_pressure', 80, 'bp_has_cuff', 'Do you have a working blood pressure cuff at home?', 'Equipment availability.', 'yes_no', 2, 'elevated', 'quarterly', '{"answer":"no","action":"equipment_support"}'::jsonb, false, array['equipment','blood_pressure']),
    ('blood_pressure', 90, 'bp_cuff_difficulty', 'Do you have trouble using your blood pressure cuff?', 'Measurement barrier.', 'yes_no', 2, 'elevated', 'quarterly', '{"answer":"yes","action":"education"}'::jsonb, false, array['equipment','education']),
    ('blood_pressure', 100, 'bp_knows_target', 'Do you know the blood pressure range your care team wants you to report?', 'Target understanding.', 'yes_no', 1, 'routine', 'quarterly', '{"answer":"no","action":"education"}'::jsonb, false, array['education','blood_pressure']),

    ('blood_glucose', 10, 'bg_latest_reading', 'What was your most recent blood sugar reading?', 'Structured home glucose reading.', 'blood_sugar', 3, 'high', 'monthly', '{}'::jsonb, true, array['glucose','home_measurement']),
    ('blood_glucose', 20, 'bg_checks_home', 'Have you checked your blood sugar as often as your care team recommended?', 'Glucose monitoring adherence.', 'yes_no', 3, 'high', 'monthly', '{"answer":"no","action":"review"}'::jsonb, true, array['glucose','monitoring']),
    ('blood_glucose', 30, 'bg_low_episode', 'Have you had any low blood sugar episodes?', 'Hypoglycemia screen.', 'yes_no', 5, 'critical', 'monthly', '{"answer":"yes","action":"provider_review"}'::jsonb, true, array['glucose','hypoglycemia']),
    ('blood_glucose', 40, 'bg_high_episode', 'Have you had any high blood sugar readings that concerned you?', 'Hyperglycemia screen.', 'yes_no', 4, 'high', 'monthly', '{"answer":"yes","action":"provider_review"}'::jsonb, true, array['glucose','hyperglycemia']),
    ('blood_glucose', 50, 'bg_symptoms', 'Have you had shaking, sweating, confusion, unusual thirst, or frequent urination?', 'Glucose symptom screen.', 'yes_no', 4, 'high', 'monthly', '{"answer":"yes","action":"review"}'::jsonb, true, array['glucose','symptom']),
    ('blood_glucose', 60, 'bg_insulin_or_med_missed', 'Have you missed any diabetes medication or insulin doses?', 'Diabetes medication adherence.', 'yes_no', 4, 'high', 'monthly', '{"answer":"yes","action":"review"}'::jsonb, true, array['glucose','medication']),
    ('blood_glucose', 70, 'bg_supplies', 'Do you have the supplies you need to check your blood sugar?', 'Supply availability.', 'yes_no', 2, 'elevated', 'monthly', '{"answer":"no","action":"care_coordination"}'::jsonb, false, array['glucose','supplies']),
    ('blood_glucose', 80, 'bg_food_barriers', 'Have food access or meal timing made blood sugar control harder?', 'Food barrier screen.', 'yes_no', 3, 'high', 'monthly', '{"answer":"yes","action":"barrier_review"}'::jsonb, false, array['nutrition','glucose']),
    ('blood_glucose', 90, 'bg_foot_issue', 'Have you noticed a new sore, blister, or numbness in your feet?', 'Foot risk screen.', 'yes_no', 4, 'high', 'monthly', '{"answer":"yes","action":"provider_review"}'::jsonb, true, array['glucose','foot_care']),
    ('blood_glucose', 100, 'bg_knows_plan', 'Do you know what to do if your blood sugar is too low or too high?', 'Action plan understanding.', 'yes_no', 2, 'elevated', 'quarterly', '{"answer":"no","action":"education"}'::jsonb, false, array['glucose','education']),

    ('weight_monitoring', 10, 'weight_latest', 'What is your most recent weight?', 'Structured home weight.', 'weight', 3, 'high', 'monthly', '{}'::jsonb, true, array['weight','home_measurement']),
    ('weight_monitoring', 20, 'weight_tracking', 'Have you been tracking your weight as recommended?', 'Weight monitoring adherence.', 'yes_no', 2, 'elevated', 'monthly', '{"answer":"no","action":"education"}'::jsonb, false, array['weight','monitoring']),
    ('weight_monitoring', 30, 'weight_gain_fast', 'Have you gained weight quickly over a few days?', 'Fluid retention screen.', 'yes_no', 4, 'high', 'monthly', '{"answer":"yes","action":"provider_review"}'::jsonb, true, array['weight','fluid']),
    ('weight_monitoring', 40, 'weight_loss_unplanned', 'Have you lost weight without trying?', 'Unplanned weight loss screen.', 'yes_no', 4, 'high', 'monthly', '{"answer":"yes","action":"review"}'::jsonb, true, array['weight','nutrition']),
    ('weight_monitoring', 50, 'weight_swelling', 'Have you noticed new or worse swelling in your feet, ankles, legs, or abdomen?', 'Edema screen.', 'yes_no', 4, 'high', 'monthly', '{"answer":"yes","action":"provider_review"}'::jsonb, true, array['edema','fluid']),
    ('weight_monitoring', 60, 'weight_breathing_flat', 'Are you more short of breath when lying flat or sleeping?', 'Orthopnea screen.', 'yes_no', 5, 'critical', 'monthly', '{"answer":"yes","action":"urgent_review"}'::jsonb, true, array['breathing','fluid']),
    ('weight_monitoring', 70, 'weight_appetite', 'Has your appetite changed significantly?', 'Appetite change screen.', 'yes_no', 3, 'elevated', 'monthly', '{"answer":"yes","action":"review"}'::jsonb, false, array['nutrition','weight']),
    ('weight_monitoring', 80, 'weight_scale_available', 'Do you have a working scale at home?', 'Equipment availability.', 'yes_no', 2, 'elevated', 'quarterly', '{"answer":"no","action":"equipment_support"}'::jsonb, false, array['equipment','weight']),
    ('weight_monitoring', 90, 'weight_diet_plan', 'Are you able to follow the eating plan recommended by your care team?', 'Diet plan barrier.', 'yes_no', 2, 'elevated', 'monthly', '{"answer":"no","action":"barrier_review"}'::jsonb, false, array['nutrition','barrier']),
    ('weight_monitoring', 100, 'weight_questions', 'Do you have questions about weight changes or fluid symptoms?', 'Education need.', 'yes_no', 2, 'elevated', 'monthly', '{"answer":"yes","action":"education"}'::jsonb, false, array['education','weight']),

    ('vision_changes', 10, 'vision_new_change', 'Have you noticed any new or worsening change in your vision?', 'General vision change screen.', 'yes_no', 4, 'high', 'monthly', '{"answer":"yes","action":"provider_review"}'::jsonb, true, array['vision','symptom']),
    ('vision_changes', 20, 'vision_sudden_loss', 'Have you had sudden vision loss, new flashes, new floaters, or a curtain over vision?', 'Urgent eye warning symptoms.', 'yes_no', 5, 'critical', 'monthly', '{"answer":"yes","action":"urgent_review"}'::jsonb, true, array['vision','red_flag']),
    ('vision_changes', 30, 'vision_pain_redness', 'Have you had eye pain, significant redness, or light sensitivity?', 'Eye pain/redness screen.', 'yes_no', 5, 'critical', 'monthly', '{"answer":"yes","action":"urgent_review"}'::jsonb, true, array['vision','red_flag']),
    ('vision_changes', 40, 'vision_drops_adherence', 'Are you using prescribed eye drops or treatments as directed?', 'Eye treatment adherence.', 'yes_no', 3, 'high', 'monthly', '{"answer":"no","action":"review"}'::jsonb, true, array['vision','medication']),
    ('vision_changes', 50, 'vision_drop_access', 'Do you have enough eye drops or eye medications until your next refill?', 'Eye medication access.', 'yes_no', 2, 'elevated', 'monthly', '{"answer":"no","action":"care_coordination"}'::jsonb, false, array['vision','access']),
    ('vision_changes', 60, 'vision_daily_tasks', 'Is vision making reading, driving, walking, or daily tasks harder?', 'Functional impact.', 'yes_no', 3, 'high', 'monthly', '{"answer":"yes","action":"review"}'::jsonb, true, array['vision','function']),
    ('vision_changes', 70, 'vision_followup_scheduled', 'Do you have your next eye-care appointment scheduled?', 'Follow-up compliance.', 'yes_no', 2, 'elevated', 'quarterly', '{"answer":"no","action":"care_coordination"}'::jsonb, false, array['vision','follow_up']),
    ('vision_changes', 80, 'vision_missed_visit', 'Have you missed an eye-care appointment or injection visit?', 'Missed follow-up screen.', 'yes_no', 3, 'high', 'monthly', '{"answer":"yes","action":"care_coordination"}'::jsonb, true, array['vision','follow_up']),
    ('vision_changes', 90, 'vision_home_safety', 'Has your vision caused a fall, near fall, or safety concern?', 'Vision-related safety.', 'yes_no', 4, 'high', 'monthly', '{"answer":"yes","action":"review"}'::jsonb, true, array['vision','safety']),
    ('vision_changes', 100, 'vision_questions', 'Do you have questions about your eye condition or eye treatments?', 'Education need.', 'yes_no', 2, 'elevated', 'monthly', '{"answer":"yes","action":"education"}'::jsonb, false, array['vision','education']),

    ('respiratory_symptoms', 10, 'resp_shortness_breath', 'Are you more short of breath than usual?', 'Respiratory symptom screen.', 'yes_no', 5, 'critical', 'monthly', '{"answer":"yes","action":"urgent_review"}'::jsonb, true, array['respiratory','dyspnea']),
    ('respiratory_symptoms', 20, 'resp_cough_change', 'Has your cough changed or become worse?', 'Cough change screen.', 'yes_no', 3, 'high', 'monthly', '{"answer":"yes","action":"review"}'::jsonb, true, array['respiratory','cough']),
    ('respiratory_symptoms', 30, 'resp_sputum_change', 'Have you had increased mucus, change in mucus color, or coughing up blood?', 'Sputum warning screen.', 'yes_no', 4, 'high', 'monthly', '{"answer":"yes","action":"provider_review"}'::jsonb, true, array['respiratory','sputum']),
    ('respiratory_symptoms', 40, 'resp_wheezing', 'Have you had more wheezing or chest tightness?', 'Wheeze screen.', 'yes_no', 4, 'high', 'monthly', '{"answer":"yes","action":"review"}'::jsonb, true, array['respiratory','wheeze']),
    ('respiratory_symptoms', 50, 'resp_rescue_inhaler', 'Have you needed your rescue inhaler or breathing treatment more often than usual?', 'Rescue use screen.', 'yes_no', 4, 'high', 'monthly', '{"answer":"yes","action":"provider_review"}'::jsonb, true, array['respiratory','inhaler']),
    ('respiratory_symptoms', 60, 'resp_controller_adherence', 'Are you using your daily inhalers or breathing medications as directed?', 'Controller adherence.', 'yes_no', 3, 'high', 'monthly', '{"answer":"no","action":"review"}'::jsonb, true, array['respiratory','medication']),
    ('respiratory_symptoms', 70, 'resp_pulse_ox', 'What is your most recent oxygen level, if you check it at home?', 'Pulse oximetry reading.', 'pulse_ox', 4, 'high', 'monthly', '{"spo2_lte":88,"action":"urgent_review"}'::jsonb, true, array['respiratory','pulse_ox']),
    ('respiratory_symptoms', 80, 'resp_oxygen_equipment', 'Do you have any problems with oxygen equipment, tubing, tanks, or power access?', 'Oxygen equipment barrier.', 'yes_no', 4, 'high', 'monthly', '{"answer":"yes","action":"care_coordination"}'::jsonb, true, array['respiratory','equipment']),
    ('respiratory_symptoms', 90, 'resp_fever', 'Have you had fever or chills with breathing symptoms?', 'Infection signal.', 'yes_no', 4, 'high', 'monthly', '{"answer":"yes","action":"provider_review"}'::jsonb, true, array['respiratory','infection']),
    ('respiratory_symptoms', 100, 'resp_action_plan', 'Do you know what to do if your breathing suddenly worsens?', 'Action plan understanding.', 'yes_no', 2, 'elevated', 'quarterly', '{"answer":"no","action":"education"}'::jsonb, false, array['respiratory','education']),

    ('mood', 10, 'mood_interest', 'Over the past 2 weeks, have you had little interest or pleasure in doing things?', 'Depression screen.', 'yes_no', 3, 'high', 'monthly', '{"answer":"yes","action":"review"}'::jsonb, true, array['mood','depression']),
    ('mood', 20, 'mood_down', 'Over the past 2 weeks, have you felt down, depressed, or hopeless?', 'Depression screen.', 'yes_no', 3, 'high', 'monthly', '{"answer":"yes","action":"review"}'::jsonb, true, array['mood','depression']),
    ('mood', 30, 'mood_anxiety', 'Have anxiety, worry, or panic symptoms interfered with your day?', 'Anxiety screen.', 'yes_no', 3, 'high', 'monthly', '{"answer":"yes","action":"review"}'::jsonb, true, array['mood','anxiety']),
    ('mood', 40, 'mood_sleep_appetite', 'Have mood symptoms affected your sleep or appetite?', 'Mood-related function.', 'yes_no', 2, 'elevated', 'monthly', '{"answer":"yes","action":"review"}'::jsonb, false, array['mood','sleep']),
    ('mood', 50, 'mood_med_adherence', 'Are you taking mood or anxiety medications as prescribed?', 'Behavioral health medication adherence.', 'yes_no', 3, 'high', 'monthly', '{"answer":"no","action":"review"}'::jsonb, true, array['mood','medication']),
    ('mood', 60, 'mood_side_effects', 'Are you having side effects from mood or anxiety medications?', 'Side effect screen.', 'yes_no', 3, 'high', 'monthly', '{"answer":"yes","action":"provider_review"}'::jsonb, true, array['mood','side_effect']),
    ('mood', 70, 'mood_support', 'Do you have someone you can contact when you need support?', 'Support screen.', 'yes_no', 2, 'elevated', 'quarterly', '{"answer":"no","action":"needs_assessment"}'::jsonb, false, array['mood','support']),
    ('mood', 80, 'mood_safety', 'Have you had thoughts of harming yourself or others?', 'Safety screen.', 'yes_no', 5, 'critical', 'monthly', '{"answer":"yes","action":"urgent_review"}'::jsonb, true, array['mood','safety']),
    ('mood', 90, 'mood_counseling_followup', 'Are you able to attend counseling, therapy, or behavioral health follow-up if recommended?', 'Follow-up barrier.', 'yes_no', 2, 'elevated', 'quarterly', '{"answer":"no","action":"care_coordination"}'::jsonb, false, array['mood','follow_up']),
    ('mood', 100, 'mood_change_note', 'What mood or stress change should your care team know about?', 'Free-text mood update.', 'free_text', 2, 'elevated', 'monthly', '{"non_empty":true,"action":"review"}'::jsonb, false, array['mood','free_text']),

    ('falls', 10, 'falls_since_last', 'Have you fallen since your last check-in?', 'Fall event screen.', 'yes_no', 4, 'high', 'monthly', '{"answer":"yes","action":"provider_review"}'::jsonb, true, array['falls','safety']),
    ('falls', 20, 'falls_near_fall', 'Have you had a near fall or felt unsteady?', 'Near-fall screen.', 'yes_no', 3, 'high', 'monthly', '{"answer":"yes","action":"review"}'::jsonb, true, array['falls','balance']),
    ('falls', 30, 'falls_injury', 'Were you injured from a fall or near fall?', 'Fall injury screen.', 'yes_no', 5, 'critical', 'monthly', '{"answer":"yes","action":"urgent_review"}'::jsonb, true, array['falls','injury']),
    ('falls', 40, 'falls_dizziness', 'Do dizziness, weakness, or numbness make you feel at risk of falling?', 'Fall risk symptoms.', 'yes_no', 3, 'high', 'monthly', '{"answer":"yes","action":"review"}'::jsonb, true, array['falls','symptom']),
    ('falls', 50, 'falls_assistive_device', 'Do you use a cane, walker, wheelchair, or other assistive device?', 'Assistive device use.', 'yes_no', 1, 'routine', 'quarterly', '{}'::jsonb, false, array['equipment','falls']),
    ('falls', 60, 'falls_device_problem', 'Do you have problems using or getting your assistive device?', 'Equipment barrier.', 'yes_no', 3, 'high', 'monthly', '{"answer":"yes","action":"care_coordination"}'::jsonb, false, array['equipment','barrier']),
    ('falls', 70, 'falls_home_hazards', 'Are there loose rugs, poor lighting, clutter, or stairs that make your home unsafe?', 'Home hazard screen.', 'yes_no', 2, 'elevated', 'quarterly', '{"answer":"yes","action":"needs_assessment"}'::jsonb, false, array['home_safety','falls']),
    ('falls', 80, 'falls_exercise_balance', 'Are you doing balance or strength exercises if recommended?', 'Fall prevention adherence.', 'yes_no', 1, 'routine', 'quarterly', '{}'::jsonb, false, array['exercise','falls']),
    ('falls', 90, 'falls_vision_footwear', 'Have vision, footwear, or foot problems made walking less safe?', 'Contributing factors.', 'yes_no', 2, 'elevated', 'quarterly', '{"answer":"yes","action":"review"}'::jsonb, false, array['falls','vision']),
    ('falls', 100, 'falls_worry', 'Are you worried about falling?', 'Fear of falling.', 'yes_no', 2, 'elevated', 'monthly', '{"answer":"yes","action":"review"}'::jsonb, false, array['falls','confidence']),

    ('sleep', 10, 'sleep_hours', 'How many hours do you usually sleep at night?', 'Sleep duration.', 'numeric', 1, 'routine', 'monthly', '{}'::jsonb, false, array['sleep','duration']),
    ('sleep', 20, 'sleep_quality', 'How would you rate your sleep quality from 1 to 10?', 'Sleep quality rating.', 'scale_1_10', 1, 'routine', 'monthly', '{"lte":3,"action":"review"}'::jsonb, false, array['sleep','quality']),
    ('sleep', 30, 'sleep_daytime_sleepy', 'Are you very sleepy during the day?', 'Daytime sleepiness.', 'yes_no', 2, 'elevated', 'monthly', '{"answer":"yes","action":"review"}'::jsonb, false, array['sleep','fatigue']),
    ('sleep', 40, 'sleep_breathing', 'Has anyone noticed loud snoring, pauses in breathing, or choking during sleep?', 'Sleep apnea symptom screen.', 'yes_no', 3, 'high', 'quarterly', '{"answer":"yes","action":"review"}'::jsonb, true, array['sleep','breathing']),
    ('sleep', 50, 'sleep_pap_use', 'If you use CPAP, BiPAP, or another sleep device, are you using it as recommended?', 'PAP adherence.', 'yes_no', 3, 'high', 'monthly', '{"answer":"no","action":"review"}'::jsonb, true, array['sleep','equipment']),
    ('sleep', 60, 'sleep_pap_problem', 'Do you have mask, tubing, pressure, dryness, or equipment problems with your sleep device?', 'PAP equipment barrier.', 'yes_no', 2, 'elevated', 'monthly', '{"answer":"yes","action":"care_coordination"}'::jsonb, false, array['sleep','equipment']),
    ('sleep', 70, 'sleep_pain_or_bathroom', 'Do pain, breathing, bathroom trips, or anxiety wake you up?', 'Sleep interruption causes.', 'yes_no', 2, 'elevated', 'monthly', '{"answer":"yes","action":"review"}'::jsonb, false, array['sleep','barrier']),
    ('sleep', 80, 'sleep_medication', 'Are you taking sleep medications or supplements?', 'Sleep medication screen.', 'yes_no', 2, 'elevated', 'quarterly', '{}'::jsonb, false, array['sleep','medication']),
    ('sleep', 90, 'sleep_falls_risk', 'Have sleepiness or sleep medication made you feel at risk of falling?', 'Sleep safety screen.', 'yes_no', 3, 'high', 'monthly', '{"answer":"yes","action":"review"}'::jsonb, true, array['sleep','falls']),
    ('sleep', 100, 'sleep_goal', 'What sleep concern would you most like help with?', 'Free-text sleep goal.', 'free_text', 1, 'routine', 'quarterly', '{}'::jsonb, false, array['sleep','goal']),

    ('pain', 10, 'pain_score', 'What is your pain level today from 1 to 10?', 'Pain intensity.', 'scale_1_10', 3, 'high', 'monthly', '{"gte":8,"action":"provider_review"}'::jsonb, true, array['pain','scale']),
    ('pain', 20, 'pain_location', 'Where is your pain located?', 'Pain location.', 'free_text', 2, 'elevated', 'monthly', '{}'::jsonb, false, array['pain','location']),
    ('pain', 30, 'pain_worse', 'Is your pain worse than usual?', 'Pain worsening screen.', 'yes_no', 3, 'high', 'monthly', '{"answer":"yes","action":"review"}'::jsonb, true, array['pain','worsening']),
    ('pain', 40, 'pain_function', 'Is pain limiting walking, sleep, self-care, or daily activities?', 'Functional impact.', 'yes_no', 3, 'high', 'monthly', '{"answer":"yes","action":"review"}'::jsonb, true, array['pain','function']),
    ('pain', 50, 'pain_med_effective', 'Are your pain treatments helping enough?', 'Treatment effect.', 'yes_no', 2, 'elevated', 'monthly', '{"answer":"no","action":"review"}'::jsonb, false, array['pain','treatment']),
    ('pain', 60, 'pain_med_side_effect', 'Are pain medicines causing constipation, sleepiness, confusion, or other side effects?', 'Medication safety.', 'yes_no', 4, 'high', 'monthly', '{"answer":"yes","action":"provider_review"}'::jsonb, true, array['pain','side_effect']),
    ('pain', 70, 'pain_new_weakness', 'Have you had new weakness, numbness, loss of bladder control, or fever with pain?', 'Pain red flags.', 'yes_no', 5, 'critical', 'monthly', '{"answer":"yes","action":"urgent_review"}'::jsonb, true, array['pain','red_flag']),
    ('pain', 80, 'pain_non_med', 'Are you using non-medication strategies such as heat, ice, stretching, therapy, or relaxation?', 'Self-management screen.', 'yes_no', 1, 'routine', 'quarterly', '{}'::jsonb, false, array['pain','self_management']),
    ('pain', 90, 'pain_refill_or_access', 'Do you have trouble getting pain medicines, therapy, or supplies?', 'Access barrier.', 'yes_no', 2, 'elevated', 'monthly', '{"answer":"yes","action":"care_coordination"}'::jsonb, false, array['pain','access']),
    ('pain', 100, 'pain_goal', 'What pain-related activity would you most like to improve?', 'Pain goal.', 'free_text', 1, 'routine', 'quarterly', '{}'::jsonb, false, array['pain','goal']),

    ('nutrition', 10, 'nutrition_appetite', 'Has your appetite changed since your last check-in?', 'Appetite screen.', 'yes_no', 2, 'elevated', 'monthly', '{"answer":"yes","action":"review"}'::jsonb, false, array['nutrition','appetite']),
    ('nutrition', 20, 'nutrition_meals', 'Are you usually able to eat regular meals?', 'Meal intake screen.', 'yes_no', 2, 'elevated', 'monthly', '{"answer":"no","action":"barrier_review"}'::jsonb, false, array['nutrition','meals']),
    ('nutrition', 30, 'nutrition_weight_change', 'Have you had unplanned weight gain or weight loss?', 'Weight change screen.', 'yes_no', 3, 'high', 'monthly', '{"answer":"yes","action":"review"}'::jsonb, true, array['nutrition','weight']),
    ('nutrition', 40, 'nutrition_diet_plan', 'Are you able to follow the diet plan recommended by your care team?', 'Diet adherence.', 'yes_no', 2, 'elevated', 'monthly', '{"answer":"no","action":"education"}'::jsonb, false, array['nutrition','adherence']),
    ('nutrition', 50, 'nutrition_food_access', 'Do you have enough food that fits your health needs?', 'Food insecurity screen.', 'yes_no', 3, 'high', 'monthly', '{"answer":"no","action":"needs_assessment"}'::jsonb, false, array['nutrition','access']),
    ('nutrition', 60, 'nutrition_swallowing', 'Have you had trouble chewing, swallowing, nausea, vomiting, or diarrhea?', 'GI barrier screen.', 'yes_no', 3, 'high', 'monthly', '{"answer":"yes","action":"review"}'::jsonb, true, array['nutrition','symptom']),
    ('nutrition', 70, 'nutrition_hydration', 'Are you able to drink fluids as recommended by your care team?', 'Hydration adherence.', 'yes_no', 2, 'elevated', 'monthly', '{"answer":"no","action":"education"}'::jsonb, false, array['nutrition','hydration']),
    ('nutrition', 80, 'nutrition_supplements', 'Are you taking recommended vitamins, supplements, or nutrition drinks?', 'Supplement adherence.', 'yes_no', 1, 'routine', 'quarterly', '{}'::jsonb, false, array['nutrition','supplement']),
    ('nutrition', 90, 'nutrition_cooking_barrier', 'Do cost, transportation, cooking, or help at home make eating well harder?', 'Practical barrier screen.', 'yes_no', 3, 'high', 'monthly', '{"answer":"yes","action":"needs_assessment"}'::jsonb, false, array['nutrition','barrier']),
    ('nutrition', 100, 'nutrition_goal', 'What nutrition question or goal should your care team know about?', 'Nutrition education need.', 'free_text', 1, 'routine', 'quarterly', '{}'::jsonb, false, array['nutrition','education']),

    ('exercise', 10, 'exercise_minutes', 'About how many minutes of physical activity did you do in the past week?', 'Activity amount.', 'numeric', 1, 'routine', 'monthly', '{}'::jsonb, false, array['exercise','activity']),
    ('exercise', 20, 'exercise_goal_met', 'Were you able to follow your activity or exercise goal?', 'Exercise adherence.', 'yes_no', 1, 'routine', 'monthly', '{}'::jsonb, false, array['exercise','goal']),
    ('exercise', 30, 'exercise_symptoms', 'Do chest pain, shortness of breath, dizziness, or pain limit your activity?', 'Exertional symptom screen.', 'yes_no', 4, 'high', 'monthly', '{"answer":"yes","action":"provider_review"}'::jsonb, true, array['exercise','symptom']),
    ('exercise', 40, 'exercise_walking_limit', 'Has your walking distance or stamina changed?', 'Functional progression.', 'yes_no', 2, 'elevated', 'monthly', '{"answer":"yes","action":"review"}'::jsonb, false, array['exercise','function']),
    ('exercise', 50, 'exercise_fall_fear', 'Does fear of falling keep you from being active?', 'Fall barrier.', 'yes_no', 2, 'elevated', 'quarterly', '{"answer":"yes","action":"review"}'::jsonb, false, array['exercise','falls']),
    ('exercise', 60, 'exercise_equipment_need', 'Do you need equipment, therapy, or a safe place to exercise?', 'Resource barrier.', 'yes_no', 2, 'elevated', 'quarterly', '{"answer":"yes","action":"care_coordination"}'::jsonb, false, array['exercise','equipment']),
    ('exercise', 70, 'exercise_provider_restriction', 'Has a clinician told you to limit activity or avoid exercise?', 'Restriction awareness.', 'yes_no', 2, 'elevated', 'quarterly', '{}'::jsonb, false, array['exercise','restriction']),
    ('exercise', 80, 'exercise_strength_balance', 'Are you doing recommended strength, stretching, or balance exercises?', 'Exercise type adherence.', 'yes_no', 1, 'routine', 'quarterly', '{}'::jsonb, false, array['exercise','self_management']),
    ('exercise', 90, 'exercise_support', 'Would coaching or reminders help you stay active?', 'Support need.', 'yes_no', 1, 'routine', 'quarterly', '{}'::jsonb, false, array['exercise','support']),
    ('exercise', 100, 'exercise_goal', 'What activity goal would you like to work on before the next check-in?', 'Activity goal.', 'free_text', 1, 'routine', 'quarterly', '{}'::jsonb, false, array['exercise','goal']),

    ('equipment', 10, 'equipment_has_needed', 'Do you have the medical equipment or supplies you need at home?', 'Equipment availability.', 'yes_no', 3, 'high', 'monthly', '{"answer":"no","action":"care_coordination"}'::jsonb, false, array['equipment','access']),
    ('equipment', 20, 'equipment_working', 'Is your medical equipment working correctly?', 'Equipment function.', 'yes_no', 3, 'high', 'monthly', '{"answer":"no","action":"care_coordination"}'::jsonb, false, array['equipment','function']),
    ('equipment', 30, 'equipment_understands_use', 'Do you understand how to use your equipment safely?', 'Equipment education.', 'yes_no', 2, 'elevated', 'quarterly', '{"answer":"no","action":"education"}'::jsonb, false, array['equipment','education']),
    ('equipment', 40, 'equipment_supply_refill', 'Do you need replacement supplies, batteries, tubing, sensors, or accessories?', 'Supply refill need.', 'yes_no', 2, 'elevated', 'monthly', '{"answer":"yes","action":"care_coordination"}'::jsonb, false, array['equipment','supplies']),
    ('equipment', 50, 'equipment_cost_barrier', 'Is cost or insurance preventing you from getting equipment or supplies?', 'Cost barrier.', 'yes_no', 3, 'high', 'monthly', '{"answer":"yes","action":"needs_assessment"}'::jsonb, false, array['equipment','cost']),
    ('equipment', 60, 'equipment_training_need', 'Would you like someone to review how to use your equipment?', 'Training need.', 'yes_no', 1, 'routine', 'quarterly', '{}'::jsonb, false, array['equipment','training']),
    ('equipment', 70, 'equipment_safety_issue', 'Has equipment use caused a fall, skin problem, breathing problem, or other safety concern?', 'Equipment safety screen.', 'yes_no', 4, 'high', 'monthly', '{"answer":"yes","action":"provider_review"}'::jsonb, true, array['equipment','safety']),
    ('equipment', 80, 'equipment_home_fit', 'Does your equipment fit your home space and daily routine?', 'Home fit barrier.', 'yes_no', 1, 'routine', 'quarterly', '{}'::jsonb, false, array['equipment','home']),
    ('equipment', 90, 'equipment_vendor_issue', 'Are you having trouble contacting the equipment supplier or vendor?', 'Vendor barrier.', 'yes_no', 2, 'elevated', 'monthly', '{"answer":"yes","action":"care_coordination"}'::jsonb, false, array['equipment','vendor']),
    ('equipment', 100, 'equipment_other_need', 'What equipment or supply issue should your care team know about?', 'Free-text equipment need.', 'free_text', 1, 'routine', 'monthly', '{}'::jsonb, false, array['equipment','free_text']),

    ('transportation', 10, 'transport_appointments', 'Has transportation made it hard to attend appointments?', 'Appointment transportation barrier.', 'yes_no', 3, 'high', 'monthly', '{"answer":"yes","action":"needs_assessment"}'::jsonb, false, array['transportation','appointment']),
    ('transportation', 20, 'transport_pharmacy', 'Has transportation made it hard to pick up medications or supplies?', 'Pharmacy transportation barrier.', 'yes_no', 3, 'high', 'monthly', '{"answer":"yes","action":"needs_assessment"}'::jsonb, false, array['transportation','medication']),
    ('transportation', 30, 'transport_labs', 'Has transportation made it hard to complete lab work, imaging, or testing?', 'Testing transportation barrier.', 'yes_no', 2, 'elevated', 'monthly', '{"answer":"yes","action":"care_coordination"}'::jsonb, false, array['transportation','testing']),
    ('transportation', 40, 'transport_reliable', 'Do you have reliable transportation for upcoming health needs?', 'Reliability screen.', 'yes_no', 2, 'elevated', 'quarterly', '{"answer":"no","action":"needs_assessment"}'::jsonb, false, array['transportation','reliability']),
    ('transportation', 50, 'transport_cost', 'Is transportation cost a problem?', 'Cost barrier.', 'yes_no', 2, 'elevated', 'quarterly', '{"answer":"yes","action":"needs_assessment"}'::jsonb, false, array['transportation','cost']),
    ('transportation', 60, 'transport_mobility', 'Do mobility, wheelchair access, oxygen, or caregiver needs affect transportation?', 'Accessibility barrier.', 'yes_no', 3, 'high', 'quarterly', '{"answer":"yes","action":"needs_assessment"}'::jsonb, false, array['transportation','accessibility']),
    ('transportation', 70, 'transport_missed_care', 'Have you missed or delayed care because of transportation?', 'Missed care screen.', 'yes_no', 3, 'high', 'monthly', '{"answer":"yes","action":"care_coordination"}'::jsonb, false, array['transportation','missed_care']),
    ('transportation', 80, 'transport_support_person', 'Is there someone who can help you get to health appointments if needed?', 'Support screen.', 'yes_no', 1, 'routine', 'quarterly', '{}'::jsonb, false, array['transportation','support']),
    ('transportation', 90, 'transport_virtual_ok', 'Would phone or video visits help when transportation is difficult?', 'Alternative visit screen.', 'yes_no', 1, 'routine', 'quarterly', '{}'::jsonb, false, array['transportation','telehealth']),
    ('transportation', 100, 'transport_next_need', 'What upcoming visit or errand may need transportation help?', 'Free-text transportation need.', 'free_text', 1, 'routine', 'monthly', '{}'::jsonb, false, array['transportation','free_text']),

    ('medication_access', 10, 'med_access_refills', 'Do you have enough medication until your next refill?', 'Medication supply screen.', 'yes_no', 3, 'high', 'monthly', '{"answer":"no","action":"care_coordination"}'::jsonb, false, array['medication','access']),
    ('medication_access', 20, 'med_access_cost', 'Is medication cost causing you to skip, delay, or ration doses?', 'Medication cost barrier.', 'yes_no', 4, 'high', 'monthly', '{"answer":"yes","action":"needs_assessment"}'::jsonb, true, array['medication','cost']),
    ('medication_access', 30, 'med_access_pharmacy', 'Are you having trouble with the pharmacy, mail order, or delivery?', 'Pharmacy barrier.', 'yes_no', 3, 'high', 'monthly', '{"answer":"yes","action":"care_coordination"}'::jsonb, false, array['medication','pharmacy']),
    ('medication_access', 40, 'med_access_prior_auth', 'Were any medications delayed because of insurance approval or prior authorization?', 'Insurance barrier.', 'yes_no', 3, 'high', 'monthly', '{"answer":"yes","action":"care_coordination"}'::jsonb, false, array['medication','insurance']),
    ('medication_access', 50, 'med_access_side_effect_switch', 'Did side effects make you want to stop or change a medication?', 'Potential treatment change.', 'yes_no', 4, 'high', 'monthly', '{"answer":"yes","action":"provider_review"}'::jsonb, true, array['medication','side_effect']),
    ('medication_access', 60, 'med_access_complexity', 'Is your medication schedule too confusing or hard to follow?', 'Regimen complexity.', 'yes_no', 3, 'high', 'monthly', '{"answer":"yes","action":"review"}'::jsonb, true, array['medication','complexity']),
    ('medication_access', 70, 'med_access_transport', 'Is transportation preventing you from getting medications?', 'Transportation barrier.', 'yes_no', 3, 'high', 'monthly', '{"answer":"yes","action":"needs_assessment"}'::jsonb, false, array['medication','transportation']),
    ('medication_access', 80, 'med_access_disposal', 'Do you need help safely disposing of old or stopped medications?', 'Medication safety education.', 'yes_no', 1, 'routine', 'quarterly', '{}'::jsonb, false, array['medication','safety']),
    ('medication_access', 90, 'med_access_delivery', 'Would medication synchronization, delivery, or reminders help?', 'Support option screen.', 'yes_no', 1, 'routine', 'quarterly', '{}'::jsonb, false, array['medication','support']),
    ('medication_access', 100, 'med_access_detail', 'Which medication access problem should your care team know about?', 'Free-text medication access need.', 'free_text', 2, 'elevated', 'monthly', '{}'::jsonb, false, array['medication','free_text']),

    ('hospitalizations', 10, 'hosp_since_last', 'Have you been admitted to a hospital since your last check-in?', 'Hospitalization screen.', 'yes_no', 5, 'critical', 'monthly', '{"answer":"yes","action":"provider_review"}'::jsonb, true, array['hospitalization','utilization']),
    ('hospitalizations', 20, 'hosp_dates', 'What were the hospital admission and discharge dates?', 'Hospitalization dates.', 'free_text', 3, 'high', 'monthly', '{}'::jsonb, true, array['hospitalization','date']),
    ('hospitalizations', 30, 'hosp_reason', 'What was the main reason for the hospitalization?', 'Hospitalization reason.', 'free_text', 3, 'high', 'monthly', '{}'::jsonb, true, array['hospitalization','reason']),
    ('hospitalizations', 40, 'hosp_med_changes', 'Were any medications changed at discharge?', 'Discharge medication changes.', 'yes_no', 4, 'high', 'monthly', '{"answer":"yes","action":"medication_reconciliation"}'::jsonb, true, array['hospitalization','medication']),
    ('hospitalizations', 50, 'hosp_discharge_instructions', 'Do you understand your discharge instructions?', 'Discharge understanding.', 'yes_no', 4, 'high', 'monthly', '{"answer":"no","action":"care_coordination"}'::jsonb, true, array['hospitalization','education']),
    ('hospitalizations', 60, 'hosp_followup_scheduled', 'Is your hospital follow-up appointment scheduled?', 'Post-discharge follow-up.', 'yes_no', 4, 'high', 'monthly', '{"answer":"no","action":"care_coordination"}'::jsonb, true, array['hospitalization','follow_up']),
    ('hospitalizations', 70, 'hosp_home_services', 'Were home health, therapy, oxygen, equipment, or supplies ordered?', 'Post-discharge service needs.', 'yes_no', 3, 'high', 'monthly', '{"answer":"yes","action":"care_coordination"}'::jsonb, false, array['hospitalization','services']),
    ('hospitalizations', 80, 'hosp_symptoms_returned', 'Have symptoms returned or worsened after discharge?', 'Post-discharge warning screen.', 'yes_no', 5, 'critical', 'monthly', '{"answer":"yes","action":"urgent_review"}'::jsonb, true, array['hospitalization','red_flag']),
    ('hospitalizations', 90, 'hosp_readmission_concern', 'Are you worried you may need to return to the hospital?', 'Readmission concern.', 'yes_no', 4, 'high', 'monthly', '{"answer":"yes","action":"provider_review"}'::jsonb, true, array['hospitalization','concern']),
    ('hospitalizations', 100, 'hosp_needs', 'What help do you need after the hospitalization?', 'Post-hospital needs.', 'free_text', 2, 'elevated', 'monthly', '{}'::jsonb, false, array['hospitalization','needs']),

    ('er_visits', 10, 'er_since_last', 'Have you been to the emergency room or urgent care since your last check-in?', 'ER utilization screen.', 'yes_no', 5, 'critical', 'monthly', '{"answer":"yes","action":"provider_review"}'::jsonb, true, array['er','utilization']),
    ('er_visits', 20, 'er_date', 'What date did you go to the ER or urgent care?', 'ER visit date.', 'date', 3, 'high', 'monthly', '{}'::jsonb, true, array['er','date']),
    ('er_visits', 30, 'er_reason', 'What was the main reason for the ER or urgent care visit?', 'ER visit reason.', 'free_text', 3, 'high', 'monthly', '{}'::jsonb, true, array['er','reason']),
    ('er_visits', 40, 'er_discharge_meds', 'Were any medications started, stopped, or changed after the visit?', 'ER medication changes.', 'yes_no', 4, 'high', 'monthly', '{"answer":"yes","action":"medication_reconciliation"}'::jsonb, true, array['er','medication']),
    ('er_visits', 50, 'er_followup_needed', 'Were you told to follow up with a doctor, specialist, lab, or test?', 'Follow-up need.', 'yes_no', 3, 'high', 'monthly', '{"answer":"yes","action":"care_coordination"}'::jsonb, false, array['er','follow_up']),
    ('er_visits', 60, 'er_followup_done', 'Have you completed the recommended follow-up after the ER or urgent care visit?', 'Follow-up completion.', 'yes_no', 3, 'high', 'monthly', '{"answer":"no","action":"care_coordination"}'::jsonb, false, array['er','follow_up']),
    ('er_visits', 70, 'er_symptoms_resolved', 'Have the symptoms that led to the visit resolved?', 'Symptom resolution.', 'yes_no', 4, 'high', 'monthly', '{"answer":"no","action":"provider_review"}'::jsonb, true, array['er','symptom']),
    ('er_visits', 80, 'er_return_warning', 'Were you given warning signs for when to seek urgent care again?', 'Education screen.', 'yes_no', 2, 'elevated', 'monthly', '{"answer":"no","action":"education"}'::jsonb, false, array['er','education']),
    ('er_visits', 90, 'er_prevention', 'Could anything have helped you avoid the ER or urgent care visit?', 'Avoidability screen.', 'free_text', 2, 'elevated', 'monthly', '{}'::jsonb, false, array['er','prevention']),
    ('er_visits', 100, 'er_current_need', 'What help do you need after the ER or urgent care visit?', 'Post-ER needs.', 'free_text', 2, 'elevated', 'monthly', '{}'::jsonb, false, array['er','needs']),

    ('care_coordination', 10, 'coord_upcoming_appointments', 'Do you have upcoming appointments, tests, or referrals you need help tracking?', 'Care coordination need.', 'yes_no', 2, 'elevated', 'monthly', '{"answer":"yes","action":"care_coordination"}'::jsonb, false, array['coordination','appointment']),
    ('care_coordination', 20, 'coord_missed_appointment', 'Have you missed any appointment, lab, imaging, or referral since your last check-in?', 'Missed care screen.', 'yes_no', 3, 'high', 'monthly', '{"answer":"yes","action":"care_coordination"}'::jsonb, false, array['coordination','missed_care']),
    ('care_coordination', 30, 'coord_waiting_results', 'Are you waiting for test results, referrals, forms, or calls from a care team?', 'Pending care item.', 'yes_no', 2, 'elevated', 'monthly', '{"answer":"yes","action":"care_coordination"}'::jsonb, false, array['coordination','pending']),
    ('care_coordination', 40, 'coord_specialist_plan', 'Do you understand the plan from your specialist or other clinician?', 'Plan understanding.', 'yes_no', 2, 'elevated', 'quarterly', '{"answer":"no","action":"education"}'::jsonb, false, array['coordination','education']),
    ('care_coordination', 50, 'coord_forms', 'Do you need help with forms, records, insurance, or medical equipment paperwork?', 'Administrative barrier.', 'yes_no', 2, 'elevated', 'monthly', '{"answer":"yes","action":"care_coordination"}'::jsonb, false, array['coordination','paperwork']),
    ('care_coordination', 60, 'coord_home_support', 'Do you need more help at home with care, daily tasks, or safety?', 'Home support need.', 'yes_no', 3, 'high', 'quarterly', '{"answer":"yes","action":"needs_assessment"}'::jsonb, false, array['coordination','home_support']),
    ('care_coordination', 70, 'coord_caregiver', 'Should a caregiver or family member be included in care updates?', 'Caregiver involvement.', 'yes_no', 1, 'routine', 'quarterly', '{}'::jsonb, false, array['coordination','caregiver']),
    ('care_coordination', 80, 'coord_contact_info', 'Has your phone, address, pharmacy, or preferred contact method changed?', 'Contact data integrity.', 'yes_no', 2, 'elevated', 'quarterly', '{"answer":"yes","action":"update_record"}'::jsonb, false, array['coordination','contact']),
    ('care_coordination', 90, 'coord_priority', 'What is the most important thing your care team can help with this month?', 'Patient-prioritized need.', 'free_text', 1, 'routine', 'monthly', '{}'::jsonb, false, array['coordination','priority']),
    ('care_coordination', 100, 'coord_questions', 'Do you have any questions for your care team?', 'General care-team question.', 'yes_no', 1, 'routine', 'monthly', '{"answer":"yes","action":"care_coordination"}'::jsonb, false, array['coordination','question']),

    ('functional_status', 10, 'function_daily_tasks', 'Are you having more difficulty with bathing, dressing, eating, toileting, or transferring?', 'ADL screen.', 'yes_no', 3, 'high', 'monthly', '{"answer":"yes","action":"needs_assessment"}'::jsonb, true, array['function','adl']),
    ('functional_status', 20, 'function_iadl_tasks', 'Are you having more difficulty managing meals, medications, shopping, transportation, or finances?', 'IADL screen.', 'yes_no', 3, 'high', 'monthly', '{"answer":"yes","action":"needs_assessment"}'::jsonb, false, array['function','iadl']),
    ('functional_status', 30, 'function_walking', 'Has walking, standing, or getting around become harder?', 'Mobility progression.', 'yes_no', 3, 'high', 'monthly', '{"answer":"yes","action":"review"}'::jsonb, true, array['function','mobility']),
    ('functional_status', 40, 'function_transfer', 'Do you need more help getting in or out of bed, chairs, the shower, or a car?', 'Transfer safety.', 'yes_no', 3, 'high', 'monthly', '{"answer":"yes","action":"needs_assessment"}'::jsonb, false, array['function','transfer']),
    ('functional_status', 50, 'function_caregiver_change', 'Has caregiver help changed or become less available?', 'Caregiver support screen.', 'yes_no', 3, 'high', 'monthly', '{"answer":"yes","action":"needs_assessment"}'::jsonb, false, array['function','caregiver']),
    ('functional_status', 60, 'function_home_safety', 'Do you feel safe at home with your current level of help and equipment?', 'Home safety screen.', 'yes_no', 4, 'high', 'monthly', '{"answer":"no","action":"needs_assessment"}'::jsonb, true, array['function','home_safety']),
    ('functional_status', 70, 'function_memory', 'Have memory or confusion made daily tasks harder?', 'Cognitive function screen.', 'yes_no', 3, 'high', 'monthly', '{"answer":"yes","action":"review"}'::jsonb, true, array['function','cognition']),
    ('functional_status', 80, 'function_work_or_social', 'Has your condition limited work, hobbies, social activity, or leaving home?', 'Participation impact.', 'yes_no', 2, 'elevated', 'monthly', '{"answer":"yes","action":"review"}'::jsonb, false, array['function','participation']),
    ('functional_status', 90, 'function_change_score', 'How would you rate your ability to manage daily activities from 1 to 10?', 'Functional status rating.', 'scale_1_10', 2, 'elevated', 'monthly', '{"lte":4,"action":"review"}'::jsonb, false, array['function','scale']),
    ('functional_status', 100, 'function_goal', 'What daily activity would you most like to make easier?', 'Functional goal.', 'free_text', 1, 'routine', 'quarterly', '{}'::jsonb, false, array['function','goal'])
)
insert into public.clinical_questions (
  slug,
  question_text,
  description,
  answer_type,
  required,
  severity,
  clinical_importance,
  suggested_cadence,
  follow_up_trigger,
  provider_review_required,
  retired,
  version,
  active,
  language,
  metadata
)
select distinct on (slug)
  slug,
  question_text,
  description,
  answer_type,
  true,
  severity,
  clinical_importance,
  suggested_cadence,
  follow_up_trigger,
  provider_review_required,
  false,
  1,
  true,
  'en',
  jsonb_build_object('seed_family', family_slug, 'seed_tags', to_jsonb(tags))
from seed
on conflict (slug) do update
set question_text = excluded.question_text,
    description = excluded.description,
    answer_type = excluded.answer_type,
    severity = excluded.severity,
    clinical_importance = excluded.clinical_importance,
    suggested_cadence = excluded.suggested_cadence,
    follow_up_trigger = excluded.follow_up_trigger,
    provider_review_required = excluded.provider_review_required,
    metadata = excluded.metadata,
    active = true,
    retired = false;

with seed(family_slug, sort_order, slug) as (
  values
    ('medication_adherence', 10, 'med_current_list_review'), ('medication_adherence', 20, 'med_taking_as_prescribed'), ('medication_adherence', 30, 'med_missed_doses'), ('medication_adherence', 40, 'med_recent_change'), ('medication_adherence', 50, 'med_side_effects'), ('medication_adherence', 60, 'med_understands_schedule'), ('medication_adherence', 70, 'med_stopped_without_direction'), ('medication_adherence', 80, 'med_refill_needed'), ('medication_adherence', 90, 'med_uses_organizer'), ('medication_adherence', 100, 'med_questions_for_team'),
    ('blood_pressure', 10, 'bp_latest_reading'), ('blood_pressure', 20, 'bp_checks_home'), ('blood_pressure', 30, 'bp_high_readings'), ('blood_pressure', 40, 'bp_low_readings'), ('blood_pressure', 50, 'bp_dizziness'), ('blood_pressure', 60, 'bp_headache_vision'), ('blood_pressure', 70, 'bp_missed_meds'), ('blood_pressure', 80, 'bp_has_cuff'), ('blood_pressure', 90, 'bp_cuff_difficulty'), ('blood_pressure', 100, 'bp_knows_target'),
    ('blood_glucose', 10, 'bg_latest_reading'), ('blood_glucose', 20, 'bg_checks_home'), ('blood_glucose', 30, 'bg_low_episode'), ('blood_glucose', 40, 'bg_high_episode'), ('blood_glucose', 50, 'bg_symptoms'), ('blood_glucose', 60, 'bg_insulin_or_med_missed'), ('blood_glucose', 70, 'bg_supplies'), ('blood_glucose', 80, 'bg_food_barriers'), ('blood_glucose', 90, 'bg_foot_issue'), ('blood_glucose', 100, 'bg_knows_plan'),
    ('weight_monitoring', 10, 'weight_latest'), ('weight_monitoring', 20, 'weight_tracking'), ('weight_monitoring', 30, 'weight_gain_fast'), ('weight_monitoring', 40, 'weight_loss_unplanned'), ('weight_monitoring', 50, 'weight_swelling'), ('weight_monitoring', 60, 'weight_breathing_flat'), ('weight_monitoring', 70, 'weight_appetite'), ('weight_monitoring', 80, 'weight_scale_available'), ('weight_monitoring', 90, 'weight_diet_plan'), ('weight_monitoring', 100, 'weight_questions'),
    ('vision_changes', 10, 'vision_new_change'), ('vision_changes', 20, 'vision_sudden_loss'), ('vision_changes', 30, 'vision_pain_redness'), ('vision_changes', 40, 'vision_drops_adherence'), ('vision_changes', 50, 'vision_drop_access'), ('vision_changes', 60, 'vision_daily_tasks'), ('vision_changes', 70, 'vision_followup_scheduled'), ('vision_changes', 80, 'vision_missed_visit'), ('vision_changes', 90, 'vision_home_safety'), ('vision_changes', 100, 'vision_questions'),
    ('respiratory_symptoms', 10, 'resp_shortness_breath'), ('respiratory_symptoms', 20, 'resp_cough_change'), ('respiratory_symptoms', 30, 'resp_sputum_change'), ('respiratory_symptoms', 40, 'resp_wheezing'), ('respiratory_symptoms', 50, 'resp_rescue_inhaler'), ('respiratory_symptoms', 60, 'resp_controller_adherence'), ('respiratory_symptoms', 70, 'resp_pulse_ox'), ('respiratory_symptoms', 80, 'resp_oxygen_equipment'), ('respiratory_symptoms', 90, 'resp_fever'), ('respiratory_symptoms', 100, 'resp_action_plan'),
    ('mood', 10, 'mood_interest'), ('mood', 20, 'mood_down'), ('mood', 30, 'mood_anxiety'), ('mood', 40, 'mood_sleep_appetite'), ('mood', 50, 'mood_med_adherence'), ('mood', 60, 'mood_side_effects'), ('mood', 70, 'mood_support'), ('mood', 80, 'mood_safety'), ('mood', 90, 'mood_counseling_followup'), ('mood', 100, 'mood_change_note'),
    ('falls', 10, 'falls_since_last'), ('falls', 20, 'falls_near_fall'), ('falls', 30, 'falls_injury'), ('falls', 40, 'falls_dizziness'), ('falls', 50, 'falls_assistive_device'), ('falls', 60, 'falls_device_problem'), ('falls', 70, 'falls_home_hazards'), ('falls', 80, 'falls_exercise_balance'), ('falls', 90, 'falls_vision_footwear'), ('falls', 100, 'falls_worry'),
    ('sleep', 10, 'sleep_hours'), ('sleep', 20, 'sleep_quality'), ('sleep', 30, 'sleep_daytime_sleepy'), ('sleep', 40, 'sleep_breathing'), ('sleep', 50, 'sleep_pap_use'), ('sleep', 60, 'sleep_pap_problem'), ('sleep', 70, 'sleep_pain_or_bathroom'), ('sleep', 80, 'sleep_medication'), ('sleep', 90, 'sleep_falls_risk'), ('sleep', 100, 'sleep_goal'),
    ('pain', 10, 'pain_score'), ('pain', 20, 'pain_location'), ('pain', 30, 'pain_worse'), ('pain', 40, 'pain_function'), ('pain', 50, 'pain_med_effective'), ('pain', 60, 'pain_med_side_effect'), ('pain', 70, 'pain_new_weakness'), ('pain', 80, 'pain_non_med'), ('pain', 90, 'pain_refill_or_access'), ('pain', 100, 'pain_goal'),
    ('nutrition', 10, 'nutrition_appetite'), ('nutrition', 20, 'nutrition_meals'), ('nutrition', 30, 'nutrition_weight_change'), ('nutrition', 40, 'nutrition_diet_plan'), ('nutrition', 50, 'nutrition_food_access'), ('nutrition', 60, 'nutrition_swallowing'), ('nutrition', 70, 'nutrition_hydration'), ('nutrition', 80, 'nutrition_supplements'), ('nutrition', 90, 'nutrition_cooking_barrier'), ('nutrition', 100, 'nutrition_goal'),
    ('exercise', 10, 'exercise_minutes'), ('exercise', 20, 'exercise_goal_met'), ('exercise', 30, 'exercise_symptoms'), ('exercise', 40, 'exercise_walking_limit'), ('exercise', 50, 'exercise_fall_fear'), ('exercise', 60, 'exercise_equipment_need'), ('exercise', 70, 'exercise_provider_restriction'), ('exercise', 80, 'exercise_strength_balance'), ('exercise', 90, 'exercise_support'), ('exercise', 100, 'exercise_goal'),
    ('equipment', 10, 'equipment_has_needed'), ('equipment', 20, 'equipment_working'), ('equipment', 30, 'equipment_understands_use'), ('equipment', 40, 'equipment_supply_refill'), ('equipment', 50, 'equipment_cost_barrier'), ('equipment', 60, 'equipment_training_need'), ('equipment', 70, 'equipment_safety_issue'), ('equipment', 80, 'equipment_home_fit'), ('equipment', 90, 'equipment_vendor_issue'), ('equipment', 100, 'equipment_other_need'),
    ('transportation', 10, 'transport_appointments'), ('transportation', 20, 'transport_pharmacy'), ('transportation', 30, 'transport_labs'), ('transportation', 40, 'transport_reliable'), ('transportation', 50, 'transport_cost'), ('transportation', 60, 'transport_mobility'), ('transportation', 70, 'transport_missed_care'), ('transportation', 80, 'transport_support_person'), ('transportation', 90, 'transport_virtual_ok'), ('transportation', 100, 'transport_next_need'),
    ('medication_access', 10, 'med_access_refills'), ('medication_access', 20, 'med_access_cost'), ('medication_access', 30, 'med_access_pharmacy'), ('medication_access', 40, 'med_access_prior_auth'), ('medication_access', 50, 'med_access_side_effect_switch'), ('medication_access', 60, 'med_access_complexity'), ('medication_access', 70, 'med_access_transport'), ('medication_access', 80, 'med_access_disposal'), ('medication_access', 90, 'med_access_delivery'), ('medication_access', 100, 'med_access_detail'),
    ('hospitalizations', 10, 'hosp_since_last'), ('hospitalizations', 20, 'hosp_dates'), ('hospitalizations', 30, 'hosp_reason'), ('hospitalizations', 40, 'hosp_med_changes'), ('hospitalizations', 50, 'hosp_discharge_instructions'), ('hospitalizations', 60, 'hosp_followup_scheduled'), ('hospitalizations', 70, 'hosp_home_services'), ('hospitalizations', 80, 'hosp_symptoms_returned'), ('hospitalizations', 90, 'hosp_readmission_concern'), ('hospitalizations', 100, 'hosp_needs'),
    ('er_visits', 10, 'er_since_last'), ('er_visits', 20, 'er_date'), ('er_visits', 30, 'er_reason'), ('er_visits', 40, 'er_discharge_meds'), ('er_visits', 50, 'er_followup_needed'), ('er_visits', 60, 'er_followup_done'), ('er_visits', 70, 'er_symptoms_resolved'), ('er_visits', 80, 'er_return_warning'), ('er_visits', 90, 'er_prevention'), ('er_visits', 100, 'er_current_need'),
    ('care_coordination', 10, 'coord_upcoming_appointments'), ('care_coordination', 20, 'coord_missed_appointment'), ('care_coordination', 30, 'coord_waiting_results'), ('care_coordination', 40, 'coord_specialist_plan'), ('care_coordination', 50, 'coord_forms'), ('care_coordination', 60, 'coord_home_support'), ('care_coordination', 70, 'coord_caregiver'), ('care_coordination', 80, 'coord_contact_info'), ('care_coordination', 90, 'coord_priority'), ('care_coordination', 100, 'coord_questions'),
    ('functional_status', 10, 'function_daily_tasks'), ('functional_status', 20, 'function_iadl_tasks'), ('functional_status', 30, 'function_walking'), ('functional_status', 40, 'function_transfer'), ('functional_status', 50, 'function_caregiver_change'), ('functional_status', 60, 'function_home_safety'), ('functional_status', 70, 'function_memory'), ('functional_status', 80, 'function_work_or_social'), ('functional_status', 90, 'function_change_score'), ('functional_status', 100, 'function_goal')
)
insert into public.question_family_members (family_id, question_id, sort_order)
select family.id, question.id, seed.sort_order
from seed
join public.question_families family on family.slug = seed.family_slug
join public.clinical_questions question on question.slug = seed.slug
on conflict (family_id, question_id) do update
set sort_order = excluded.sort_order;

insert into public.question_versions (question_id, version, question_text, description, answer_type, options, change_note)
select question.id, question.version, question.question_text, question.description, question.answer_type, question.options, 'Initial seed version'
from public.clinical_questions question
where question.metadata->>'seed_family' is not null
on conflict (question_id, version) do nothing;

with tag_seed as (
  select question.id as question_id, tag.value::text as tag, 'topic' as tag_type
  from public.clinical_questions question
  cross join lateral jsonb_array_elements_text(coalesce(question.metadata->'seed_tags', '[]'::jsonb)) tag(value)
  union
  select question.id as question_id, question.metadata->>'seed_family' as tag, 'family' as tag_type
  from public.clinical_questions question
  where question.metadata ? 'seed_family'
)
insert into public.clinical_question_tags (question_id, tag, tag_type)
select question_id, tag, tag_type
from tag_seed
on conflict (question_id, tag, tag_type) do nothing;

insert into public.question_rotation_rules (family_id, rule_type, cadence, max_questions_per_checkin, min_days_between, metadata)
select family.id, 'family_rotation', family.suggested_cadence, 8, 21, '{"purpose":"avoid_repeating_every_question_monthly"}'::jsonb
from public.question_families family
on conflict do nothing;

insert into public.question_dependencies (question_id, depends_on_question_id, operator, expected_value, action, metadata)
select child.id, parent.id, 'equals', '"yes"'::jsonb, 'show', jsonb_build_object('seeded', true)
from (values
  ('hosp_dates', 'hosp_since_last'),
  ('hosp_reason', 'hosp_since_last'),
  ('hosp_discharge_instructions', 'hosp_since_last'),
  ('er_date', 'er_since_last'),
  ('er_reason', 'er_since_last'),
  ('er_followup_done', 'er_followup_needed'),
  ('equipment_other_need', 'equipment_has_needed'),
  ('transport_next_need', 'transport_appointments')
) seed(child_slug, parent_slug)
join public.clinical_questions child on child.slug = seed.child_slug
join public.clinical_questions parent on parent.slug = seed.parent_slug
on conflict do nothing;
