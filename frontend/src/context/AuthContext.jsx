import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { loginUser } from "../services/api";

const STORAGE_KEY = "erp-user-session";

const AuthContext = createContext(null);

function getStoredSession() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getStoredSession());
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    if (session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [session]);

  const value = useMemo(
    () => ({
      session,
      isAuthenticated: Boolean(session),
      authLoading,
      login: async ({ username, password, tenant, role }) => {
        const normalizedUsername = username.trim();
        const normalizedTenant = tenant.trim();
        const normalizedPassword = password.trim();
        const tenantSlug = normalizedTenant.toLowerCase().replace(/\s+/g, "-");

        if (!normalizedUsername || !normalizedPassword || !normalizedTenant || !role) {
          return { ok: false, message: "Please complete all login fields." };
        }

        try {
          setAuthLoading(true);
          const response = await loginUser({
            tenant: tenantSlug,
            role,
            username: normalizedUsername,
            password: normalizedPassword,
          });

          const nextSession = {
            username: response.user.username,
            tenant: normalizedTenant,
            tenantSlug,
            role: response.user.role,
            displayName: response.user.displayName,
            avatarSeed: response.user.displayName.slice(0, 2).toUpperCase(),
            lastLogin: new Date().toISOString(),
          };

          setSession(nextSession);
          return { ok: true };
        } catch (error) {
          return { ok: false, message: error.message };
        } finally {
          setAuthLoading(false);
        }
      },
      logout: () => setSession(null),
    }),
    [authLoading, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
