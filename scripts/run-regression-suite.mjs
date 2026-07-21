import { spawnSync } from "node:child_process";

const commands = [
  "test:launch",
  "test:hosted-readiness",
  "test:mfa",
  "test:practice-bootstrap",
  "test:authorization",
  "test:calendar-date",
  "test:enrollment-contract",
  "test:interaction-log-contract",
  "test:stripe-billing",
  "test:question-bank",
  "test:question-bank-architecture",
  "test:clinical-content",
  "test:quality-review",
  "test:question-bank-customization",
  "test:clinical-review",
  "test:session-engine",
  "test:session-integration",
  "test:coordinator-efficiency",
  "test:staff-experience",
  "test:development-audit",
  "test:persona-mode",
  "test:pilot-readiness",
  "test:pilot-readiness-2",
  "test:coordinator-workflow",
  "test:founder-review-1",
  "test:first-patient-onboarding",
  "test:icd",
  "test:icd-audit",
  "icd:check",
  "icd:validate",
  "icd:audit:check",
  "question-banks:check",
  "clinical-review:check",
];

const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error("Run the regression suite through npm so npm_execpath is available");

for (const command of commands) {
  console.log(`\n==> npm run ${command}`);
  const result = spawnSync(process.execPath, [npmCli, "run", command], { stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log(`\nRegression suite passed (${commands.length} commands).`);
