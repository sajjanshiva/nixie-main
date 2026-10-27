"use client";
// Who is logged in (customer). Loaded once from /api/auth/session.
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [justLoggedOut, setJustLoggedOut] = useState(false); // so private pages don't bounce to /login after "Log out"

  const refresh = useCallback(async () => {
    try {
      const data = await api("/auth/session");
      setCustomer(data?.customer || null);
      return data?.customer || null;
    } catch {
      setCustomer(null);
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
      await api("/auth/logout", { method: "POST" });
    } catch {
      /* logged out locally anyway */
    }
    setJustLoggedOut(true);
    setCustomer(null);
    setTimeout(() => setJustLoggedOut(false), 3000);
  }, []);

  return (
    <AuthContext.Provider value={{ customer, loading, refresh, setCustomer, logout, justLoggedOut }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
