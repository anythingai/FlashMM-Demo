"use client";

import * as React from "react";

/**
 * useSessionState
 * Persist state in sessionStorage for session consistency between reloads.
 * Safe on SSR: reads only on client.
 */
export function useSessionState<T>(key: string, initialValue: T) {
  const [state, setState] = React.useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const raw = sessionStorage.getItem(key);
      return raw != null ? (JSON.parse(raw) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  React.useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify(state));
    } catch {
      // ignore write errors (private mode, storage full, etc.)
    }
  }, [key, state]);

  return [state, setState] as const;
}