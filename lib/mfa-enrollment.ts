export const MFA_FRIENDLY_NAME = "CCM Assistant";

const STORAGE_VERSION = 1;
const STORAGE_PREFIX = "ccm-assistant:mfa-enrollment:";

type MfaError = {
  message: string;
};

type MfaResult<T> = Promise<{
  data: T | null;
  error: MfaError | null;
}>;

export type MfaFactor = {
  created_at: string;
  factor_type: string;
  friendly_name?: string;
  id: string;
  status: "verified" | "unverified";
  updated_at: string;
};

export type MfaApi = {
  challengeAndVerify(params: { code: string; factorId: string }): MfaResult<unknown>;
  enroll(params: {
    factorType: "totp";
    friendlyName: string;
  }): MfaResult<{
    id: string;
    totp: {
      qr_code: string;
      secret: string;
    };
  }>;
  listFactors(): MfaResult<{
    all: MfaFactor[];
    totp: MfaFactor[];
  }>;
  unenroll(params: { factorId: string }): MfaResult<unknown>;
};

export type MfaStorage = Pick<Storage, "getItem" | "removeItem" | "setItem">;

export type MfaEnrollmentState = {
  factorId: string;
  mode: "challenge" | "enrollment" | "recovery";
  qrCode: string | null;
  secret: string | null;
};

type PersistedEnrollment = {
  factorId: string;
  qrCode: string;
  secret: string;
  userId: string;
  version: number;
};

type EnrollmentOptions = {
  api: MfaApi;
  storage: MfaStorage;
  userId: string;
};

const inFlight = new Map<string, Promise<MfaEnrollmentState>>();

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

function readPersisted(storage: MfaStorage, userId: string): PersistedEnrollment | null {
  const raw = storage.getItem(storageKey(userId));
  if (!raw) return null;

  try {
    const value = JSON.parse(raw) as Partial<PersistedEnrollment>;
    if (
      value.version !== STORAGE_VERSION ||
      value.userId !== userId ||
      typeof value.factorId !== "string" ||
      typeof value.qrCode !== "string" ||
      typeof value.secret !== "string"
    ) {
      storage.removeItem(storageKey(userId));
      return null;
    }
    return value as PersistedEnrollment;
  } catch {
    storage.removeItem(storageKey(userId));
    return null;
  }
}

function persistEnrollment(
  storage: MfaStorage,
  userId: string,
  enrollment: { factorId: string; qrCode: string; secret: string },
): void {
  storage.setItem(
    storageKey(userId),
    JSON.stringify({
      ...enrollment,
      userId,
      version: STORAGE_VERSION,
    } satisfies PersistedEnrollment),
  );
}

export function clearMfaEnrollment(storage: MfaStorage, userId: string): void {
  storage.removeItem(storageKey(userId));
}

function errorMessage(error: MfaError | null, fallback: string): string {
  return error?.message || fallback;
}

async function listTotpFactors(api: MfaApi): Promise<{
  unverified: MfaFactor[];
  verified: MfaFactor[];
}> {
  const result = await api.listFactors();
  if (result.error || !result.data) {
    throw new Error(errorMessage(result.error, "Unable to load MFA factors"));
  }

  const factors = result.data.all
    .filter((factor) => factor.factor_type === "totp")
    .sort((left, right) =>
      left.created_at === right.created_at
        ? left.id.localeCompare(right.id)
        : left.created_at.localeCompare(right.created_at),
    );

  return {
    unverified: factors.filter((factor) => factor.status === "unverified"),
    verified: factors.filter((factor) => factor.status === "verified"),
  };
}

async function removeUnverified(api: MfaApi, factors: MfaFactor[]): Promise<void> {
  for (const factor of factors) {
    if (factor.status !== "unverified") continue;
    const result = await api.unenroll({ factorId: factor.id });
    if (result.error) {
      throw new Error(errorMessage(result.error, "Unable to remove stale MFA enrollment"));
    }
  }
}

function challengeState(factor: MfaFactor): MfaEnrollmentState {
  return {
    factorId: factor.id,
    mode: "challenge",
    qrCode: null,
    secret: null,
  };
}

function recoveryState(factor: MfaFactor): MfaEnrollmentState {
  return {
    factorId: factor.id,
    mode: "recovery",
    qrCode: null,
    secret: null,
  };
}

function persistedState(enrollment: PersistedEnrollment): MfaEnrollmentState {
  return {
    factorId: enrollment.factorId,
    mode: "enrollment",
    qrCode: enrollment.qrCode,
    secret: enrollment.secret,
  };
}

async function recoverAfterEnrollError(
  options: EnrollmentOptions,
  originalError: MfaError | null,
  allowReplacement: boolean,
): Promise<MfaEnrollmentState> {
  const factors = await listTotpFactors(options.api);
  if (factors.verified[0]) {
    clearMfaEnrollment(options.storage, options.userId);
    return challengeState(factors.verified[0]);
  }
  if (factors.unverified.length === 1) {
    return recoveryState(factors.unverified[0]);
  }
  if (factors.unverified.length > 1 && allowReplacement) {
    await removeUnverified(options.api, factors.unverified);
    return createEnrollment(options, false);
  }

  throw new Error(errorMessage(originalError, "Unable to start MFA enrollment"));
}

async function createEnrollment(
  options: EnrollmentOptions,
  allowReplacement = true,
): Promise<MfaEnrollmentState> {
  const result = await options.api.enroll({
    factorType: "totp",
    friendlyName: MFA_FRIENDLY_NAME,
  });

  if (result.error || !result.data) {
    return recoverAfterEnrollError(options, result.error, allowReplacement);
  }

  const enrollment = {
    factorId: result.data.id,
    qrCode: result.data.totp.qr_code.trimEnd(),
    secret: result.data.totp.secret,
  };
  persistEnrollment(options.storage, options.userId, enrollment);

  return {
    ...enrollment,
    mode: "enrollment",
  };
}

async function prepare(options: EnrollmentOptions): Promise<MfaEnrollmentState> {
  const factors = await listTotpFactors(options.api);
  if (factors.verified[0]) {
    clearMfaEnrollment(options.storage, options.userId);
    return challengeState(factors.verified[0]);
  }

  const persisted = readPersisted(options.storage, options.userId);
  const activeFactor = persisted
    ? factors.unverified.find((factor) => factor.id === persisted.factorId)
    : undefined;

  if (persisted && activeFactor) {
    await removeUnverified(
      options.api,
      factors.unverified.filter((factor) => factor.id !== activeFactor.id),
    );
    return persistedState(persisted);
  }

  if (persisted) clearMfaEnrollment(options.storage, options.userId);

  if (factors.unverified.length === 1) {
    return recoveryState(factors.unverified[0]);
  }

  if (factors.unverified.length > 1) {
    await removeUnverified(options.api, factors.unverified);
  }

  return createEnrollment(options);
}

function singleFlight(
  options: EnrollmentOptions,
  operation: () => Promise<MfaEnrollmentState>,
): Promise<MfaEnrollmentState> {
  const existing = inFlight.get(options.userId);
  if (existing) return existing;

  const promise = operation().finally(() => {
    if (inFlight.get(options.userId) === promise) inFlight.delete(options.userId);
  });
  inFlight.set(options.userId, promise);
  return promise;
}

export function prepareMfaEnrollment(options: EnrollmentOptions): Promise<MfaEnrollmentState> {
  return singleFlight(options, () => prepare(options));
}

export function restartMfaEnrollment(options: EnrollmentOptions): Promise<MfaEnrollmentState> {
  return singleFlight(options, async () => {
    const factors = await listTotpFactors(options.api);
    if (factors.verified[0]) {
      clearMfaEnrollment(options.storage, options.userId);
      return challengeState(factors.verified[0]);
    }

    await removeUnverified(options.api, factors.unverified);
    clearMfaEnrollment(options.storage, options.userId);
    return createEnrollment(options);
  });
}

export async function cancelMfaEnrollment(options: EnrollmentOptions): Promise<void> {
  const pending = inFlight.get(options.userId);
  if (pending) await pending;

  const factors = await listTotpFactors(options.api);
  await removeUnverified(options.api, factors.unverified);
  clearMfaEnrollment(options.storage, options.userId);
}

export async function verifyMfaEnrollment(
  options: EnrollmentOptions & { code: string; factorId: string },
): Promise<void> {
  const result = await options.api.challengeAndVerify({
    code: options.code,
    factorId: options.factorId,
  });
  if (result.error) {
    throw new Error(errorMessage(result.error, "Unable to verify MFA code"));
  }
  clearMfaEnrollment(options.storage, options.userId);
}
