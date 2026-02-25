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
  loginWithToken: (token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Skip the API call entirely when there is no token — avoids a
    // failed /auth/me request on pages like /auth/callback that save
    // the token themselves via loginWithToken().
    if (!authService.getToken()) {
      setIsLoading(false);
      return;
    }
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

  const loginWithToken = useCallback(async (token: string) => {
    authService.saveToken(token);
    resetSocket(); // discard any unauthenticated socket before fetching user
    const me = await authService.getCurrentUser();
    setUser(me);
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
        loginWithToken,
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