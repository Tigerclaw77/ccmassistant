const fs = require("fs");
const path = require("path");

const files = {
  "app/page.tsx": `export default function Home() {
  return <div>Home</div>;
}`,

  "app/login/page.tsx": `export default function LoginPage() {
  return <div>Login</div>;
}`,

  "app/signup/page.tsx": `export default function SignupPage() {
  return <div>Signup</div>;
}`,

  "app/enroll/page.tsx": `export default function EnrollPage() {
  return <div>Enroll</div>;
}`,

  "app/app/layout.tsx": `export default function AppLayout({ children }) {
  return (
    <div style={{ display: "flex" }}>
      <aside style={{ width: 200, borderRight: "1px solid #333" }}>
        Sidebar
      </aside>
      <main style={{ padding: 20 }}>{children}</main>
    </div>
  );
}`,

  "app/app/page.tsx": `export default function Dashboard() {
  return <div>Dashboard</div>;
}`,

  "app/app/patients/page.tsx": `export default function PatientsPage() {
  return <div>Patients List</div>;
}`,

  "app/app/patients/new/page.tsx": `export default function NewPatientPage() {
  return <div>New Patient</div>;
}`,

  "app/app/patients/[patientId]/page.tsx": `export default function PatientDetail({ params }) {
  return <div>Patient: {params.patientId}</div>;
}`,

  "app/app/forms/page.tsx": `export default function FormsPage() {
  return <div>Forms</div>;
}`,

  "app/app/forms/new/page.tsx": `export default function NewFormPage() {
  return <div>Create Form</div>;
}`,

  "app/app/forms/[basketId]/page.tsx": `export default function FormBuilder({ params }) {
  return <div>Editing Form: {params.basketId}</div>;
}`,

  "app/app/submissions/page.tsx": `export default function SubmissionsPage() {
  return <div>Submissions</div>;
}`,

  "app/f/[token]/page.tsx": `export default function PublicForm({ params }) {
  return <div>Form Token: {params.token}</div>;
}`,

  "app/api/patients/route.ts": `export async function GET() {
  return Response.json({ patients: [] });
}`,

  "components/forms/FieldRenderer.tsx": `export default function FieldRenderer({ field }) {
  switch (field.type) {
    case "text":
      return <input placeholder={field.label} />;
    case "yes_no":
      return (
        <select>
          <option>Yes</option>
          <option>No</option>
        </select>
      );
    default:
      return <div>Unknown field</div>;
  }
}`,

  "components/forms/BasketRenderer.tsx": `import FieldRenderer from "./FieldRenderer";

export default function BasketRenderer({ basket }) {
  return (
    <div>
      {basket.questions.map((q) => (
        <div key={q.id}>
          <label>{q.label}</label>
          <FieldRenderer field={q} />
        </div>
      ))}
    </div>
  );
}`,

  "components/forms/BasketBuilder.tsx": `export default function BasketBuilder() {
  return <div>Form Builder UI (coming next)</div>;
}`,

  "lib/forms.ts": `export function createEmptyBasket() {
  return {
    name: "New Basket",
    questions: [],
  };
}`,

  "types/basket.ts": `export type Question = {
  id: string;
  label: string;
  type: "text" | "yes_no";
};

export type Basket = {
  id: string;
  name: string;
  questions: Question[];
};`,
};

Object.entries(files).forEach(([filePath, content]) => {
  const fullPath = path.join(process.cwd(), filePath);
  const dir = path.dirname(fullPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, content);
    console.log("Created:", filePath);
  }
});