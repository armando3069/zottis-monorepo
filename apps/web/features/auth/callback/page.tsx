"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveToken } from "@/services/auth/auth-service";
import { getPlatformAccounts } from "@/services/platforms/platform-service";

// Inner component that reads search params (must be inside Suspense).
function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const token = searchParams.get("token");

    if (!token) {
      router.replace("/auth/login");
      return;
    }

    // Persist the token synchronously so subsequent requests can use it.
    saveToken(token);

    // Check whether the user already has connected platforms.
    // We pass the token directly — no need for an extra /auth/me round-trip.
    getPlatformAccounts(token)
      .then(({ total }) => {
        router.replace(total === 0 ? "/connect-platforms" : "/");
      })
      .catch((err) => {
        // Platform check failed — log the error and fall back to dashboard.
        console.error("[auth/callback] Failed to fetch platform accounts:", err);
        router.replace("/");
      });
  }, [router, searchParams]);

  return null;
}

// This page is the redirect target for Google OAuth2.
// The backend redirects here with: /auth/callback?token=<JWT>
export default function CallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        <p className="text-sm text-slate-500">Completing sign-in…</p>
        <Suspense>
          <CallbackHandler />
        </Suspense>
      </div>
    </div>
  );
}