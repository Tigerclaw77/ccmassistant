"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEVELOPMENT_PERSONA_EVENT,
  DEVELOPMENT_PERSONA_SESSION_KEY,
  type DevelopmentPersonaContext,
  type DevelopmentPersonaId,
  isDevelopmentPersonaEnabled,
  sanitizeDevelopmentPersonaContext,
} from "../../lib/development-persona";

function readContext(): DevelopmentPersonaContext | null {
  if (!isDevelopmentPersonaEnabled() || typeof window === "undefined") return null;
  try {
    const stored = sessionStorage.getItem(DEVELOPMENT_PERSONA_SESSION_KEY);
    return stored ? sanitizeDevelopmentPersonaContext(JSON.parse(stored)) : null;
  } catch {
    sessionStorage.removeItem(DEVELOPMENT_PERSONA_SESSION_KEY);
    return null;
  }
}

function announce(context: DevelopmentPersonaContext | null) {
  window.dispatchEvent(new CustomEvent(DEVELOPMENT_PERSONA_EVENT, { detail: context }));
}

export function useDevelopmentPersona() {
  const enabled = isDevelopmentPersonaEnabled();
  const [context, setContextState] = useState<DevelopmentPersonaContext | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const frame = window.requestAnimationFrame(() => setContextState(readContext()));
    const update = (event: Event) => {
      setContextState(sanitizeDevelopmentPersonaContext((event as CustomEvent<unknown>).detail));
    };
    window.addEventListener(DEVELOPMENT_PERSONA_EVENT, update);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener(DEVELOPMENT_PERSONA_EVENT, update);
    };
  }, [enabled]);

  const setContext = useCallback((next: DevelopmentPersonaContext) => {
    if (!isDevelopmentPersonaEnabled()) return;
    const previous = readContext();
    const activePracticeId = localStorage.getItem("activePracticeId") ?? undefined;
    const sanitized = sanitizeDevelopmentPersonaContext({
      ...next,
      originalPracticeId: next.originalPracticeId ?? previous?.originalPracticeId ?? activePracticeId,
    });
    if (!sanitized) return;
    sessionStorage.setItem(DEVELOPMENT_PERSONA_SESSION_KEY, JSON.stringify(sanitized));
    if (sanitized.practiceId) localStorage.setItem("activePracticeId", sanitized.practiceId);
    setContextState(sanitized);
    announce(sanitized);
  }, []);

  const selectPersona = useCallback((personaId: DevelopmentPersonaId) => {
    const previous = readContext();
    setContext({
      ...(previous ?? {}),
      personaId,
      practiceId: previous?.practiceId ?? localStorage.getItem("activePracticeId") ?? undefined,
    });
  }, [setContext]);

  const reset = useCallback(() => {
    const previous = readContext();
    sessionStorage.removeItem(DEVELOPMENT_PERSONA_SESSION_KEY);
    if (previous?.originalPracticeId) localStorage.setItem("activePracticeId", previous.originalPracticeId);
    setContextState(null);
    announce(null);
  }, []);

  return { context, enabled, reset, selectPersona, setContext };
}
