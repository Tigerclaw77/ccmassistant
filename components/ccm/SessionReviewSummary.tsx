"use client";

import { getQuestion } from "../../lib/ccm/question-bank/questions";
import type { AnswerValue } from "../../lib/ccm/question-bank/types";
import type { SessionState, SessionSummaryFinding } from "../../lib/ccm/session-engine/types";

function answerLabel(answer: AnswerValue): string {
  if (answer === null) return "No answer";
  if (Array.isArray(answer)) return answer.join(", ");
  if (typeof answer === "boolean") return answer ? "Yes" : "No";
  return String(answer).replaceAll("_", " ");
}

function findings(title: string, items: SessionSummaryFinding[]) {
  if (items.length === 0) return null;
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-2 space-y-2 text-sm text-gray-700">
        {items.map((item) => (
          <li className="border-b pb-2 last:border-b-0" key={item.questionId}>
            <div className="font-medium">{getQuestion(item.questionId)?.text ?? item.questionId}</div>
            <div>{answerLabel(item.answer)}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SessionReviewSummary({ session }: { session: SessionState }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {findings("Patient concerns", session.summary.patientConcerns)}
      {findings("Functional and social concerns", [
        ...session.summary.functionalConcerns,
        ...session.summary.socialBarriers,
      ])}
      <div>
        <h3 className="text-sm font-semibold">Coordinator actions</h3>
        {session.summary.suggestedCoordinatorActions.length ? (
          <ul className="mt-2 space-y-2 text-sm text-gray-700">
            {session.summary.suggestedCoordinatorActions.map((task) => (
              <li className="border-b pb-2 last:border-b-0" key={task.id}>
                <div className="font-medium">{task.type.replaceAll("_", " ")}</div>
                <div>{task.priority} - {task.reason.replaceAll("_", " ")}</div>
              </li>
            ))}
          </ul>
        ) : <p className="mt-2 text-sm text-gray-600">No generated tasks.</p>}
      </div>
      <div>
        <h3 className="text-sm font-semibold">Provider review</h3>
        {session.summary.suggestedProviderReview.length ? (
          <ul className="mt-2 space-y-2 text-sm text-gray-700">
            {session.summary.suggestedProviderReview.map((flag) => (
              <li key={`${flag.questionId}:${flag.code}`}>{flag.priority} - {flag.code.replaceAll("_", " ")}</li>
            ))}
          </ul>
        ) : <p className="mt-2 text-sm text-gray-600">No provider review flags.</p>}
      </div>
      <div className="md:col-span-2">
        <h3 className="text-sm font-semibold">Billing documentation</h3>
        <ul className="mt-2 space-y-2 text-sm text-gray-700">
          {session.summary.billingRelevantDocumentation.map((item) => (
            <li className="border-b pb-2 last:border-b-0" key={item.questionId}>
              <div className="font-medium">{getQuestion(item.questionId)?.text ?? item.questionId}</div>
              <div>{answerLabel(item.answer)}</div>
              <div className="text-xs text-gray-600">Question v{item.questionVersion} - {item.billingRelevance}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
