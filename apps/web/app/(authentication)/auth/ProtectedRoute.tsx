"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getToken } from "@/services/auth/auth-service";
import { getPlatformAccounts } from "@/services/platforms/platform-service";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isCheckingPlatforms, setIsCheckingPlatforms] = useState(true);

  // Skip platform check if already on connect-platforms page
  const isOnConnectPlatforms = pathname === "/connect-platforms";

  // Step 1: if not authenticated → /auth/login
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // Step 2: if authenticated → check platforms → /connect-platforms if none
  useEffect(() => {
    if (isLoading || !isAuthenticated) return;

    // Don't redirect away from connect-platforms (avoids loop)
    if (isOnConnectPlatforms) {
      setIsCheckingPlatforms(false);
      return;
    }

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
        setIsCheckingPlatforms(false);
      });
  }, [isLoading, isAuthenticated, isOnConnectPlatforms, router]);

  if (isLoading || (isAuthenticated && isCheckingPlatforms)) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--accent-primary)] border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
