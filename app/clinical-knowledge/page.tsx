"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseAuthHeaders } from "../../lib/supabase";
import LoadingState from "../../components/ui/LoadingState";
import type {
  ClinicalObjective,
  ClinicalQuestion,
  ClinicalQuestionTag,
  ClusterIcd10Map,
  ClusterObjectiveMap,
  Icd10Code,
  ManagementCluster,
  ObjectiveFamilyMap,
  QuestionFamily,
  QuestionFamilyMember,
  QuestionVersion,
} from "../../lib/ccm/types";
import { humanize } from "../../lib/ccm/labels";

type KnowledgeResponse = {
  clusterIcd10Map: ClusterIcd10Map[];
  clusterObjectiveMap: ClusterObjectiveMap[];
  clusters: ManagementCluster[];
  families: QuestionFamily[];
  familyMembers: QuestionFamilyMember[];
  icd10Codes: Icd10Code[];
  objectiveFamilyMap: ObjectiveFamilyMap[];
  objectives: ClinicalObjective[];
  questions: ClinicalQuestion[];
  tags: ClinicalQuestionTag[];
  versions: QuestionVersion[];
};

type View = "clusters" | "objectives" | "families" | "questions";

type KnowledgeLookup = {
  clustersById: Map<string, ManagementCluster>;
  familiesById: Map<string, QuestionFamily>;
  icdByCode: Map<string, Icd10Code>;
  objectivesById: Map<string, ClinicalObjective>;
  questionsById: Map<string, ClinicalQuestion>;
  tagsByQuestion: Map<string, ClinicalQuestionTag[]>;
  versionsByQuestion: Map<string, QuestionVersion[]>;
};

const EMPTY_DATA: KnowledgeResponse = {
  clusterIcd10Map: [],
  clusterObjectiveMap: [],
  clusters: [],
  families: [],
  familyMembers: [],
  icd10Codes: [],
  objectiveFamilyMap: [],
  objectives: [],
  questions: [],
  tags: [],
  versions: [],
};

function includesSearch(search: string, values: Array<string | null | undefined>): boolean {
  if (!search) return true;
  const normalized = search.toLowerCase();
  return values.some((value) => value?.toLowerCase().includes(normalized));
}

function statusPill(active: boolean) {
  return active
    ? "border-green-200 bg-green-50 text-green-700"
    : "border-gray-200 bg-gray-50 text-gray-700";
}

export default function ClinicalKnowledgePage() {
  const [data, setData] = useState<KnowledgeResponse>(EMPTY_DATA);
  const [view, setView] = useState<View>("clusters");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      const activePracticeId = localStorage.getItem("activePracticeId");
      const response = await fetch("/api/clinical-knowledge", {
        headers: {
          ...(await getSupabaseAuthHeaders()),
          ...(activePracticeId ? { "x-active-practice-id": activePracticeId } : {}),
        },
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "Unable to load clinical knowledge base.");
        setLoading(false);
        return;
      }

      setData(result as KnowledgeResponse);
      setLoading(false);
    }

    void load();
  }, []);

  const lookup = useMemo(() => {
    const clustersById = new Map(data.clusters.map((cluster) => [cluster.id, cluster]));
    const objectivesById = new Map(data.objectives.map((objective) => [objective.id, objective]));
    const familiesById = new Map(data.families.map((family) => [family.id, family]));
    const questionsById = new Map(data.questions.map((question) => [question.id, question]));
    const icdByCode = new Map(data.icd10Codes.map((code) => [code.code, code]));
    const tagsByQuestion = new Map<string, ClinicalQuestionTag[]>();
    const versionsByQuestion = new Map<string, QuestionVersion[]>();

    for (const tag of data.tags) {
      tagsByQuestion.set(tag.question_id, [...(tagsByQuestion.get(tag.question_id) ?? []), tag]);
    }

    for (const version of data.versions) {
      versionsByQuestion.set(version.question_id, [
        ...(versionsByQuestion.get(version.question_id) ?? []),
        version,
      ]);
    }

    return {
      clustersById,
      familiesById,
      icdByCode,
      objectivesById,
      questionsById,
      tagsByQuestion,
      versionsByQuestion,
    };
  }, [data]);

  const filteredClusters = data.clusters.filter((cluster) =>
    includesSearch(search, [cluster.name, cluster.slug, cluster.category, cluster.description]),
  );
  const filteredObjectives = data.objectives.filter((objective) =>
    includesSearch(search, [objective.name, objective.slug, objective.description]),
  );
  const filteredFamilies = data.families.filter((family) =>
    includesSearch(search, [family.name, family.slug, family.description]),
  );
  const filteredQuestions = data.questions.filter((question) => {
    const tags = lookup.tagsByQuestion.get(question.id)?.map((tag) => tag.tag) ?? [];
    return includesSearch(search, [
      question.question_text,
      question.slug,
      question.description,
      question.answer_type,
      question.clinical_importance,
      ...tags,
    ]);
  });

  const selectedCluster =
    lookup.clustersById.get(selectedId ?? "") ?? filteredClusters[0] ?? null;
  const selectedObjective =
    lookup.objectivesById.get(selectedId ?? "") ?? filteredObjectives[0] ?? null;
  const selectedFamily =
    lookup.familiesById.get(selectedId ?? "") ?? filteredFamilies[0] ?? null;
  const selectedQuestion =
    lookup.questionsById.get(selectedId ?? "") ?? filteredQuestions[0] ?? null;

  function setCurrentView(nextView: View) {
    setView(nextView);
    setSelectedId(null);
  }

  if (loading) {
    return <main className="page-shell"><LoadingState label="Loading clinical knowledge" /></main>;
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm text-slate-600">Administration</p>
          <h1 className="text-2xl font-semibold">Clinical Knowledge Base</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">
            Browse the normalized hierarchy that future questionnaires will use:
            ICD-10 code to cluster to objective to family to reusable question.
          </p>
        </div>

        <label className="text-sm font-medium">
          Search
          <input
            className="mt-1 w-full rounded border px-3 py-2 lg:w-80"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search clusters, families, questions, tags"
            value={search}
          />
        </label>
      </div>

      {error ? (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-3 md:grid-cols-4">
        <Stat label="Clusters" value={data.clusters.length} />
        <Stat label="Objectives" value={data.objectives.length} />
        <Stat label="Families" value={data.families.length} />
        <Stat label="Questions" value={data.questions.length} />
      </section>

      <div className="flex flex-wrap gap-2 text-sm">
        {(["clusters", "objectives", "families", "questions"] as View[]).map((item) => (
          <button
            className={`rounded px-3 py-2 ${
              view === item ? "bg-slate-900 text-white" : "border bg-white hover:bg-slate-50"
            }`}
            key={item}
            onClick={() => setCurrentView(item)}
            type="button"
          >
            {humanize(item)}
          </button>
        ))}
      </div>

      <section className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <div className="max-h-[680px] overflow-auto rounded border bg-white">
          {view === "clusters" ? (
            <EntityList
              empty="No clusters match the search."
              items={filteredClusters}
              onSelect={(id) => setSelectedId(id)}
              render={(cluster) => (
                <>
                  <div className="font-medium">{cluster.name}</div>
                  <div className="text-xs text-slate-500">{cluster.category}</div>
                </>
              )}
              selectedId={selectedCluster?.id}
            />
          ) : null}

          {view === "objectives" ? (
            <EntityList
              empty="No objectives match the search."
              items={filteredObjectives}
              onSelect={(id) => setSelectedId(id)}
              render={(objective) => (
                <>
                  <div className="font-medium">{objective.name}</div>
                  <div className="text-xs text-slate-500">{objective.slug}</div>
                </>
              )}
              selectedId={selectedObjective?.id}
            />
          ) : null}

          {view === "families" ? (
            <EntityList
              empty="No families match the search."
              items={filteredFamilies}
              onSelect={(id) => setSelectedId(id)}
              render={(family) => (
                <>
                  <div className="font-medium">{family.name}</div>
                  <div className="text-xs text-slate-500">{family.suggested_cadence}</div>
                </>
              )}
              selectedId={selectedFamily?.id}
            />
          ) : null}

          {view === "questions" ? (
            <EntityList
              empty="No questions match the search."
              items={filteredQuestions}
              onSelect={(id) => setSelectedId(id)}
              render={(question) => (
                <>
                  <div className="font-medium">{question.question_text}</div>
                  <div className="text-xs text-slate-500">
                    {humanize(question.answer_type)} - severity {question.severity}
                  </div>
                </>
              )}
              selectedId={selectedQuestion?.id}
            />
          ) : null}
        </div>

        <div className="rounded border bg-white p-5">
          {view === "clusters" && selectedCluster ? (
            <ClusterDetail cluster={selectedCluster} data={data} lookup={lookup} />
          ) : null}
          {view === "objectives" && selectedObjective ? (
            <ObjectiveDetail objective={selectedObjective} data={data} lookup={lookup} />
          ) : null}
          {view === "families" && selectedFamily ? (
            <FamilyDetail family={selectedFamily} data={data} lookup={lookup} />
          ) : null}
          {view === "questions" && selectedQuestion ? (
            <QuestionDetail question={selectedQuestion} data={data} lookup={lookup} />
          ) : null}
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border bg-white p-4">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-sm text-slate-600">{label}</div>
    </div>
  );
}

function EntityList<T extends { id: string }>({
  empty,
  items,
  onSelect,
  render,
  selectedId,
}: {
  empty: string;
  items: T[];
  onSelect: (id: string) => void;
  render: (item: T) => React.ReactNode;
  selectedId?: string;
}) {
  if (!items.length) {
    return <div className="p-4 text-sm text-slate-600">{empty}</div>;
  }

  return (
    <div className="divide-y">
      {items.map((item) => (
        <button
          className={`block w-full px-4 py-3 text-left text-sm ${
            selectedId === item.id ? "bg-slate-100" : "hover:bg-slate-50"
          }`}
          key={item.id}
          onClick={() => onSelect(item.id)}
          type="button"
        >
          {render(item)}
        </button>
      ))}
    </div>
  );
}

function ClusterDetail({
  cluster,
  data,
  lookup,
}: {
  cluster: ManagementCluster;
  data: KnowledgeResponse;
  lookup: KnowledgeLookup;
}) {
  const icdCodes = data.clusterIcd10Map
    .filter((map) => map.cluster_id === cluster.id)
    .map((map) => lookup.icdByCode.get(map.icd10_code))
    .filter(Boolean) as Icd10Code[];
  const objectives = data.clusterObjectiveMap
    .filter((map) => map.cluster_id === cluster.id)
    .map((map) => lookup.objectivesById.get(map.objective_id))
    .filter(Boolean) as ClinicalObjective[];

  const familyIds = new Set(
    data.objectiveFamilyMap
      .filter((map) => objectives.some((objective) => objective.id === map.objective_id))
      .map((map) => map.family_id),
  );
  const families = data.families.filter((family) => familyIds.has(family.id));

  return (
    <DetailShell title={cluster.name} subtitle={cluster.description}>
      <BadgeRow
        badges={[
          cluster.category,
          cluster.active ? "Active" : "Inactive",
          `${icdCodes.length} representative ICD mappings`,
          `${objectives.length} objectives`,
          `${families.length} families`,
        ]}
      />
      <RelationshipSection title="Representative ICD-10 mappings">
        {icdCodes.map((code) => (
          <li key={code.code}>
            <span className="font-medium">{code.code}</span> - {code.description}
          </li>
        ))}
      </RelationshipSection>
      <RelationshipSection title="Clinical objectives">
        {objectives.map((objective) => (
          <li key={objective.id}>{objective.name}</li>
        ))}
      </RelationshipSection>
      <RelationshipSection title="Question families reached through objectives">
        {families.map((family) => (
          <li key={family.id}>{family.name}</li>
        ))}
      </RelationshipSection>
    </DetailShell>
  );
}

function ObjectiveDetail({
  objective,
  data,
  lookup,
}: {
  objective: ClinicalObjective;
  data: KnowledgeResponse;
  lookup: KnowledgeLookup;
}) {
  const clusters = data.clusterObjectiveMap
    .filter((map) => map.objective_id === objective.id)
    .map((map) => lookup.clustersById.get(map.cluster_id))
    .filter(Boolean) as ManagementCluster[];
  const families = data.objectiveFamilyMap
    .filter((map) => map.objective_id === objective.id)
    .map((map) => lookup.familiesById.get(map.family_id))
    .filter(Boolean) as QuestionFamily[];

  return (
    <DetailShell title={objective.name} subtitle={objective.description}>
      <BadgeRow badges={[objective.active ? "Active" : "Inactive", `${clusters.length} clusters`, `${families.length} families`]} />
      <RelationshipSection title="Management clusters">
        {clusters.slice(0, 40).map((cluster) => (
          <li key={cluster.id}>{cluster.name}</li>
        ))}
      </RelationshipSection>
      <RelationshipSection title="Reusable question families">
        {families.map((family) => (
          <li key={family.id}>{family.name}</li>
        ))}
      </RelationshipSection>
    </DetailShell>
  );
}

function FamilyDetail({
  family,
  data,
  lookup,
}: {
  family: QuestionFamily;
  data: KnowledgeResponse;
  lookup: KnowledgeLookup;
}) {
  const objectives = data.objectiveFamilyMap
    .filter((map) => map.family_id === family.id)
    .map((map) => lookup.objectivesById.get(map.objective_id))
    .filter(Boolean) as ClinicalObjective[];
  const questions = data.familyMembers
    .filter((member) => member.family_id === family.id)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((member) => lookup.questionsById.get(member.question_id))
    .filter(Boolean) as ClinicalQuestion[];

  return (
    <DetailShell title={family.name} subtitle={family.description}>
      <BadgeRow badges={[family.active ? "Active" : "Inactive", family.suggested_cadence, `${objectives.length} objectives`, `${questions.length} questions`]} />
      <RelationshipSection title="Clinical objectives">
        {objectives.map((objective) => (
          <li key={objective.id}>{objective.name}</li>
        ))}
      </RelationshipSection>
      <RelationshipSection title="Questions">
        {questions.map((question) => (
          <li key={question.id}>
            <span className="font-medium">{question.question_text}</span>
            <span className="ml-2 text-slate-500">({humanize(question.answer_type)})</span>
          </li>
        ))}
      </RelationshipSection>
    </DetailShell>
  );
}

function QuestionDetail({
  question,
  data,
  lookup,
}: {
  question: ClinicalQuestion;
  data: KnowledgeResponse;
  lookup: KnowledgeLookup;
}) {
  const families = data.familyMembers
    .filter((member) => member.question_id === question.id)
    .map((member) => lookup.familiesById.get(member.family_id))
    .filter(Boolean) as QuestionFamily[];
  const tags = lookup.tagsByQuestion.get(question.id) ?? [];
  const versions = lookup.versionsByQuestion.get(question.id) ?? [];

  return (
    <DetailShell title={question.question_text} subtitle={question.description}>
      <BadgeRow
        badges={[
          humanize(question.answer_type),
          question.required ? "Required" : "Optional",
          `Severity ${question.severity}`,
          humanize(question.clinical_importance),
          question.suggested_cadence,
          question.provider_review_required ? "Provider review" : "Coordinator review",
          question.active && !question.retired ? "Active" : "Retired",
          `Version ${question.version}`,
        ]}
      />
      <RelationshipSection title="Question families">
        {families.map((family) => (
          <li key={family.id}>{family.name}</li>
        ))}
      </RelationshipSection>
      <RelationshipSection title="Tags">
        {tags.map((tag) => (
          <li key={`${tag.tag_type}-${tag.tag}`}>
            {tag.tag} <span className="text-slate-500">({tag.tag_type})</span>
          </li>
        ))}
      </RelationshipSection>
      <RelationshipSection title="Version history">
        {versions.map((version) => (
          <li key={version.id}>
            Version {version.version}: {version.change_note ?? "No change note"}
          </li>
        ))}
      </RelationshipSection>
    </DetailShell>
  );
}

function DetailShell({
  children,
  subtitle,
  title,
}: {
  children: React.ReactNode;
  subtitle?: string | null;
  title: string;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
      </div>
      {children}
    </div>
  );
}

function BadgeRow({ badges }: { badges: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge) => (
        <span className={`rounded border px-2 py-1 text-xs ${statusPill(badge === "Active")}`} key={badge}>
          {badge}
        </span>
      ))}
    </div>
  );
}

function RelationshipSection({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-slate-700">{title}</h3>
      <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">{children}</ul>
    </section>
  );
}
