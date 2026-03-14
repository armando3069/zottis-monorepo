"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Mail, Lock, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { AuthRightPanel } from "@/components/auth/AuthRightPanel";

export default function LoginPage() {
  const router = useRouter();
  const { login, startGoogleLogin } = useAuth();

  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [error, setError]           = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login({ email, password });
      router.replace("/inbox");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">

      {/* ── Left panel: Form ──────────────────────────────────────────── */}
      <div className="relative flex flex-col w-full lg:w-[480px] lg:min-w-[480px] bg-white px-8 sm:px-12 py-10 justify-between border-r border-[#F3F4F6]">

        {/* Logo */}
        <div>
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <Image
              src="/logo.svg"
              width={32}
              height={32}
              alt="AI Inbox"
              className="w-8 h-8 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.10)]"
            />
            <span className="text-[15px] font-semibold text-[#111827] tracking-tight">
              AI Inbox
            </span>
          </Link>
        </div>

        {/* Form area */}
        <div className="w-full max-w-[360px] mx-auto py-12">

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-[26px] font-semibold text-[#111827] tracking-[-0.02em] leading-tight">
              Welcome back
            </h1>
            <p className="text-[14px] text-[#9CA3AF] mt-1.5 leading-relaxed">
              Sign in to continue to your inbox
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-[13px] text-red-600 flex items-center gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Google */}
          <button
            type="button"
            onClick={startGoogleLogin}
            className="w-full flex items-center justify-center gap-3 h-11 rounded-[10px] border border-[#E5E7EB] bg-white text-[13px] font-medium text-[#374151] hover:bg-[#F9FAFB] active:scale-[0.99] transition-all duration-150 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[#F3F4F6]" />
            <span className="text-[11px] text-[#D1D5DB] uppercase tracking-widest font-medium">or</span>
            <div className="flex-1 h-px bg-[#F3F4F6]" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-[12.5px] font-medium text-[#374151] mb-1.5 tracking-tight">
                Email address
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-[#D1D5DB] pointer-events-none"
                  strokeWidth={1.75}
                />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 pl-[42px] pr-3.5 rounded-[10px] border border-[#E5E7EB] bg-[#FAFAFA] text-[13px] text-[#111827] placeholder-[#D1D5DB] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#111827]/8 focus:border-[#9CA3AF] transition-all duration-150"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-[12.5px] font-medium text-[#374151] mb-1.5 tracking-tight">
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-[#D1D5DB] pointer-events-none"
                  strokeWidth={1.75}
                />
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 pl-[42px] pr-3.5 rounded-[10px] border border-[#E5E7EB] bg-[#FAFAFA] text-[13px] text-[#111827] placeholder-[#D1D5DB] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#111827]/8 focus:border-[#9CA3AF] transition-all duration-150"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 mt-1 rounded-[10px] bg-[#111827] text-[13px] font-semibold text-white hover:bg-[#1F2937] active:scale-[0.99] disabled:opacity-50 transition-all duration-150 flex items-center justify-center gap-2 shadow-[0_1px_3px_rgba(0,0,0,0.15),0_1px_2px_rgba(0,0,0,0.10)]"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          {/* Link */}
          <p className="mt-7 text-center text-[13px] text-[#9CA3AF]">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="font-medium text-[#111827] hover:underline underline-offset-2">
              Create one
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-[11px] text-[#D1D5DB] text-center">
          © {new Date().getFullYear()} AI Inbox. All rights reserved.
        </p>
      </div>

      {/* ── Right panel: decorative grid ─────────────────────────────── */}
      <AuthRightPanel />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58Z"
        fill="#EA4335"
      />
    </svg>
  );
}
