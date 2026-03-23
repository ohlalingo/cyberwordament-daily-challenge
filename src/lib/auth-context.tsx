import React, { createContext, useContext, useEffect, useState } from "react";
import { API_BASE } from "./config";
import { useI18n } from "./i18n";

interface User {
  id: number;
  name: string;
  email: string;
  language: string;
  region?: string | null;
}

interface AuthContextType {
  user: User | null;
  signIn: (email: string, password: string, language?: string) => Promise<any>;
  signUp: (name: string, email: string, password: string, region: string, language: string) => Promise<void>;
  signOut: () => void;
  loaded: boolean;
  isHydrated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_KEY = "auth_user";
const EXPIRY_KEY = "auth_expiry";
const SESSION_MS = 5 * 60 * 1000; // 5 minutes
const USER_ID_KEY = "current_user_id";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loaded, setLoaded] = useState(false);
  const { setLanguage } = useI18n();

  const clearCompletionMarkers = () => {
    if (typeof window === "undefined") return;
    const keys = Object.keys(localStorage).filter((k) => k.startsWith("completed_puzzle_"));
    keys.forEach((k) => localStorage.removeItem(k));
  };

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
        setLanguage(hydrated.language);
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
      localStorage.setItem(USER_ID_KEY, String(user.id));
    } else {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(EXPIRY_KEY);
      localStorage.removeItem(USER_ID_KEY);
    }
  }, [user]);

  const signIn = async (email: string, password: string, language = "en") => {
    const prevUserId = Number(localStorage.getItem(USER_ID_KEY));
    const res = await fetch(`${API_BASE}/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const msg = body?.error || "Login failed";
      throw new Error(msg);
    }

    const data = await res.json();
    const userData: User = {
      id: data.id,
      name: data.name || email.split("@")[0],
      email: data.email || email,
      language: language || data.language || data.region || "en",
      region: data.region,
    };

    // If logging in as a different user, clear completion markers
    if (prevUserId && prevUserId !== userData.id) {
      clearCompletionMarkers();
    }

    setUser(userData);
    setLanguage(userData.language);
    localStorage.setItem(EXPIRY_KEY, String(Date.now() + SESSION_MS));
    localStorage.setItem("lang", userData.language);
    if (data.token) {
      localStorage.setItem("token", data.token);
    }

    return data;
  };

  const signUp = async (name: string, email: string, password: string, region: string, language: string) => {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, language, region }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.error || "Signup failed");
    }

    const data = await res.json();
    const userData: User = {
      id: data.id,
      name: data.name || name,
      email: data.email || email,
      language: data.language || language || "en",
      region: data.region || region,
    };
    clearCompletionMarkers(); // new account, ensure a clean slate
    setUser(userData);
    setLanguage(userData.language);
    localStorage.setItem("lang", userData.language);
  };

  const signOut = () => {
    clearCompletionMarkers();
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
