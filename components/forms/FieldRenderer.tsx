"use client";

type Field = {
  id: string;
  label: string;
  type: "text" | "yes_no";
};

type Props = {
  field: Field;
  onChange: (value: string) => void;
};

export default function FieldRenderer({ field, onChange }: Props) {
  switch (field.type) {
    case "text":
      return (
        <input
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.label}
          style={{
            padding: 10,
            background: "#111",
            color: "#fff",
            border: "1px solid #333",
            borderRadius: 6,
          }}
        />
      );

    case "yes_no":
      return (
        <select
          onChange={(e) => onChange(e.target.value)}
          defaultValue=""
          style={{
            padding: 10,
            background: "#111",
            color: "#fff",
            border: "1px solid #333",
            borderRadius: 6,
          }}
        >
          <option value="" disabled>
            Select
          </option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      );

    default:
      return <div>Unsupported field</div>;
  }
}