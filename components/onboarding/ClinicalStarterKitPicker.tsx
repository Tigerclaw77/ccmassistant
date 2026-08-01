import {
  CLINICAL_STARTER_KITS,
  type ClinicalStarterKitId,
} from "../../lib/ccm/clinical-starter-kits";

export default function ClinicalStarterKitPicker({
  disabled = false,
  onChange,
  selectedIds,
}: {
  disabled?: boolean;
  onChange: (ids: ClinicalStarterKitId[]) => void;
  selectedIds: readonly ClinicalStarterKitId[];
}) {
  function toggle(id: ClinicalStarterKitId) {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((value) => value !== id)
      : [...selectedIds, id];
    onChange(CLINICAL_STARTER_KITS.filter((kit) => next.includes(kit.id)).map((kit) => kit.id));
  }

  return (
    <fieldset className="space-y-4">
      <legend className="font-semibold text-slate-950">Clinical starter kits</legend>
      <p className="mt-1 text-sm leading-6 text-slate-600">
        Start with curated monitoring, education, reminders, provider prompts, and escalation suggestions. These are selectable workflow defaults, not treatment instructions.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {CLINICAL_STARTER_KITS.map((kit) => {
          const selected = selectedIds.includes(kit.id);
          return (
            <label
              className={`rounded-md border p-4 ${selected ? "border-teal-700 bg-teal-50" : "bg-white"}`}
              key={kit.id}
            >
              <span className="flex items-start gap-3">
                <input
                  checked={selected}
                  className="mt-1"
                  disabled={disabled}
                  onChange={() => toggle(kit.id)}
                  type="checkbox"
                />
                <span>
                  <span className="block font-semibold text-slate-950">{kit.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-600">{kit.summary}</span>
                  <span className="mt-2 block text-xs font-medium text-teal-800">
                    {kit.monthlyQuestionIds.length} monthly questions · {kit.educationTopics.length} education topics
                  </span>
                </span>
              </span>
            </label>
          );
        })}
      </div>
      <p className="text-xs leading-5 text-slate-500">
        Recommended: keep all kits selected for the pilot. Patient-specific questionnaires still follow the patient&apos;s documented conditions, and every recommendation requires human review.
      </p>
    </fieldset>
  );
}
