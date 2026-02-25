"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getToken } from "@/services/auth/auth-service";
import { getPlatformAccounts } from "@/services/platforms/platform-service";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [isCheckingPlatforms, setIsCheckingPlatforms] = useState(true);

  // Step 1: if not authenticated → /auth/login
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // Step 2: if authenticated → check platforms → /connect-platforms if none
  useEffect(() => {
    if (isLoading || !isAuthenticated) return;

    const token = getToken();
    if (!token) return;

    getPlatformAccounts(token)
      .then(({ total }) => {
        if (total === 0) {
          router.replace("/connect-platforms");
        } else {
          setIsCheckingPlatforms(false);
        }
      })
      .catch(() => {
        // If the check fails, show the dashboard anyway
        setIsCheckingPlatforms(false);
      });
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || (isAuthenticated && isCheckingPlatforms)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}