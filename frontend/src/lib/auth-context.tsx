"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, UserRole } from "./types";
import { getCurrentUser, loginUser, registerUser } from "./api";

export interface RegisterUserData {
  name: string;
  email: string;
  password: string;
  phone: string;
  role?: string;
  employee_code?: string;
  organization?: string;
  service_area?: string;
}

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (data: RegisterUserData) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  updatePointsBalance: (points: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = () => {
    localStorage.removeItem("w2w_token");
    localStorage.removeItem("w2w_user");
    setUser(null);
    setRole(null);
    setToken(null);
  };

  useEffect(() => {
    const storedToken = typeof window !== "undefined" ? localStorage.getItem("w2w_token") : null;
    const storedUserData = typeof window !== "undefined" ? localStorage.getItem("w2w_user") : null;

    if (storedToken) {
      setToken(storedToken);
      if (storedUserData) {
        try {
          const parsed = JSON.parse(storedUserData);
          setUser({
            id: parsed.user_id || parsed.id || "",
            name: parsed.name || "User",
            email: parsed.email || "",
            phone: parsed.phone || "",
            role: parsed.role || "CITIZEN",
            points_balance: parsed.points_balance || 0,
            is_active: true,
            created_at: "",
          });
          setRole(parsed.role as UserRole);
        } catch (e) {
          console.warn("Failed to parse cached user:", e);
        }
      }
      setIsLoading(false);

      // Refresh full profile in background
      getCurrentUser()
        .then((userData) => {
          setUser(userData);
          setRole(userData.role as UserRole);
          const cached = localStorage.getItem("w2w_user");
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              localStorage.setItem(
                "w2w_user",
                JSON.stringify({
                  ...parsed,
                  points_balance: userData.points_balance,
                  name: userData.name,
                })
              );
            } catch (_) {}
          }
        })
        .catch((err) => {
          // Only invalidate session if explicitly 401 Unauthorized
          const msg = String(err?.message || "");
          if (msg.includes("401") || msg.includes("credentials") || msg.includes("unauthorized")) {
            logout();
          }
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const auth = await loginUser(email, pass);
      setToken(auth.access_token);
      setRole(auth.role);

      // Immediately populate user so isAuthenticated is true without network roundtrip delay
      const initialUser: User = {
        id: auth.user_id,
        name: auth.name,
        email: auth.email,
        phone: "",
        role: auth.role,
        points_balance: 0,
        is_active: true,
        created_at: new Date().toISOString(),
      };
      setUser(initialUser);

      // Sync latest full profile in background
      getCurrentUser()
        .then((profile) => {
          setUser(profile);
          const cached = localStorage.getItem("w2w_user");
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              localStorage.setItem(
                "w2w_user",
                JSON.stringify({ ...parsed, points_balance: profile.points_balance })
              );
            } catch (_) {}
          }
        })
        .catch((e) => console.warn("Background profile fetch:", e));
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterUserData) => {
    setIsLoading(true);
    try {
      const auth = await registerUser(data);
      setToken(auth.access_token);
      setRole(auth.role);

      const initialUser: User = {
        id: auth.user_id,
        name: auth.name,
        email: auth.email,
        phone: data.phone || "",
        role: auth.role,
        points_balance: 0,
        is_active: true,
        created_at: new Date().toISOString(),
      };
      setUser(initialUser);

      getCurrentUser()
        .then((profile) => setUser(profile))
        .catch((e) => console.warn("Background profile fetch:", e));
    } finally {
      setIsLoading(false);
    }
  };


  const refreshProfile = async () => {
    if (!token) return;
    try {
      const profile = await getCurrentUser();
      setUser(profile);
      setRole(profile.role as UserRole);
    } catch (e) {
      console.error("Failed to refresh user profile", e);
    }
  };

  const updatePointsBalance = (points: number) => {
    setUser((prev) => (prev ? { ...prev, points_balance: points } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
        refreshProfile,
        updatePointsBalance,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
