import assert from "node:assert/strict";
import test from "node:test";
import {
  cancelMfaEnrollment,
  prepareMfaEnrollment,
  restartMfaEnrollment,
  verifyMfaEnrollment,
} from "../lib/mfa-enrollment.ts";

function memoryStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    removeItem(key) {
      values.delete(key);
    },
    setItem(key, value) {
      values.set(key, value);
    },
    size() {
      return values.size;
    },
  };
}

function factor(id, status = "unverified", createdAt = "2026-07-15T00:00:00.000Z") {
  return {
    created_at: createdAt,
    factor_type: "totp",
    friendly_name: "CCM Assistant",
    id,
    status,
    updated_at: createdAt,
  };
}

function fakeApi(initialFactors = [], options = {}) {
  const factors = [...initialFactors];
  const calls = { enroll: 0, list: 0, unenroll: [], verify: 0 };
  let nextId = 1;

  return {
    calls,
    factors,
    async challengeAndVerify({ code, factorId }) {
      calls.verify += 1;
      if (options.verifyError) return { data: null, error: { message: options.verifyError } };
      const current = factors.find((item) => item.id === factorId);
      if (!current || code !== "123456") {
        return { data: null, error: { message: "Invalid verification code" } };
      }
      current.status = "verified";
      return { data: {}, error: null };
    },
    async enroll() {
      calls.enroll += 1;
      if (options.enrollDelay) await options.enrollDelay();
      const id = `new-${nextId++}`;
      const created = factor(id, "unverified", `2026-07-15T00:00:0${nextId}.000Z`);
      factors.push(created);
      if (options.loseFirstEnrollResponse && calls.enroll === 1) {
        return {
          data: null,
          error: {
            message:
              options.firstEnrollErrorMessage ??
              "Network request failed",
          },
        };
      }
      return {
        data: { id, totp: { qr_code: `qr:${id} \n`, secret: `secret:${id}` } },
        error: null,
      };
    },
    async listFactors() {
      calls.list += 1;
      return {
        data: {
          all: [...factors],
          totp: factors.filter((item) => item.status === "verified"),
        },
        error: null,
      };
    },
    async unenroll({ factorId }) {
      calls.unenroll.push(factorId);
      const index = factors.findIndex((item) => item.id === factorId);
      if (index >= 0) factors.splice(index, 1);
      return { data: {}, error: null };
    },
  };
}

const userId = "user-1";

test("Strict Mode double render shares one enrollment request", async () => {
  let release;
  const wait = new Promise((resolve) => {
    release = resolve;
  });
  const api = fakeApi([], { enrollDelay: () => wait });
  const storage = memoryStorage();
  const first = prepareMfaEnrollment({ api, storage, userId });
  const second = prepareMfaEnrollment({ api, storage, userId });

  release();
  const [left, right] = await Promise.all([first, second]);

  assert.deepEqual(left, right);
  assert.equal(api.calls.enroll, 1);
  assert.equal(api.factors.length, 1);
});

test("an empty account creates exactly one persisted enrollment", async () => {
  const api = fakeApi();
  const storage = memoryStorage();
  const state = await prepareMfaEnrollment({ api, storage, userId });

  assert.equal(state.mode, "enrollment");
  assert.equal(state.factorId, "new-1");
  assert.equal(state.qrCode, "qr:new-1");
  assert.equal(api.calls.enroll, 1);
  assert.equal(storage.size(), 1);
});

test("reload and back-button remount recover the same factor and QR code", async () => {
  const api = fakeApi();
  const storage = memoryStorage();
  const initial = await prepareMfaEnrollment({ api, storage, userId });
  const reloaded = await prepareMfaEnrollment({ api, storage, userId });

  assert.deepEqual(reloaded, initial);
  assert.equal(api.calls.enroll, 1);
  assert.equal(api.calls.unenroll.length, 0);
});

test("an expired or missing persisted factor is replaced exactly once", async () => {
  const api = fakeApi();
  const storage = memoryStorage();
  await prepareMfaEnrollment({ api, storage, userId });
  api.factors.splice(0, api.factors.length);

  const recovered = await prepareMfaEnrollment({ api, storage, userId });

  assert.equal(recovered.mode, "enrollment");
  assert.equal(recovered.factorId, "new-2");
  assert.equal(api.calls.enroll, 2);
  assert.equal(api.factors.length, 1);
});

test("one unknown unverified factor is reused without automatic replacement", async () => {
  const api = fakeApi([factor("existing")]);
  const state = await prepareMfaEnrollment({ api, storage: memoryStorage(), userId });

  assert.equal(state.mode, "recovery");
  assert.equal(state.factorId, "existing");
  assert.equal(api.calls.enroll, 0);
  assert.deepEqual(api.calls.unenroll, []);
});

test("duplicate unverified factors are cleaned before one replacement is created", async () => {
  const api = fakeApi([
    factor("stale-1", "unverified", "2026-07-14T00:00:00.000Z"),
    factor("stale-2", "unverified", "2026-07-15T00:00:00.000Z"),
  ]);
  const state = await prepareMfaEnrollment({ api, storage: memoryStorage(), userId });

  assert.deepEqual(api.calls.unenroll, ["stale-1", "stale-2"]);
  assert.equal(api.calls.enroll, 1);
  assert.equal(api.factors.length, 1);
  assert.equal(state.factorId, "new-1");
});

test("verified factors are preserved and selected without enrollment mutations", async () => {
  const api = fakeApi([factor("verified", "verified"), factor("pending")]);
  const state = await prepareMfaEnrollment({ api, storage: memoryStorage(), userId });

  assert.equal(state.mode, "challenge");
  assert.equal(state.factorId, "verified");
  assert.equal(api.calls.enroll, 0);
  assert.deepEqual(api.calls.unenroll, []);
  assert.equal(api.factors.some((item) => item.id === "verified"), true);
});

test("cancel removes only unverified setup and restart creates one fresh factor", async () => {
  const verified = factor("verified", "verified");
  const api = fakeApi([verified]);
  const storage = memoryStorage();

  api.factors.push(factor("pending"));
  await cancelMfaEnrollment({ api, storage, userId });
  assert.deepEqual(api.calls.unenroll, ["pending"]);
  assert.equal(api.factors.some((item) => item.id === "verified"), true);

  api.factors.splice(0, api.factors.length);
  const restarted = await restartMfaEnrollment({ api, storage, userId });
  assert.equal(restarted.mode, "enrollment");
  assert.equal(api.calls.enroll, 1);
  assert.equal(api.factors.length, 1);
});

test("successful verification clears persisted QR state", async () => {
  const api = fakeApi();
  const storage = memoryStorage();
  const state = await prepareMfaEnrollment({ api, storage, userId });

  await verifyMfaEnrollment({
    api,
    code: "123456",
    factorId: state.factorId,
    storage,
    userId,
  });

  assert.equal(api.calls.verify, 1);
  assert.equal(storage.size(), 0);
  assert.equal(api.factors[0].status, "verified");
});

test("a duplicate-name API retry recovers the server factor without duplication", async () => {
  const api = fakeApi([], {
    firstEnrollErrorMessage: 'A factor with the friendly name "CCM Assistant" for this user already exists',
    loseFirstEnrollResponse: true,
  });
  const state = await prepareMfaEnrollment({ api, storage: memoryStorage(), userId });

  assert.equal(state.mode, "recovery");
  assert.equal(state.factorId, "new-1");
  assert.equal(api.calls.enroll, 1);
  assert.equal(api.factors.length, 1);
});
