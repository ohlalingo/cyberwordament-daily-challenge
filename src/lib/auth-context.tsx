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
  signUp: (name: string, email: string, password: string, language: string, region?: string) => void;
  signOut: () => void;
  loaded: boolean;
  isHydrated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_KEY = "auth_user";
const EXPIRY_KEY = "auth_expiry";
const SESSION_MS = 5 * 60 * 1000; // 5 minutes
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

  const signIn = async (email: string, password: string, language = "en") => {
    // Prefer backend auth to pull real name/language
    try {
      const res = await fetch(`${API_BASE}/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        throw new Error(`Signin failed: HTTP ${res.status}`);
      }
      const userData = (await res.json()) as User;
      // Honor the currently selected UI language if provided
      userData.language = (language as Language) || (userData.language as Language) || "en";
      // region comes from backend; keep as-is
      // Persist
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
    } catch (err) {
      // Fallback to local stub if backend unreachable
      console.warn("Backend signin failed, falling back to local stub", err);
      let persistedName: string | undefined;
      let persistedLang: string | undefined;
      let nameMap: Record<string, string> = {};
      let persistedRegion: string | undefined;
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem(SESSION_KEY);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (parsed.email === email) {
              persistedName = parsed.name;
              persistedLang = parsed.language;
              persistedRegion = parsed.region;
            }
          } catch {
            /* ignore corrupt */
          }
        }
        const mapRaw = localStorage.getItem(NAME_MAP_KEY);
        if (mapRaw) {
          try {
            nameMap = JSON.parse(mapRaw) || {};
            if (nameMap[email]) persistedName = persistedName || nameMap[email];
          } catch {
            /* ignore corrupt */
          }
        }
      }
      const userData: User = {
        id: Date.now(),
        name: persistedName || email.split("@")[0],
        email,
        language: language || persistedLang || "en",
        region: persistedRegion,
      };
      setUser(userData);
      setLanguage(userData.language as Language);
      localStorage.setItem(EXPIRY_KEY, String(Date.now() + SESSION_MS));
      localStorage.setItem("lang", userData.language);
      localStorage.setItem(NAME_MAP_KEY, JSON.stringify({ ...nameMap, [email]: userData.name }));
      return userData;
    }
  };

  const signUp = async (name: string, email: string, _password: string, language: string, region?: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password: _password, language, region }),
      });
      if (!res.ok) {
        throw new Error(`Signup failed: HTTP ${res.status}`);
      }
      const userData = (await res.json()) as User;
      userData.language = (language as Language) || (userData.language as Language) || "en";
      userData.region = region || userData.region;
      setUser(userData);
      setLanguage(userData.language as Language);
      localStorage.setItem("lang", userData.language);
      if (typeof window !== "undefined") {
        const mapRaw = localStorage.getItem(NAME_MAP_KEY);
        const map = mapRaw ? (JSON.parse(mapRaw) || {}) : {};
        map[email] = userData.name;
        localStorage.setItem(NAME_MAP_KEY, JSON.stringify(map));
      }
    } catch (err) {
      console.warn("Backend signup failed, falling back to local stub", err);
      setUser({ id: Date.now(), name, email, language, region }); // temp id
      setLanguage(language as Language);
      localStorage.setItem("lang", language);
      if (typeof window !== "undefined") {
        const mapRaw = localStorage.getItem(NAME_MAP_KEY);
        const map = mapRaw ? (JSON.parse(mapRaw) || {}) : {};
        map[email] = name;
        localStorage.setItem(NAME_MAP_KEY, JSON.stringify(map));
      }
    }
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
