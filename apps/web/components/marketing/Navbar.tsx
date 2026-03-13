"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import Image from 'next/image'


const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Product", href: "#product" },
  { label: "Download", href: "#download" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200/60 bg-white/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
            <Image
                src="/logo.svg"
                width={29}
                height={28}
                alt="Picture of the author"
            />
          <span className="text-[15px] font-semibold tracking-tight text-gray-900">
            AI Inbox
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-gray-500 transition-colors hover:text-gray-900"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/auth/login"
            className="text-[13px] font-medium text-gray-500 transition-colors hover:text-gray-900"
          >
            Log in
          </Link>
          <Link
            href="/auth/signup"
            className="inline-flex h-8 items-center rounded-lg bg-gray-900 px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-gray-800"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 md:hidden"
        >
          {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </nav>

      {/* Mobile panel */}
      {mobileOpen && (
        <div className="border-t border-gray-100 bg-white px-6 pb-5 pt-3 md:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2 text-[14px] font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
              >
                {l.label}
              </a>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-2 border-t border-gray-100 pt-4">
            <Link
              href="/auth/login"
              className="rounded-lg px-3 py-2 text-center text-[14px] font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              Log in
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-lg bg-gray-900 py-2.5 text-center text-[14px] font-medium text-white transition-colors hover:bg-gray-800"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
