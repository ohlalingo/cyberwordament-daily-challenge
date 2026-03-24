import React, { createContext, useContext, useEffect, useState } from "react";
import { useI18n, Language } from "./i18n";

interface User {
  id: number;
  name: string;
  email: string;
  language: string;
}

interface AuthContextType {
  user: User | null;
  signIn: (email: string, password: string, language?: string) => Promise<any>;
  signUp: (name: string, email: string, password: string, language: string) => void;
  signOut: () => void;
  loaded: boolean;
  isHydrated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_KEY = "auth_user";
const EXPIRY_KEY = "auth_expiry";
const SESSION_MS = 5 * 60 * 1000; // 5 minutes

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

  const signIn = async (email: string, password: string, language = "en") => {
    // Local-only auth — no backend required
    const userData: User = {
      id: Date.now(),
      name: email.split("@")[0],
      email,
      language,
    };
    setUser(userData);
    setLanguage(userData.language);
    localStorage.setItem(EXPIRY_KEY, String(Date.now() + SESSION_MS));
    localStorage.setItem("lang", userData.language);
    return userData;
  };

  const signUp = (name: string, email: string, _password: string, language: string) => {
    setUser({ id: Date.now(), name, email, language }); // temp id until server returns one (signup not wired here)
    setLanguage(language);
    localStorage.setItem("lang", language);
  };

  const signOut = () => setUser(null);

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
