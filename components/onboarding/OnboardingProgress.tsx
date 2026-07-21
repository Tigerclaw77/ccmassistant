type Props = {
  currentStep: number;
  steps: readonly string[];
};

export default function OnboardingProgress({ currentStep, steps }: Props) {
  return (
    <div aria-label={`Step ${currentStep} of ${steps.length}: ${steps[currentStep - 1]}`}>
      <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-600">
        <span>Step {currentStep} of {steps.length}</span>
        <span>{steps[currentStep - 1]}</span>
      </div>
      <div className="flex gap-1.5" aria-hidden="true">
        {steps.map((step, index) => (
          <span
            className={`h-1.5 flex-1 rounded-full ${index < currentStep ? "bg-teal-700" : "bg-slate-200"}`}
            key={step}
          />
        ))}
      </div>
    </div>
  );
}
