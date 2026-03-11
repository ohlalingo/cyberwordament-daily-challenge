import React, { createContext, useContext, useState } from "react";

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
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const signIn = (email: string, _password: string) => {
    setUser({ name: email.split("@")[0], email, region: "Japan" });
  };

  const signUp = (name: string, email: string, _password: string, region: string) => {
    setUser({ name, email, region });
  };

  const signOut = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
