"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { authAPI, type User } from "@/lib/api";

type AuthCtx = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string, phone?: string, city?: string, address?: string, gender?: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
};

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("ql_token");
    if (stored) {
      authAPI.me(stored)
        .then(({ user }) => { setUser(user); setToken(stored); })
        .catch(() => localStorage.removeItem("ql_token"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authAPI.login({ email, password });
    setUser(res.user);
    setToken(res.token);
    localStorage.setItem("ql_token", res.token);
  };

  const register = async (name: string, email: string, password: string, role = "user", phone?: string, city?: string, address?: string, gender?: string) => {
    const res = await authAPI.register({ name, email, password, role, phone, city, address, gender });
    setUser(res.user);
    setToken(res.token);
    localStorage.setItem("ql_token", res.token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("ql_token");
    router.push("/");
  };

  const updateUser = (u: User) => {
    setUser(u);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
