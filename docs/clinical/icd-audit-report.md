# ICD-10-CM Knowledge Quality Audit

## Executive Assessment

Overall confidence: **77/100 (MODERATE)**.

The imported dataset is structurally reliable and reproducible, but it is **not ready for broad question-bank generation**. It is suitable for a limited pilot restricted to high-confidence mapped groups after review of the issues below. The principal constraints are 4,583 unmapped PASS records, 9,073 non-mutating false-FAIL review candidates, 1,058 PASS consistency candidates, and likely under-fragmentation in several large canonical conditions.

No classifications, canonical IDs, mappings, or content-group IDs were changed by this audit. No clinical content was generated.

## Classification Totals

| PASS | FAIL | UNSURE | Total |
| ---: | ---: | ---: | ---: |
| 11,192 | 36,452 | 50,542 | 98,186 |

### PASS and UNSURE Consistency

The PASS review queue contains **1,058** records. These are not automatic downgrades: 894 blanket_congenital_chapter_pass; 164 acute_language_without_canonical_core. Acute leukemia and acute complications of chronic disease may remain PASS, while acute pain, acute thrombosis, acute stress reactions, and similar unmapped records are weaker candidates for automatic content generation.

UNSURE remains the largest classification and functions as the conservative fallback. Of 50,542 UNSURE records, 28,570 are billable and 21,972 are non-billable hierarchy headers. Largest chapters:

| Chapter | UNSURE records |
| --- | --- |
| S | 15,274 |
| T | 7,956 |
| M | 6,504 |
| H | 3,589 |
| V | 3,084 |
| O | 2,995 |
| Z | 1,660 |
| W | 1,008 |
| Y | 1,005 |
| R | 950 |

## FAIL Analysis

| FAIL category | Codes | Confidence | Questionable? |
| --- | --- | --- | --- |
| Fractures | 14,778 | MEDIUM | Yes |
| Other acute injuries | 7,870 | HIGH | Yes |
| External causes | 5,137 | HIGH | No |
| Poisonings and toxic effects | 3,218 | HIGH | No |
| Lacerations and open wounds | 2,505 | HIGH | No |
| Burns and corrosions | 1,652 | HIGH | No |
| Device and postprocedural complications | 1,032 | MEDIUM | Yes |
| Other | 97 | LOW | Yes |
| Screening encounters | 73 | HIGH | No |
| Routine and administrative encounters | 54 | HIGH | No |
| Vaccination-related encounters and acute events | 23 | HIGH | No |
| Self-limited symptoms | 6 | MEDIUM | Yes |
| Abnormal screening findings | 5 | LOW | Yes |
| Acute infections | 2 | HIGH | No |

The largest FAIL categories are injury and external-cause families. This is directionally consistent with CCM exclusion, but fracture-healing complications, major disabling injury follow-up, and recurring dialysis/device complications deserve targeted review rather than bulk reclassification.

### Fractures

Most active fracture episodes are not CCM-specific, but delayed healing, nonunion, malunion, and functional consequences merit review.

- `S02.0XXA` Fracture of vault of skull, initial encounter for closed fracture
- `S02.0XXB` Fracture of vault of skull, initial encounter for open fracture
- `S02.0XXD` Fracture of vault of skull, subsequent encounter for fracture with routine healing
- `S02.0XXG` Fracture of vault of skull, subsequent encounter for fracture with delayed healing
- `S02.0XXK` Fracture of vault of skull, subsequent encounter for fracture with nonunion
- `S02.101A` Fracture of base of skull, right side, initial encounter for closed fracture

### Other acute injuries

Most active injuries are outside CCM content, while major neurologic or disabling follow-up can require context-sensitive review.

- `S00.00XA` Unspecified superficial injury of scalp, initial encounter
- `S00.00XD` Unspecified superficial injury of scalp, subsequent encounter
- `S00.01XA` Abrasion of scalp, initial encounter
- `S00.01XD` Abrasion of scalp, subsequent encounter
- `S00.02XA` Blister (nonthermal) of scalp, initial encounter
- `S00.02XD` Blister (nonthermal) of scalp, subsequent encounter

### External causes

External-cause codes identify an event or circumstance rather than a managed chronic condition.

- `V00.01XA` Pedestrian on foot injured in collision with roller-skater, initial encounter
- `V00.01XD` Pedestrian on foot injured in collision with roller-skater, subsequent encounter
- `V00.02XA` Pedestrian on foot injured in collision with skateboarder, initial encounter
- `V00.02XD` Pedestrian on foot injured in collision with skateboarder, subsequent encounter
- `V00.031A` Pedestrian on foot injured in collision with rider of standing electric scooter, initial encounter
- `V00.031D` Pedestrian on foot injured in collision with rider of standing electric scooter, subsequent encounter

### Poisonings and toxic effects

Poisoning and toxic-effect codes usually represent acute episodes rather than stable chronic content.

- `T36.0X1A` Poisoning by penicillins, accidental (unintentional), initial encounter
- `T36.0X1D` Poisoning by penicillins, accidental (unintentional), subsequent encounter
- `T36.0X2A` Poisoning by penicillins, intentional self-harm, initial encounter
- `T36.0X2D` Poisoning by penicillins, intentional self-harm, subsequent encounter
- `T36.0X3A` Poisoning by penicillins, assault, initial encounter
- `T36.0X3D` Poisoning by penicillins, assault, subsequent encounter

### Lacerations and open wounds

These codes predominantly describe acute wound treatment and follow-up.

- `D78.11` Accidental puncture and laceration of the spleen during a procedure on the spleen
- `D78.12` Accidental puncture and laceration of the spleen during other procedure
- `E36.11` Accidental puncture and laceration of an endocrine system organ or structure during an endocrine system procedure
- `E36.12` Accidental puncture and laceration of an endocrine system organ or structure during other procedure
- `G97.41` Accidental puncture or laceration of dura during a procedure
- `G97.48` Accidental puncture and laceration of other nervous system organ or structure during a nervous system procedure

### Burns and corrosions

These codes predominantly describe acute injury treatment episodes.

- `L55.0` Sunburn of first degree
- `L55.1` Sunburn of second degree
- `L55.2` Sunburn of third degree
- `T20.00XA` Burn of unspecified degree of head, face, and neck, unspecified site, initial encounter
- `T20.00XD` Burn of unspecified degree of head, face, and neck, unspecified site, subsequent encounter
- `T20.011A` Burn of unspecified degree of right ear [any part, except ear drum], initial encounter

### Device and postprocedural complications

Complications are often temporary, but recurrent device, dialysis, or transplant-related problems may affect longitudinal care.

- `T79.9XXA` Unspecified early complication of trauma, initial encounter
- `T79.9XXD` Unspecified early complication of trauma, subsequent encounter
- `T80.0XXA` Air embolism following infusion, transfusion and therapeutic injection, initial encounter
- `T80.0XXD` Air embolism following infusion, transfusion and therapeutic injection, subsequent encounter
- `T80.1XXA` Vascular complications following infusion, transfusion and therapeutic injection, initial encounter
- `T80.1XXD` Vascular complications following infusion, transfusion and therapeutic injection, subsequent encounter

### Other

Residual codes require focused clinical review because no high-confidence exclusion category explains them.

- `H02.811` Retained foreign body in right upper eyelid
- `H02.812` Retained foreign body in right lower eyelid
- `H02.813` Retained foreign body in right eye, unspecified eyelid
- `H02.814` Retained foreign body in left upper eyelid
- `H02.815` Retained foreign body in left lower eyelid
- `H02.816` Retained foreign body in left eye, unspecified eyelid

### Screening encounters

Screening codes describe detection encounters and do not establish the condition being screened for.

- `Z11.0` Encounter for screening for intestinal infectious diseases
- `Z11.1` Encounter for screening for respiratory tuberculosis
- `Z11.2` Encounter for screening for other bacterial diseases
- `Z11.3` Encounter for screening for infections with a predominantly sexual mode of transmission
- `Z11.4` Encounter for screening for human immunodeficiency virus [HIV]
- `Z11.51` Encounter for screening for human papillomavirus (HPV)

### Routine and administrative encounters

Routine examinations, certificates, observation, and administrative encounters are not reusable condition profiles.

- `Z00.00` Encounter for general adult medical examination without abnormal findings
- `Z00.121` Encounter for routine child health examination with abnormal findings
- `Z00.129` Encounter for routine child health examination without abnormal findings
- `Z02.9` Encounter for administrative examinations, unspecified
- `Z03.6` Encounter for observation for suspected toxic effect from ingested substance ruled out
- `Z03.810` Encounter for observation for suspected exposure to anthrax ruled out

### Vaccination-related encounters and acute events

Routine vaccination encounters and acute vaccination reactions do not independently establish chronic diagnoses.

- `T80.52XA` Anaphylactic reaction due to vaccination, initial encounter
- `T80.52XD` Anaphylactic reaction due to vaccination, subsequent encounter
- `T80.62XA` Other serum reaction due to vaccination, initial encounter
- `T80.62XD` Other serum reaction due to vaccination, subsequent encounter
- `T81.503A` Unspecified complication of foreign body accidentally left in body following injection or immunization, initial encounter
- `T81.503D` Unspecified complication of foreign body accidentally left in body following injection or immunization, subsequent encounter

### Self-limited symptoms

Acute symptoms usually do not establish a chronic diagnosis, although persistent symptoms can be relevant.

- `R05.1` Acute cough
- `R05.2` Subacute cough
- `R09.A0` Foreign body sensation, unspecified
- `R09.A1` Foreign body sensation, nose
- `R09.A2` Foreign body sensation, throat
- `R09.A9` Foreign body sensation, other site

### Abnormal screening findings

An abnormal screening result is not yet a confirmed chronic diagnosis, but automatic FAIL may be too strong when durable disease is suspected.

- `P09.1` Abnormal findings on neonatal screening for inborn errors of metabolism
- `P09.2` Abnormal findings on neonatal screening for congenital endocrine disease
- `P09.3` Abnormal findings on neonatal screening for congenital hematologic disorders
- `P09.4` Abnormal findings on neonatal screening for cystic fibrosis
- `P09.5` Abnormal findings on neonatal screening for critical congenital heart disease

### Acute infections

Clearly acute infections without chronic sequelae generally do not warrant reusable CCM-specific content.

- `J00` Acute nasopharyngitis [common cold]
- `J06.9` Acute upper respiratory infection, unspecified

## Potential False FAIL

The review queue contains **9,073** unique records. This is a sensitivity queue, not a recommendation to reclassify all candidates. Breakdown:

| Review reason | Candidates |
| --- | --- |
| fracture_healing_complication | 8,088 |
| recurrent_device_or_postprocedural | 529 |
| major_disabling_injury_followup | 417 |
| dialysis_or_transplant_context | 33 |
| abnormal_screening_finding | 5 |
| history_status_dependency | 1 |

High-value review targets are delayed healing/nonunion/malunion, dialysis or transplant context, and explicit history/dependency/disability language. Subsequent-encounter injury codes should only move to UNSURE when the diagnosis itself supports durable care-management burden.

## Unmapped PASS

4,583 PASS records have no canonical condition or content group. Grouped recommendations:

| Recommendation group | Codes | Disposition | Likely target |
| --- | --- | --- | --- |
| Hypertensive heart and kidney disease | 8 | MAP_EXISTING_WITH_VARIANTS | essential_hypertension + heart failure/CKD modules |
| Other ischemic heart disease | 20 | MAP_EXISTING_OR_UNSURE | coronary_artery_disease |
| Conduction disorders and other arrhythmias | 42 | LIKELY_NEW_CANONICAL | cardiac_arrhythmia |
| Hematologic and immune disorders | 155 | MIXED | anemia or new hematology/immune concepts |
| Other mental and behavioral disorders | 599 | LIKELY_NEW_CANONICAL | condition-specific behavioral health concepts |
| Other neurologic disorders | 492 | MIXED | existing neurologic concepts or new condition families |
| Other endocrine and metabolic disorders | 466 | LIKELY_NEW_CANONICAL | endocrine/metabolic condition families |
| Congenital and inherited disorders | 894 | REVIEW_BEFORE_MAPPING | condition-family taxonomy |
| Other musculoskeletal disorders | 536 | MIXED | pain/arthritis concepts or new condition families |
| Chronic dermatologic disorders | 23 | LIKELY_NEW_CANONICAL | psoriasis/dermatitis/chronic wound concepts |
| Other digestive and hepatic disorders | 172 | MIXED | condition-specific GI/hepatic concepts |
| Other chronic respiratory disorders | 137 | MIXED | COPD/asthma or new pulmonary concepts |
| Other renal and urologic disorders | 151 | LIKELY_NEW_CANONICAL | renal/urologic condition families |
| Other chronic ophthalmic disorders | 138 | LIKELY_NEW_CANONICAL | visual impairment/retinal condition families |
| Other unmapped PASS | 750 | REVIEW | Clinical review |

The largest queues are musculoskeletal, congenital/inherited, circulatory, behavioral health, neurologic, and endocrine/metabolic. The congenital queue is a likely over-inclusive consequence of the chapter-level PASS heuristic. Hypertensive cardiorenal and clear anemia families offer the strongest opportunities for existing-canonical mapping, with organ and complication variants preserved.

## Canonical Review

### Largest Conditions

| Canonical condition | Mapped codes | Content groups | Medicare relevance |
| --- | --- | --- | --- |
| malignancy | 1,539 | 91 | COMMON |
| rheumatoid_arthritis | 418 | 1 | OCCASIONAL |
| chronic_gout | 404 | 2 | OCCASIONAL |
| osteoporosis | 401 | 2 | COMMON |
| non_pressure_chronic_ulcer | 355 | 2 | OCCASIONAL |
| secondary_diabetes_mellitus | 348 | 13 | RARE |
| glaucoma | 320 | 15 | COMMON |
| peripheral_vascular_disease | 305 | 4 | COMMON |
| cerebrovascular_disease | 289 | 1 | OCCASIONAL |
| pressure_ulcer | 208 | 7 | OCCASIONAL |
| osteoarthritis | 130 | 1 | COMMON |
| chronic_osteomyelitis | 128 | 1 | OCCASIONAL |

### Smallest Conditions

| Canonical condition | Mapped codes | Content groups | Medicare relevance |
| --- | --- | --- | --- |
| amyotrophic_lateral_sclerosis | 1 | 1 | OCCASIONAL |
| anemia | 1 | 1 | COMMON |
| cervical_radiculopathy | 1 | 1 | OCCASIONAL |
| cervical_spinal_stenosis | 1 | 1 | OCCASIONAL |
| chronic_back_pain | 1 | 1 | COMMON |
| chronic_venous_insufficiency | 1 | 1 | OCCASIONAL |
| essential_hypertension | 1 | 1 | COMMON |
| essential_tremor | 1 | 1 | OCCASIONAL |
| fibromyalgia | 1 | 1 | OCCASIONAL |
| hiv_disease | 1 | 1 | RARE |
| lumbar_radiculopathy | 2 | 1 | OCCASIONAL |
| lumbar_spinal_stenosis | 2 | 2 | OCCASIONAL |

### Merge Opportunities

- **chronic_back_pain + chronic_pain**: Consider one chronic-pain canonical core with back-pain and neoplasm-related variants; preserve site-specific functional modules where needed.
- **type_1_diabetes + type_2_diabetes + secondary_diabetes_mellitus**: Retain distinct canonical IDs, but share a diabetes core and complication modules to avoid duplicate questions.
- **peripheral_neuropathy + type_1_diabetes + type_2_diabetes**: Keep neuropathy independently selectable while reusing a complication module for diabetic neuropathy.

### Split and Variant Opportunities

- **peripheral_vascular_disease**: Split general content by uncomplicated disease, ulceration, gangrene, and revascularization/amputation burden; laterality alone should still collapse.
- **malignancy**: Retain site families but add active treatment, metastatic disease, remission/surveillance, and symptom-burden dimensions.
- **rheumatoid_arthritis**: Separate general inflammatory arthritis from organ involvement, treatment toxicity, and severe functional impairment modules.
- **osteoporosis**: Current-fracture separation is useful; consider healing status and recurrent-fracture risk without creating site-by-side profiles.
- **cerebrovascular_disease**: Add deficit-specific modules for cognition, speech, motor impairment, swallowing, and mobility while sharing a stroke core.
- **osteoarthritis**: Laterality should remain collapsed, but weight-bearing versus upper-extremity disease may need different function and fall-risk modules.

No duplicate canonical IDs were found. The main risk is under-fragmentation rather than duplicate naming. Peripheral vascular disease currently places ulcer, gangrene, and anatomical variants into one general content group. Rheumatoid arthritis and osteoarthritis also warrant review for management-changing organ, functional, or anatomical modules. Malignancy uses site-family variants and should add treatment state, metastatic disease, and surveillance dimensions before generation.

Laterality validation remains consistent for representative osteoarthritis and glaucoma families. The 61 laterality-collapsed duplicate groups are structurally coherent, but laterality correctness does not by itself establish that all anatomical sites can share identical goals and interventions.

## Medicare Relevance

| Relevance | Canonical conditions |
| --- | --- |
| OCCASIONAL | 52 |
| COMMON | 24 |
| RARE | 5 |

COMMON, OCCASIONAL, and RARE are informational attributes only. RARE does not imply FAIL. CMS uses the Chronic Condition Warehouse to study chronically ill Medicare beneficiaries, and current CDC evidence emphasizes hypertension, arthritis, high cholesterol, heart disease, cancer, diabetes, and multimorbidity in older adults. Sources: [CMS Medicare Chronic Conditions](https://data.cms.gov/medicare-chronic-conditions), [CMS methodology](https://edit.cms.gov/Research-Statistics-Data-and-Systems/Statistics-Trends-and-Reports/Chronic-Conditions/Downloads/Methods_Overview.pdf), and [CDC adults age 85 and older](https://www.cdc.gov/nchs/data/hestat/hestat105.htm).

## Stability Review

Canonical IDs are syntactically stable and unique. Clinical content group IDs are deterministic and validation-clean, but the taxonomy is not semantically mature enough for broad generation. Stability confidence is **68/100**.

Strengths:

- Complete official CMS row coverage and exact-code preservation.
- Deterministic regeneration, duplicate detection, and orphan detection.
- Clear separation of exact diagnosis identity, canonical condition, and content group.
- Representative laterality and stage/severity rules validate correctly.

Remaining instability:

- 4,583 PASS records have no stable content identity.
- Several large canonical conditions use a single general group despite material complication differences.
- Site-based malignancy group IDs do not yet encode treatment state, metastatic disease, or surveillance needs.
- Small one-code canonical mappings reveal incomplete family coverage, especially anemia, hypertension, back pain, and HIV.

## Confidence Components

| Component | Score | Assessment |
| --- | --- | --- |
| Data integrity | 100/100 | Complete CMS coverage, checksum, exact identity, and deterministic artifacts validate. |
| Classification consistency | 82/100 | Broad categories are coherent, with concentrated uncertainty in prolonged injury and device contexts. |
| False-FAIL resilience | 68/100 | Override recovery exists, but the targeted review queue is material. |
| PASS mapping completeness | 59/100 | Only mapped PASS records have stable reusable content identity. |
| Canonical/group stability | 68/100 | IDs are deterministic, but major under-fragmentation and sparse family mapping remain. |

## Recommendation

Do not begin broad question-bank generation. First review the high-priority false-FAIL queue, resolve obvious existing-canonical mappings, define material variants for the largest under-fragmented conditions, and freeze the resulting IDs. A narrow pilot can proceed afterward for high-confidence groups such as hypertension, uncomplicated diabetes, stable COPD, heart failure variants, CKD variants, and osteoarthritis laterality collapse.
