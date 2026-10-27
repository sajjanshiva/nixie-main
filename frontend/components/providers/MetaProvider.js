"use client";
// Public settings from the backend (/api/meta): states list, contact details, Google client id…
import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { FALLBACK_STATES } from "@/lib/content";

const DEFAULT_META = {
  contactEmail: "aishwarya@thenixie.in",
  contactPhone: "",
  instagramUrl: "https://instagram.com/thenixie.in",
  googleClientId: "",
  cashfreeMode: "sandbox",
  states: FALLBACK_STATES,
  limits: { guestAnalysesPerDay: 3, userAnalysesPerHour: 15, maxUploadMb: 10, customerPasswordMin: 8, otpResendSeconds: 60 },
};

const MetaContext = createContext({ meta: DEFAULT_META, ready: false });

export function MetaProvider({ children }) {
  const [state, setState] = useState({ meta: DEFAULT_META, ready: false });

  useEffect(() => {
    let alive = true;
    api("/meta")
      .then((m) => {
        if (!alive) return;
        setState({
          meta: { ...DEFAULT_META, ...m, states: m?.states?.length ? m.states : FALLBACK_STATES, limits: { ...DEFAULT_META.limits, ...(m?.limits || {}) } },
          ready: true,
        });
      })
      .catch(() => alive && setState({ meta: DEFAULT_META, ready: true }));
    return () => {
      alive = false;
    };
  }, []);

  return <MetaContext.Provider value={state}>{children}</MetaContext.Provider>;
}

export function useMeta() {
  return useContext(MetaContext);
}
