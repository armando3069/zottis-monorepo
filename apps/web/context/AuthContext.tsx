"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";

import type { AuthUser, LoginPayload, SignupPayload } from "@/services/auth/auth-types";
import * as authService from "@/services/auth/auth-service";
import { resetSocket } from "@/lib/socket";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  signup: (payload: SignupPayload) => Promise<void>;
  logout: () => void;
  startGoogleLogin: () => void;
  loginWithSlack: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    authService
      .getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    resetSocket(); // discard any unauthenticated socket
    await authService.login(payload);
    const me = await authService.getCurrentUser();
    setUser(me);
  }, []);

  const signup = useCallback(async (payload: SignupPayload) => {
    resetSocket();
    await authService.signup(payload);
    const me = await authService.getCurrentUser();
    setUser(me);
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    resetSocket(); // disconnect so the next login starts fresh
    setUser(null);
  }, []);

  const startGoogleLogin = useCallback(() => {
    authService.startGoogleLogin();
  }, []);

  const loginWithSlack = useCallback(() => {
    authService.startSlackLogin();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
        login,
        signup,
        logout,
        startGoogleLogin,
        loginWithSlack,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}