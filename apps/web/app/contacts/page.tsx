"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Users, Search, ChevronDown, Loader2, Mail, Phone } from "lucide-react";
import { contactsService, contactsQueryKeys } from "@/services/contacts/contacts.service";
import type { ContactRow } from "@/services/contacts/contacts.types";
import { LIFECYCLE_STAGES, getLifecycleStage } from "@/lib/lifecycle";
import { AvatarWithPlatformBadge } from "@/components/chat/AvatarWithPlatformBadge";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// ── Platform filter options ───────────────────────────────────────────────────

const PLATFORM_OPTIONS = [
  { value: "", label: "All Platforms" },
  { value: "telegram", label: "Telegram" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "teams", label: "Teams" },
];

// ── Small select dropdown ─────────────────────────────────────────────────────

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-3 pr-8 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
    </div>
  );
}

// ── Contact row display name helper ──────────────────────────────────────────

function displayName(row: ContactRow): string {
  return row.contact_name || row.contact_username || `Chat #${row.id}`;
}

// ── Page ──────────────────────────────────────────────────────────────────────

function ContactsPageContent() {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [platform, setPlatform] = useState("");
  const [lifecycle, setLifecycle] = useState("");

  // Debounce the search input (300 ms)
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(id);
  }, [search]);

  const filters = {
    platform: platform || undefined,
    lifecycle: lifecycle || undefined,
    search: debouncedSearch || undefined,
  };

  const {
    data: contacts = [],
    isLoading,
    isError,
    refetch,
  } = useQuery(contactsQueryKeys.list(filters));

  const handleRowClick = (row: ContactRow) => {
    sessionStorage.setItem("pendingConvId", String(row.id));
    router.push("/");
  };

  const lifecycleOptions = [
    { value: "", label: "All Stages" },
    ...LIFECYCLE_STAGES.map((s) => ({ value: s.value, label: `${s.emoji} ${s.label}` })),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">

        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Înapoi
          </button>

          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 shadow-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Contacts</h1>
                <p className="text-sm text-slate-500">
                  {isLoading
                    ? "Se încarcă…"
                    : `${contacts.length} contact${contacts.length !== 1 ? "e" : ""}`}
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Caută după nume, email…"
                  className="pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-56"
                />
              </div>

              <FilterSelect value={platform} onChange={setPlatform} options={PLATFORM_OPTIONS} />

              <FilterSelect value={lifecycle} onChange={setLifecycle} options={lifecycleOptions} />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-sm text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              Se încarcă contactele…
            </div>
          ) : isError ? (
            <div className="py-16 text-center">
              <p className="text-sm text-red-500">
                Nu s-au putut încărca contactele. Verifică conexiunea la server.
              </p>
              <button
                onClick={() => refetch()}
                className="mt-3 text-sm text-blue-600 hover:underline"
              >
                Încearcă din nou
              </button>
            </div>
          ) : contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
              <Users className="h-10 w-10 text-slate-200" />
              <p className="text-sm text-slate-400">
                {search || platform || lifecycle
                  ? "Niciun contact nu corespunde filtrelor selectate."
                  : "Niciun contact găsit. Începe o conversație pentru a vedea contactele."}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Nume
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Canal
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Lifecycle
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Telefon
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contacts.map((row) => {
                  const stage = getLifecycleStage(row.lifecycle_status);
                  return (
                    <tr
                      key={row.id}
                      onClick={() => handleRowClick(row)}
                      className="cursor-pointer transition-colors hover:bg-blue-50/40"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <AvatarWithPlatformBadge
                            name={displayName(row)}
                            avatar={row.contact_avatar}
                            platform={row.platform}
                            size="sm"
                          />
                          <span className="font-medium text-slate-800 truncate max-w-[160px]">
                            {displayName(row)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="capitalize text-xs text-slate-500">{row.platform}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-xs font-medium ${stage.badgeClass}`}
                        >
                          <span>{stage.emoji}</span>
                          <span>{stage.label}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {row.contact_email ? (
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span className="truncate max-w-[160px]">{row.contact_email}</span>
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {row.contact_phone ? (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span>{row.contact_phone}</span>
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {!isLoading && !isError && contacts.length > 0 && (
            <div className="border-t border-slate-100 bg-slate-50 px-5 py-2.5">
              <p className="text-xs text-slate-400">
                {contacts.length} contact{contacts.length !== 1 ? "e" : ""} afișate
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default function ContactsPage() {
  return (
    <ProtectedRoute>
      <ContactsPageContent />
    </ProtectedRoute>
  );
}
