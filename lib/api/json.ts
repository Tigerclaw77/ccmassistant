import type { ISODateString } from "../ccm/types";

export type JsonObject = Record<string, unknown>;

export async function readJsonObject(request: Request): Promise<JsonObject> {
  const value: unknown = await request.json();

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Expected a JSON object");
  }

  return value as JsonObject;
}

export function requiredString(body: JsonObject, key: string): string {
  const value = body[key];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${key} is required`);
  }

  return value.trim();
}

export function optionalString(body: JsonObject, key: string): string | null {
  const value = body[key];

  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error(`${key} must be a string`);
  }

  return value.trim();
}

export function stringUpdate(body: JsonObject, key: string): string | null | undefined {
  if (!(key in body)) {
    return undefined;
  }

  return optionalString(body, key);
}

export function requiredStringUpdate(body: JsonObject, key: string): string | undefined {
  if (!(key in body)) {
    return undefined;
  }

  const value = optionalString(body, key);

  if (value === null) {
    return undefined;
  }

  return value;
}

export function optionalNumber(body: JsonObject, key: string): number | null {
  const value = body[key];

  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`${key} must be a number`);
  }

  return value;
}

export function requiredNumber(body: JsonObject, key: string): number {
  const value = optionalNumber(body, key);

  if (value === null) {
    throw new Error(`${key} is required`);
  }

  return value;
}

export function optionalStringArray(body: JsonObject, key: string): string[] {
  const value = body[key];

  if (value === undefined || value === null) {
    return [];
  }

  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`${key} must be a string array`);
  }

  return value;
}

export function optionalEnum<T extends string>(
  body: JsonObject,
  key: string,
  allowed: readonly T[],
): T | null {
  const value = optionalString(body, key);

  if (value === null) {
    return null;
  }

  if (!allowed.includes(value as T)) {
    throw new Error(`${key} is not a valid value`);
  }

  return value as T;
}

export function enumUpdate<T extends string>(
  body: JsonObject,
  key: string,
  allowed: readonly T[],
): T | undefined {
  if (!(key in body)) {
    return undefined;
  }

  return optionalEnum(body, key, allowed) ?? undefined;
}

export function firstDayOfMonth(value: string | Date = new Date()): ISODateString {
  const date = typeof value === "string" ? new Date(value) : value;

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date");
  }

  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
    .toISOString()
    .slice(0, 10);
}

export function badRequest(error: unknown): Response {
  const message = error instanceof Error ? error.message : "Invalid request";
  return Response.json({ error: message }, { status: 400 });
}

export function mutationError(message: string): Response {
  return Response.json({ error: message }, { status: 500 });
}
