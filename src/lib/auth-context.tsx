import React, { createContext, useContext, useEffect, useState } from "react";

interface User {
  name: string;
  email: string;
  region: string;
}

interface AuthContextType {
  user: User | null;
  signIn: (email: string, password: string) => void;
  signUp: (name: string, email: string, password: string, region: string) => void;
  signOut: () => void;
  loaded: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Hydrate from localStorage on first mount
  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem("auth_user") : null;
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {
        localStorage.removeItem("auth_user");
      }
    }
    setLoaded(true);
  }, []);

  // Persist on change
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (user) localStorage.setItem("auth_user", JSON.stringify(user));
    else localStorage.removeItem("auth_user");
  }, [user]);

  const signIn = async (email: string, password: string) => {
    const API_BASE =
      import.meta.env.VITE_API_BASE ||
      import.meta.env.VITE_API_URL ||
      "http://13.60.205.129:3000";

    const res = await fetch(`${API_BASE}/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      throw new Error("Login failed");
    }

    const data = await res.json();
    const userData: User = {
      name: data.name || email.split("@")[0],
      email: data.email || email,
      region: data.region || "Japan",
    };

    setUser(userData);
    if (data.token) {
      localStorage.setItem("token", data.token);
    }

    return data;
  };

  const signUp = (name: string, email: string, _password: string, region: string) => {
    setUser({ name, email, region });
  };

  const signOut = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, signOut, loaded }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
