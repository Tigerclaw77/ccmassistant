# Question Bank Content Review

## Review Status

**DRAFT_CLINICAL_REVIEW, content version 1.** This batch is ready for clinician review; it is not clinically approved.

## Batch Summary

- New canonical conditions: 35
- ICD records newly mapped: 1551
- Banks populated: 66
- New reusable questions: 103
- Existing reusable questions used: 28
- Average default bank size: 9.03
- Maximum default bank size: 16
- Laterality-collapse groups represented: 7
- Material variants retained: 30
- Red-flag questions awaiting clinician review: 28
- Remaining unmapped PASS records: 4583

## Canonical Conditions Added

| Canonical condition | Mapped records | Mapping rationale |
| --- | ---: | --- |
| `lumbar_spinal_stenosis` | 2 | Map M48.061 and M48.062; retain neurogenic claudication as a material variant. |
| `cervical_spinal_stenosis` | 1 | Map M48.02; keep cervical monitoring distinct from lumbar claudication content. |
| `lumbar_radiculopathy` | 2 | Map M54.16 and M54.17; collapse laterality while preserving the exact diagnosis title. |
| `cervical_radiculopathy` | 1 | Map M54.12; keep cervical upper-extremity monitoring separate from lumbar disease. |
| `cervical_disc_disease` | 55 | Map M50 billable diagnoses; retain myelopathy and radiculopathy variants. |
| `lumbar_disc_disease` | 30 | Map billable M51 diagnoses whose official titles identify lumbar or lumbosacral disease; retain myelopathy and radiculopathy variants. |
| `fibromyalgia` | 1 | Map M79.7 as a specific chronic pain-processing disorder, not a generic pain identity. |
| `chronic_gout` | 404 | Map M1A chronic gout; collapse site and laterality while retaining tophus status. |
| `non_pressure_chronic_ulcer` | 355 | Map L97 and L98 diagnoses explicitly titled non-pressure chronic ulcer; collapse laterality and retain deep tissue involvement. |
| `chronic_osteomyelitis` | 128 | Map M86 diagnoses explicitly titled chronic osteomyelitis; collapse site and laterality for bank identity. |
| `chronic_venous_insufficiency` | 1 | Map I87.2 only; do not merge post-thrombotic syndrome or acute thrombosis. |
| `cirrhosis` | 13 | Map K74 fibrosis and cirrhosis diagnoses; retain exact etiology and stage wording in the ICD record. |
| `psoriasis` | 15 | Map L40 psoriasis diagnoses; do not merge unrelated dermatitis conditions. |
| `interstitial_lung_disease` | 31 | Map J84 interstitial pulmonary diseases; preserve the exact disease title. |
| `bronchiectasis` | 4 | Map J47 and retain exacerbation or lower-respiratory-infection treatment-state variants. |
| `sickle_cell_disease` | 53 | Map D57 sickle-cell disorders; retain crisis and acute-chest variants. |
| `ankylosing_spondylitis` | 22 | Map M45 ankylosing spondylitis; collapse spinal subsite for bank identity. |
| `systemic_lupus_erythematosus` | 12 | Map M32 systemic lupus erythematosus; preserve organ involvement in the exact ICD title. |
| `sarcoidosis` | 15 | Map D86 sarcoidosis; preserve organ involvement in the exact ICD title. |
| `aortic_aneurysm` | 31 | Map I71 diagnoses whose official title identifies aneurysm; do not map dissection-only diagnoses and retain rupture status. |
| `post_traumatic_stress_disorder` | 4 | Map F43.1 PTSD diagnoses; do not merge acute stress or adjustment disorders. |
| `alcohol_use_disorder` | 74 | Map F10 alcohol-related abuse and dependence diagnoses; retain remission, withdrawal, and complication states. |
| `opioid_use_disorder` | 58 | Map F11 opioid-related abuse and dependence diagnoses; retain remission, withdrawal, and complication states. |
| `nicotine_dependence` | 26 | Map F17 nicotine-dependence diagnoses; retain remission and withdrawal states. |
| `insomnia` | 19 | Map G47.0 and F51.0 insomnia diagnoses; do not merge hypersomnia or parasomnia. |
| `essential_tremor` | 1 | Map G25.0 only; do not merge drug-induced tremor or other movement disorders. |
| `benign_prostatic_hyperplasia` | 5 | Map N40 BPH diagnoses; retain lower-urinary-tract-symptom state. |
| `hearing_loss` | 54 | Map H90 and H91 hearing-loss diagnoses; collapse ear laterality while preserving type in the exact title. |
| `amyotrophic_lateral_sclerosis` | 1 | Map G12.21 only; do not merge other motor-neuron diseases. |
| `myasthenia_gravis` | 4 | Map G70 diagnoses explicitly titled myasthenia gravis; retain crisis status. |
| `hyperthyroidism` | 22 | Map E05 thyrotoxicosis diagnoses; retain crisis or storm as a high-risk state. |
| `adrenal_insufficiency` | 6 | Map E27 diagnoses explicitly identifying adrenocortical insufficiency or Addisonian crisis. |
| `cerebral_palsy` | 8 | Map G80 cerebral palsy diagnoses; collapse laterality while preserving functional diagnosis wording. |
| `muscular_dystrophy` | 17 | Map G71 diagnoses explicitly identifying muscular dystrophy; preserve subtype in the exact title. |
| `visual_impairment` | 76 | Map H54 blindness and low-vision diagnoses; collapse eye laterality while preserving severity category. |

## Banks Populated

The catalog now has 66 populated banks, including all 24 COMMON Medicare conditions plus asthma, generalized anxiety, Parkinson disease, multiple sclerosis, epilepsy, inflammatory bowel disease, and heart-valve disease. Presets use condition-specific defaults plus optional questions where justified.

## Variants and Laterality

Laterality remains on the exact ICD record and does not create bank IDs. Material variants include neurogenic claudication, myelopathy, radiculopathy, tophi, deep-tissue ulcer involvement, pulmonary exacerbation or infection, sickle-cell crisis, rupture status, lower urinary tract symptoms, endocrine crisis states, and selected valve location.

## High-Risk Review

Urgent logic covers new bowel or bladder loss, saddle numbness, sudden limb weakness, severe breathing difficulty, gastrointestinal bleeding, sickle-cell fever or chest symptoms, dangerous withdrawal symptoms, self-harm thoughts, sudden vision loss, possible aortic emergency, urinary retention, and neuromuscular swallowing or breathing decline. Review every item in `data/question-banks/review/urgent-red-flag-logic.json` before publication.

## Ambiguity and Remaining Work

The ambiguity queue isolates acute-state wording inside otherwise valid chronic identities. The largest remaining unmapped PASS families are I82 (145), M48 (116), I63 (91), F19 (63), F13 (58), I83 (57), M41 (55), M43 (50). Future batches should prioritize distinct chronic diagnoses, not vague symptom identities.

## Clinical Basis

Question concepts were grounded in authoritative patient and professional resources, including [NIAMS spinal stenosis](https://www.niams.nih.gov/health-topics/spinal-stenosis), [NIDDK cirrhosis symptoms](https://www.niddk.nih.gov/health-information/liver-disease/cirrhosis/symptoms-causes), [NIDDK CKD evaluation](https://www.niddk.nih.gov/health-information/professionals/clinical-tools-patient-management/kidney-disease/identify-manage-patients/evaluate-ckd), [NHLBI COPD symptoms](https://www.nhlbi.nih.gov/health/copd/symptoms), and [NIA medication safety](https://www.nia.nih.gov/health/medicines-and-medication-management/taking-medicines-safely-you-age). These references support review; they do not constitute approval of this question set.
