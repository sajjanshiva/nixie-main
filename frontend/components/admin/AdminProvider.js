"use client";
// Who is logged in as admin (separate from customer login).
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";

const Ctx = createContext(null);

export function AdminProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const d = await api("/admin/auth/me");
      setAdmin(d?.admin || null);
      return d?.admin || null;
    } catch {
      setAdmin(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    try {
      await api("/admin/auth/logout", { method: "POST" });
    } catch {}
    setAdmin(null);
  }, []);

  return <Ctx.Provider value={{ admin, loading, setAdmin, refresh, logout }}>{children}</Ctx.Provider>;
}

export function useAdmin() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAdmin must be used inside AdminProvider");
  return c;
}
