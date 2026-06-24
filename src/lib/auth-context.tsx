import React, { createContext, useContext, useEffect, useState } from "react";
import { useI18n, Language } from "./i18n";
import { API_BASE } from "./config";

interface User {
  id: number;
  name: string;
  email: string;
  language: string;
  region?: string;
}

interface AuthContextType {
  user: User | null;
  signIn: (email: string, password: string, language?: string) => Promise<any>;
  signUp: (name: string, email: string, password: string, language: string, region?: string) => Promise<void>;
  signOut: () => void;
  loaded: boolean;
  isHydrated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_KEY = "auth_user";
const EXPIRY_KEY = "auth_expiry";
const SESSION_MS = 20 * 60 * 1000; // 20 minutes of inactivity
const NAME_MAP_KEY = "auth_name_map"; // email -> name

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loaded, setLoaded] = useState(false);
  const { setLanguage } = useI18n();

  // Hydrate from localStorage on first mount
  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem(SESSION_KEY) : null;
    const expiry = typeof window !== "undefined" ? Number(localStorage.getItem(EXPIRY_KEY)) : 0;
    const now = Date.now();
    if (expiry && expiry < now) {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(EXPIRY_KEY);
    }
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const hydrated: User = {
          id: parsed.id,
          name: parsed.name,
          email: parsed.email,
          language: parsed.language || parsed.region || "en",
          region: parsed.region,
        };
        setUser(hydrated);
        setLanguage(hydrated.language as Language);
        localStorage.setItem("lang", hydrated.language);
      } catch {
        localStorage.removeItem("auth_user");
      }
    }
    setLoaded(true);
  }, []);

  // Persist on change
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      localStorage.setItem(EXPIRY_KEY, String(Date.now() + SESSION_MS));
      localStorage.setItem("lang", user.language);
    } else {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(EXPIRY_KEY);
    }
  }, [user]);

  // Drop any cached per-puzzle completion flags from the previous session so a
  // new user doesn't inherit completed/locked cards on the dashboard.
  const clearPuzzleProgressFlags = () => {
    try {
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith("completed_puzzle_")) localStorage.removeItem(k);
      });
    } catch { /* ignore */ }
  };

  const signIn = async (email: string, password: string, language = "en") => {
    const res = await fetch(`${API_BASE}/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(body?.error || `Signin failed: HTTP ${res.status}`);
    }

    const userData = body as User;
    userData.language = (language as Language) || (userData.language as Language) || "en";
    clearPuzzleProgressFlags();
    setUser(userData);
    setLanguage(userData.language as Language);
    localStorage.setItem(EXPIRY_KEY, String(Date.now() + SESSION_MS));
    localStorage.setItem("lang", userData.language);
    if (typeof window !== "undefined") {
      const mapRaw = localStorage.getItem(NAME_MAP_KEY);
      const map = mapRaw ? (JSON.parse(mapRaw) || {}) : {};
      map[email] = userData.name;
      localStorage.setItem(NAME_MAP_KEY, JSON.stringify(map));
    }
    return userData;
  };

  const signUp = async (name: string, email: string, password: string, language: string, region?: string) => {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, language, region }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(body?.error || `Signup failed: HTTP ${res.status}`);
    }

    const userData = body as User;
    userData.language = (language as Language) || (userData.language as Language) || "en";
    userData.region = region || userData.region;
    clearPuzzleProgressFlags();
    setUser(userData);
    setLanguage(userData.language as Language);
    localStorage.setItem("lang", userData.language);
    if (typeof window !== "undefined") {
      const mapRaw = localStorage.getItem(NAME_MAP_KEY);
      const map = mapRaw ? (JSON.parse(mapRaw) || {}) : {};
      map[email] = userData.name;
      localStorage.setItem(NAME_MAP_KEY, JSON.stringify(map));
    }
  };

  const signOut = () => {
    clearPuzzleProgressFlags();
    setUser(null);
  };

  // Inactivity timer: bump expiry on activity
  useEffect(() => {
    if (!user) return;
    const bump = () => {
      localStorage.setItem(EXPIRY_KEY, String(Date.now() + SESSION_MS));
    };
    const events = ["click", "keydown", "mousemove", "touchstart"];
    events.forEach((ev) => window.addEventListener(ev, bump));
    return () => events.forEach((ev) => window.removeEventListener(ev, bump));
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, signOut, loaded, isHydrated: loaded }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
