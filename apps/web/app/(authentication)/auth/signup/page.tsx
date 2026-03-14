"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Mail, Lock, User, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { AuthRightPanel } from "@/components/auth/AuthRightPanel";

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();

  const [name, setName]             = useState("");
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [error, setError]           = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await signup({ name, email, password });
      router.replace("/inbox");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
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
              Create your account
            </h1>
            <p className="text-[14px] text-[#9CA3AF] mt-1.5 leading-relaxed">
              Get started — it&apos;s free to try
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-[13px] text-red-600 flex items-center gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Full name */}
            <div>
              <label htmlFor="name" className="block text-[12.5px] font-medium text-[#374151] mb-1.5 tracking-tight">
                Full name
              </label>
              <div className="relative">
                <User
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-[#D1D5DB] pointer-events-none"
                  strokeWidth={1.75}
                />
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 pl-[42px] pr-3.5 rounded-[10px] border border-[#E5E7EB] bg-[#FAFAFA] text-[13px] text-[#111827] placeholder-[#D1D5DB] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#111827]/8 focus:border-[#9CA3AF] transition-all duration-150"
                  placeholder="Jane Doe"
                />
              </div>
            </div>

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
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 pl-[42px] pr-3.5 rounded-[10px] border border-[#E5E7EB] bg-[#FAFAFA] text-[13px] text-[#111827] placeholder-[#D1D5DB] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#111827]/8 focus:border-[#9CA3AF] transition-all duration-150"
                  placeholder="••••••••"
                />
              </div>
              <p className="mt-1.5 text-[11.5px] text-[#C4C0BA]">
                Minimum 8 characters recommended
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 mt-1 rounded-[10px] bg-[#111827] text-[13px] font-semibold text-white hover:bg-[#1F2937] active:scale-[0.99] disabled:opacity-50 transition-all duration-150 flex items-center justify-center gap-2 shadow-[0_1px_3px_rgba(0,0,0,0.15),0_1px_2px_rgba(0,0,0,0.10)]"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? "Creating account…" : "Create account"}
            </button>
          </form>

          {/* Terms */}
          <p className="mt-4 text-[11.5px] text-[#C4C0BA] text-center leading-relaxed">
            By creating an account you agree to our{" "}
            <span className="text-[#9CA3AF] underline underline-offset-2 cursor-pointer hover:text-[#6B7280] transition-colors">
              Terms
            </span>{" "}
            and{" "}
            <span className="text-[#9CA3AF] underline underline-offset-2 cursor-pointer hover:text-[#6B7280] transition-colors">
              Privacy Policy
            </span>
            .
          </p>

          {/* Link */}
          <p className="mt-5 text-center text-[13px] text-[#9CA3AF]">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-medium text-[#111827] hover:underline underline-offset-2">
              Sign in
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
