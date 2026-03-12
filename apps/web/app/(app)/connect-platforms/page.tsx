"use client";

import { type FormEvent, useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Loader2, Copy, Check, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getToken } from "@/services/auth/auth-service";
import { platformsService } from "@/services/platforms/platforms.service";
import type { PlatformAccount } from "@/services/platforms/platforms.types";

// ── Style tokens ─────────────────────────────────────────────────────────────

/** Card shell — warm border, barely-there shadow */
const CARD = "rounded-2xl border border-[#E7E3DC] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]";

/** Icon container — neutral, consistent across every surface */
const ICON_BOX =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F3F4F6]";

/** Form input — off-white resting state, white focused, premium ring */
const INPUT =
  "w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-[13px] text-[#111827] placeholder-[#9CA3AF]" +
  " focus:outline-none focus:ring-2 focus:ring-[#111827]/8 focus:border-[#9CA3AF] focus:bg-white" +
  " transition-all duration-150 ease-out leading-snug";

/** Standard field label */
const LABEL = "block text-[13px] font-medium text-[#374151]";

/** Primary CTA — dark, confident */
const PRIMARY_BTN =
  "w-full inline-flex items-center justify-center gap-2 rounded-[10px] bg-[#111827] py-3 text-[13px] font-semibold text-white" +
  " hover:bg-[#1a2232] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40" +
  " transition-all duration-150 ease-out shadow-[0_1px_3px_rgba(0,0,0,0.14)]";

/** Section label — spaced caps */
const SECTION_LABEL = "text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]";

// ── Platform config ─────────────────────────────────────────────────────────

type PlatformStatus = "available" | "coming-soon";

interface PlatformConfig {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  status: PlatformStatus;
  accentColor: string;
}

const PLATFORMS: PlatformConfig[] = [
  {
    id: "telegram",
    label: "Telegram",
    description: "Conectează-ți botul de suport sau vânzări.",
    icon: <TelegramIcon />,
    status: "available",
    accentColor: "text-sky-500",
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    description: "Conectează contul tău WhatsApp Business.",
    icon: <WhatsAppIcon />,
    status: "available",
    accentColor: "text-green-500",
  },
  {
    id: "email",
    label: "Email (IMAP/SMTP)",
    description: "Conectează Gmail sau Outlook cu parola de aplicație.",
    icon: <EmailIcon />,
    status: "available",
    accentColor: "text-orange-500",
  },
  {
    id: "teams",
    label: "Microsoft Teams",
    description: "Integrează cu Microsoft Teams pentru echipa ta.",
    icon: <TeamsIcon />,
    status: "coming-soon",
    accentColor: "text-indigo-500",
  },
];

// ── Step indicator (pure display) ─────────────────────────────────────────────

type StepState = "active" | "completed" | "upcoming";

function StepItem({
  number,
  label,
  state,
}: {
  number: number;
  label: string;
  state: StepState;
}) {
  return (
    <div className="flex items-center gap-2.5">
      {/* Circle */}
      <span
        className={[
          "h-6 w-6 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold transition-all duration-200",
          state === "active" ? "bg-[#111827] text-white" : "",
          state === "completed" ? "bg-[#ECFDF5] text-[#047857]" : "",
          state === "upcoming" ? "bg-[#F3F4F6] text-[#9CA3AF]" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {state === "completed" ? <Check className="h-3 w-3" /> : number}
      </span>

      {/* Label */}
      <span
        className={[
          "text-[13px] transition-colors duration-200",
          state === "active" ? "font-semibold text-[#111827]" : "",
          state === "completed" ? "font-medium text-[#047857]" : "",
          state === "upcoming" ? "text-[#9CA3AF]" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {label}
      </span>
    </div>
  );
}

// ── Inner page (reads search params) ─────────────────────────────────────────

function ConnectPlatformsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isManaging = searchParams.get("manage") === "1";
  const { isLoading: isAuthLoading } = useAuth();

  const [isCheckingPlatforms, setIsCheckingPlatforms] = useState(true);
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Telegram fields
  const [tgBotToken, setTgBotToken] = useState("");

  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const platformsChecked = useRef(false);

  // Auth guard
  useEffect(() => {
    if (isAuthLoading) return;
    if (!getToken()) router.replace("/auth/login");
  }, [isAuthLoading, router]);

  // Fetch connected accounts
  useEffect(() => {
    if (isAuthLoading || platformsChecked.current) return;
    const token = getToken();
    if (!token) return;

    platformsChecked.current = true;

    platformsService
      .getAccounts()
      .then(({ total, accounts }) => {
        const ids = new Set(accounts.map((a: PlatformAccount) => a.platform));
        setConnectedIds(ids);

        if (!isManaging && total > 0) {
          router.replace("/");
        } else {
          setIsCheckingPlatforms(false);
        }
      })
      .catch(() => setIsCheckingPlatforms(false));
  }, [isAuthLoading, isManaging, router]);

  // WhatsApp fields
  const [waAccessToken, setWaAccessToken] = useState("");
  const [waPhoneNumberId, setWaPhoneNumberId] = useState("");

  // Email fields
  const [emEmail, setEmEmail] = useState("");
  const [emPassword, setEmPassword] = useState("");
  const [emProvider, setEmProvider] = useState<"gmail" | "outlook" | "custom">("gmail");
  const [emShowAdvanced, setEmShowAdvanced] = useState(false);
  const [emImapHost, setEmImapHost] = useState("");
  const [emImapPort, setEmImapPort] = useState("993");
  const [emImapSecure, setEmImapSecure] = useState(true);
  const [emSmtpHost, setEmSmtpHost] = useState("");
  const [emSmtpPort, setEmSmtpPort] = useState("587");
  const [emSmtpSecure, setEmSmtpSecure] = useState(false);

  const handleCardClick = (platform: PlatformConfig) => {
    if (platform.status !== "available") return;
    if (connectedIds.has(platform.id)) return;
    setSelectedId(platform.id);
    setConnectError(null);
    setTgBotToken("");
    setWaAccessToken("");
    setWaPhoneNumberId("");
    setEmEmail("");
    setEmPassword("");
    setEmProvider("gmail");
    setEmShowAdvanced(false);
    setEmImapHost("");
    setEmImapPort("993");
    setEmImapSecure(true);
    setEmSmtpHost("");
    setEmSmtpPort("587");
    setEmSmtpSecure(false);
  };

  // ── WhatsApp connect ──────────────────────────────────────────────────────

  const handleWhatsappSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setConnectError(null);
    setIsConnecting(true);
    try {
      await platformsService.connectWhatsapp(waAccessToken.trim(), waPhoneNumberId.trim());
      setToast("WhatsApp conectat cu succes.");
      setConnectedIds((prev) => new Set(prev).add("whatsapp"));
      setSelectedId(null);
      if (!isManaging) setTimeout(() => router.replace("/"), 1500);
      else setTimeout(() => setToast(null), 2000);
    } catch (err) {
      setConnectError(err instanceof Error ? err.message : "A apărut o eroare.");
    } finally {
      setIsConnecting(false);
    }
  };

  // ── Telegram connect ──────────────────────────────────────────────────────

  const handleTelegramSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setConnectError(null);
    setIsConnecting(true);
    try {
      await platformsService.connectTelegram(tgBotToken.trim());
      setToast("Telegram conectat cu succes.");
      setConnectedIds((prev) => new Set(prev).add("telegram"));
      setSelectedId(null);
      if (!isManaging) setTimeout(() => router.replace("/"), 1500);
      else setTimeout(() => setToast(null), 2000);
    } catch (err) {
      setConnectError(err instanceof Error ? err.message : "A apărut o eroare.");
    } finally {
      setIsConnecting(false);
    }
  };

  // ── Email connect ─────────────────────────────────────────────────────────

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setConnectError(null);
    setIsConnecting(true);
    try {
      const payload: Parameters<typeof platformsService.connectEmail>[0] = {
        email: emEmail.trim(),
        password: emPassword,
        provider: emProvider,
      };

      if (emProvider === "custom" || emShowAdvanced) {
        if (emImapHost.trim()) {
          payload.imapOverride = {
            host: emImapHost.trim(),
            port: parseInt(emImapPort, 10) || 993,
            secure: emImapSecure,
          };
        }
        if (emSmtpHost.trim()) {
          payload.smtpOverride = {
            host: emSmtpHost.trim(),
            port: parseInt(emSmtpPort, 10) || 587,
            secure: emSmtpSecure,
          };
        }
      }

      await platformsService.connectEmail(payload);
      setToast("Email conectat cu succes.");
      setConnectedIds((prev) => new Set(prev).add("email"));
      setSelectedId(null);
      if (!isManaging) setTimeout(() => router.replace("/"), 1500);
      else setTimeout(() => setToast(null), 2000);
    } catch (err) {
      setConnectError(err instanceof Error ? err.message : "A apărut o eroare.");
    } finally {
      setIsConnecting(false);
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────

  const currentStep = selectedId ? 2 : 1;

  if (isAuthLoading || isCheckingPlatforms) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-[#9CA3AF]" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden rounded-xl bg-white shadow-[var(--shadow-card)] border border-[var(--border-default)]">
      {/* ── Toast ── */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 rounded-2xl bg-[#047857] px-4 py-3 text-[13px] font-medium text-white shadow-[0_8px_24px_rgba(4,120,87,0.25)]">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {toast}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[980px] mx-auto px-8 py-8">

          {/* ── Page header ──────────────────────────────────────────── */}
          <div className="mb-7">
            <h1 className="text-[20px] font-semibold text-[#111827] tracking-tight leading-none">
              {isManaging ? "Gestionează platformele" : "Conectează-ți prima platformă"}
            </h1>
            <p className="mt-1.5 text-[13px] text-[#6B7280] leading-relaxed">
              {isManaging
                ? "Adaugă sau gestionează canalele de comunicare conectate."
                : "Alege canalul de comunicare pe care vrei să-l gestionezi."}
            </p>
          </div>

          {/* ── Step flow ────────────────────────────────────────────── */}
          <div className="mb-8 flex items-center gap-3">
            <StepItem
              number={1}
              label="Alege platforma"
              state={currentStep > 1 ? "completed" : "active"}
            />

            {/* Connector */}
            <div className="w-8 h-px bg-[#E5E7EB]" />

            <StepItem
              number={2}
              label="Conectează"
              state={currentStep === 2 ? "active" : "upcoming"}
            />

            {/* Connector */}
            <div className="w-8 h-px bg-[#E5E7EB]" />

            <StepItem number={3} label="Configurează" state="upcoming" />
          </div>

          {/* ── Two-column layout ─────────────────────────────────────── */}
          <div className="flex flex-col gap-10 lg:flex-row lg:items-start">

            {/* ── LEFT: Platform cards ──────────────────────────────── */}
            <div className="flex-1 min-w-0 space-y-3">
              <p className={SECTION_LABEL}>Platforme disponibile</p>

              {/* Available platforms — 2-column grid */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {PLATFORMS.filter((p) => p.status === "available").map((platform) => (
                  <PlatformCard
                    key={platform.id}
                    platform={platform}
                    isSelected={selectedId === platform.id}
                    isConnected={connectedIds.has(platform.id)}
                    onClick={() => handleCardClick(platform)}
                  />
                ))}
              </div>

              {/* Coming soon — full-width horizontal strip */}
              {PLATFORMS.filter((p) => p.status === "coming-soon").length > 0 && (
                <div className="pt-1 space-y-2">
                  <p className={SECTION_LABEL}>Em curând</p>
                  <div className="space-y-3">
                    {PLATFORMS.filter((p) => p.status === "coming-soon").map((platform) => (
                      <ComingSoonCard key={platform.id} platform={platform} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── RIGHT: Configuration panel ────────────────────────── */}
            <div className="w-full lg:w-[420px] lg:shrink-0 space-y-3">
              <p className={SECTION_LABEL}>Configurare integrare</p>

              {selectedId === "telegram" && (
                <TelegramForm
                  botToken={tgBotToken}
                  onBotTokenChange={setTgBotToken}
                  isConnecting={isConnecting}
                  error={connectError}
                  onSubmit={handleTelegramSubmit}
                />
              )}

              {selectedId === "whatsapp" && (
                <WhatsappForm
                  accessToken={waAccessToken}
                  phoneNumberId={waPhoneNumberId}
                  onAccessTokenChange={setWaAccessToken}
                  onPhoneNumberIdChange={setWaPhoneNumberId}
                  isConnecting={isConnecting}
                  error={connectError}
                  onSubmit={handleWhatsappSubmit}
                />
              )}

              {selectedId === "email" && (
                <EmailForm
                  email={emEmail}
                  password={emPassword}
                  provider={emProvider}
                  showAdvanced={emShowAdvanced}
                  imapHost={emImapHost}
                  imapPort={emImapPort}
                  imapSecure={emImapSecure}
                  smtpHost={emSmtpHost}
                  smtpPort={emSmtpPort}
                  smtpSecure={emSmtpSecure}
                  onEmailChange={setEmEmail}
                  onPasswordChange={setEmPassword}
                  onProviderChange={setEmProvider}
                  onShowAdvancedChange={setEmShowAdvanced}
                  onImapHostChange={setEmImapHost}
                  onImapPortChange={setEmImapPort}
                  onImapSecureChange={setEmImapSecure}
                  onSmtpHostChange={setEmSmtpHost}
                  onSmtpPortChange={setEmSmtpPort}
                  onSmtpSecureChange={setEmSmtpSecure}
                  isConnecting={isConnecting}
                  error={connectError}
                  onSubmit={handleEmailSubmit}
                />
              )}

              {!selectedId && <EmptyConfigPanel />}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page wrapper ──────────────────────────────────────────────────────────────

export default function ConnectPlatformsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-[#9CA3AF]" />
        </div>
      }
    >
      <ConnectPlatformsContent />
    </Suspense>
  );
}

// ── PlatformCard ─────────────────────────────────────────────────────────────

function PlatformCard({
  platform,
  isSelected,
  isConnected,
  onClick,
}: {
  platform: PlatformConfig;
  isSelected: boolean;
  isConnected: boolean;
  onClick: () => void;
}) {
  const clickable = platform.status === "available" && !isConnected;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!clickable}
      className={[
        // Base
        "group relative w-full rounded-2xl border p-6 text-left transition-all duration-200 ease-out overflow-hidden",

        // Resting — warm border, very subtle shadow
        "border-[#E7E3DC] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]",

        // Clickable hover — lift + warmer border
        clickable && !isSelected
          ? "cursor-pointer hover:border-[#CEC9C1] hover:bg-[#FAFAF9] hover:shadow-[0_4px_12px_rgba(0,0,0,0.07)]"
          : "",

        // Selected — elevated, confident
        isSelected
          ? "border-[#111827]/18 bg-[#FAFAFA] shadow-[0_4px_14px_rgba(0,0,0,0.09)] cursor-default"
          : "",

        // Connected — success tint, non-interactive
        isConnected && !isSelected
          ? "cursor-default border-[#D1FAE5] bg-[#F0FDF4]/60"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* ── Selection accent — top edge bar ── */}
      {isSelected && (
        <div className="absolute inset-x-0 top-0 h-[3px] rounded-t-2xl bg-[#111827]" />
      )}

      {/* ── Status badges ── */}
      {isConnected ? (
        <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-[#ECFDF5] border border-[#D1FAE5] px-2.5 py-1 text-[11px] font-semibold text-[#047857]">
          <CheckCircle2 className="h-3 w-3" />
          Conectat
        </span>
      ) : null}

      {/* ── Icon ── */}
      <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#F3F4F6] transition-colors duration-200 group-hover:bg-[#EDEDEB]">
        <span className={platform.accentColor}>{platform.icon}</span>
      </div>

      {/* ── Content ── */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[14px] font-semibold text-[#111827] leading-tight">
            {platform.label}
          </p>
          <p className="mt-2 text-[13px] text-[#6B7280] leading-relaxed">
            {platform.description}
          </p>
        </div>

        {/* Arrow — appears on hover for clickable cards */}
        {clickable && (
          <ArrowRight
            className={[
              "h-4 w-4 shrink-0 mt-0.5 transition-all duration-200",
              isSelected
                ? "text-[#111827] opacity-60"
                : "text-[#D1D5DB] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5",
            ].join(" ")}
          />
        )}
      </div>
    </button>
  );
}

// ── Coming soon strip card ─────────────────────────────────────────────────────

function ComingSoonCard({ platform }: { platform: PlatformConfig }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-[#E7E3DC] bg-[#FAFAF9] px-5 py-4 opacity-60">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F3F4F6]">
        <span className={platform.accentColor}>{platform.icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-[#111827]">{platform.label}</p>
        <p className="mt-0.5 text-[12px] text-[#9CA3AF]">{platform.description}</p>
      </div>
      <span className="shrink-0 rounded-full bg-[#F3F4F6] border border-[#E5E7EB] px-2.5 py-1 text-[11px] font-semibold text-[#9CA3AF]">
        Em curând
      </span>
    </div>
  );
}

// ── Empty config panel ────────────────────────────────────────────────────────

function EmptyConfigPanel() {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#E5E7EB] bg-[#FAFAFA] px-8 py-12 text-center">
      {/* Platform icon trio */}
      <div className="mb-6 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F3F4F6] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <span className="text-sky-400"><TelegramIcon /></span>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F3F4F6] shadow-[0_2px_6px_rgba(0,0,0,0.08)] ring-2 ring-white">
          <span className="text-green-400"><WhatsAppIcon /></span>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F3F4F6] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <span className="text-indigo-400"><TeamsIcon /></span>
        </div>
      </div>

      <p className="text-[14px] font-semibold text-[#374151] leading-tight">
        Nicio platformă selectată
      </p>
      <p className="mt-2 max-w-[220px] text-[13px] text-[#9CA3AF] leading-relaxed">
        Alege Telegram, WhatsApp sau Email din stânga pentru a începe configurarea.
      </p>
    </div>
  );
}

// ── Telegram connect form ─────────────────────────────────────────────────────

function TelegramForm({
  botToken,
  onBotTokenChange,
  isConnecting,
  error,
  onSubmit,
}: {
  botToken: string;
  onBotTokenChange: (v: string) => void;
  isConnecting: boolean;
  error: string | null;
  onSubmit: (e: FormEvent) => void;
}) {
  return (
    <div className={`${CARD} p-6`}>
      {/* Header */}
      <div className="flex items-start gap-4 pb-5 border-b border-[#F3F4F6]">
        <div className={ICON_BOX}>
          <span className="text-sky-500">
            <TelegramIcon />
          </span>
        </div>
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-[#111827] leading-tight">
            Conectează Telegram
          </h2>
          <p className="mt-1 text-[13px] text-[#6B7280] leading-relaxed">
            Introdu token-ul botului tău Telegram
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="mt-5 space-y-5">
        <div className="space-y-2">
          <label htmlFor="tg-bot-token" className={LABEL}>
            Bot Token
          </label>
          <input
            id="tg-bot-token"
            type="password"
            value={botToken}
            onChange={(e) => onBotTokenChange(e.target.value)}
            placeholder="1234567890:ABCDefgh..."
            required
            autoFocus
            className={INPUT}
          />
          <p className="text-[12px] text-[#9CA3AF] leading-relaxed">
            Obține token-ul de la{" "}
            <span className="font-semibold text-[#6B7280]">@BotFather</span> cu comanda{" "}
            <code className="rounded-md bg-[#F3F4F6] px-1.5 py-0.5 text-[11px] font-mono text-[#374151]">
              /newbot
            </code>
            .
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200/60 bg-red-50/60 px-4 py-3 text-[13px] text-red-600">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="pt-1">
          <button
            type="submit"
            disabled={isConnecting || !botToken.trim()}
            className={PRIMARY_BTN}
          >
            {isConnecting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isConnecting ? "Se conectează…" : "Conectează Telegram"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── WhatsApp connect form ─────────────────────────────────────────────────────

const WHATSAPP_VERIFY_TOKEN =
  process.env.NEXT_PUBLIC_WHATSAPP_VERIFY_TOKEN ?? "zottis_verify_token";
const WHATSAPP_WEBHOOK_URL =
  process.env.NEXT_PUBLIC_WHATSAPP_WEBHOOK_URL ??
  `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/webhooks/whatsapp`;

// ── Copy field ────────────────────────────────────────────────────────────────

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-1.5">
      <p className="text-[12px] font-semibold text-[#9CA3AF] uppercase tracking-[0.06em]">
        {label}
      </p>
      <div className="flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3.5 py-2.5">
        <code className="flex-1 min-w-0 truncate text-[12px] font-mono text-[#374151] leading-snug">
          {value}
        </code>
        <button
          type="button"
          onClick={copy}
          className={[
            "shrink-0 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-all duration-150 ease-out",
            copied
              ? "bg-[#ECFDF5] text-[#047857]"
              : "text-[#9CA3AF] hover:text-[#374151] hover:bg-white hover:shadow-[0_1px_3px_rgba(0,0,0,0.08)]",
          ].join(" ")}
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" />
              Copiat
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copiază
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ── WhatsApp form ─────────────────────────────────────────────────────────────

function WhatsappForm({
  accessToken,
  phoneNumberId,
  onAccessTokenChange,
  onPhoneNumberIdChange,
  isConnecting,
  error,
  onSubmit,
}: {
  accessToken: string;
  phoneNumberId: string;
  onAccessTokenChange: (v: string) => void;
  onPhoneNumberIdChange: (v: string) => void;
  isConnecting: boolean;
  error: string | null;
  onSubmit: (e: FormEvent) => void;
}) {
  return (
    <div className="space-y-4">
      {/* ── Credentials card ── */}
      <div className={`${CARD} p-6`}>
        {/* Header */}
        <div className="flex items-start gap-4 pb-5 border-b border-[#F3F4F6]">
          <div className={ICON_BOX}>
            <span className="text-green-500">
              <WhatsAppIcon />
            </span>
          </div>
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold text-[#111827] leading-tight">
              Conectează WhatsApp
            </h2>
            <p className="mt-1 text-[13px] text-[#6B7280] leading-relaxed">
              WhatsApp Business Cloud API
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div className="space-y-2">
            <label htmlFor="wa-token" className={LABEL}>
              Access Token
            </label>
            <input
              id="wa-token"
              type="password"
              value={accessToken}
              onChange={(e) => onAccessTokenChange(e.target.value)}
              placeholder="EAAUlx…"
              required
              autoFocus
              className={INPUT}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="wa-phone-id" className={LABEL}>
              Phone Number ID
            </label>
            <input
              id="wa-phone-id"
              type="text"
              value={phoneNumberId}
              onChange={(e) => onPhoneNumberIdChange(e.target.value)}
              placeholder="102391771747…"
              required
              className={INPUT}
            />
          </div>

          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200/60 bg-red-50/60 px-4 py-3 text-[13px] text-red-600">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="pt-1">
            <button
              type="submit"
              disabled={isConnecting || !accessToken.trim() || !phoneNumberId.trim()}
              className={PRIMARY_BTN}
            >
              {isConnecting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isConnecting ? "Se conectează…" : "Conectează WhatsApp"}
            </button>
          </div>
        </form>
      </div>

      {/* ── Webhook configuration card ── */}
      <div className={`${CARD} p-6`}>
        {/* Header */}
        <div className="mb-5">
          <p className="text-[13px] font-semibold text-[#111827]">Configurare Webhook</p>
          <p className="mt-0.5 text-[12px] text-[#9CA3AF] leading-relaxed">
            Configurează webhook-ul în Meta Developer Portal.
          </p>
        </div>

        {/* Copy fields */}
        <div className="space-y-4">
          <CopyField label="Callback URL" value={WHATSAPP_WEBHOOK_URL} />
          <CopyField label="Verify Token" value={WHATSAPP_VERIFY_TOKEN} />
        </div>

        {/* Instructions */}
        <div className="mt-5 rounded-xl bg-[#F9FAFB] border border-[#F3F4F6] px-4 py-3.5">
          <p className="text-[12px] font-semibold text-[#374151] mb-2">Pași de urmat</p>
          <ol className="space-y-1.5 text-[12px] text-[#6B7280] leading-relaxed">
            <li className="flex gap-2">
              <span className="shrink-0 font-semibold text-[#9CA3AF]">1.</span>
              <span>
                Meta Developer Portal → WhatsApp → Configuration → Webhook →{" "}
                <span className="font-semibold text-[#374151]">Edit</span>
              </span>
            </li>
            <li className="flex gap-2">
              <span className="shrink-0 font-semibold text-[#9CA3AF]">2.</span>
              <span>Lipește URL-ul și token-ul de mai sus, apasă{" "}
                <span className="font-semibold text-[#374151]">Verify and Save</span>
              </span>
            </li>
            <li className="flex gap-2">
              <span className="shrink-0 font-semibold text-[#9CA3AF]">3.</span>
              <span>
                Abonează-te la evenimentul{" "}
                <code className="rounded bg-white border border-[#E5E7EB] px-1.5 py-0.5 font-mono text-[11px] text-[#374151]">
                  messages
                </code>
              </span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}

// ── Email connect form ────────────────────────────────────────────────────────

const EMAIL_PROVIDERS = [
  { value: "gmail", label: "Gmail" },
  { value: "outlook", label: "Outlook / Microsoft 365" },
  { value: "custom", label: "Custom (IMAP/SMTP)" },
] as const;

function EmailForm({
  email,
  password,
  provider,
  showAdvanced,
  imapHost,
  imapPort,
  imapSecure,
  smtpHost,
  smtpPort,
  smtpSecure,
  onEmailChange,
  onPasswordChange,
  onProviderChange,
  onShowAdvancedChange,
  onImapHostChange,
  onImapPortChange,
  onImapSecureChange,
  onSmtpHostChange,
  onSmtpPortChange,
  onSmtpSecureChange,
  isConnecting,
  error,
  onSubmit,
}: {
  email: string;
  password: string;
  provider: "gmail" | "outlook" | "custom";
  showAdvanced: boolean;
  imapHost: string;
  imapPort: string;
  imapSecure: boolean;
  smtpHost: string;
  smtpPort: string;
  smtpSecure: boolean;
  onEmailChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onProviderChange: (v: "gmail" | "outlook" | "custom") => void;
  onShowAdvancedChange: (v: boolean) => void;
  onImapHostChange: (v: string) => void;
  onImapPortChange: (v: string) => void;
  onImapSecureChange: (v: boolean) => void;
  onSmtpHostChange: (v: string) => void;
  onSmtpPortChange: (v: string) => void;
  onSmtpSecureChange: (v: boolean) => void;
  isConnecting: boolean;
  error: string | null;
  onSubmit: (e: FormEvent) => void;
}) {
  const isCustom = provider === "custom";
  const showAdvancedSection = showAdvanced || isCustom;

  return (
    <div className={`${CARD} p-6`}>
      {/* Header */}
      <div className="flex items-start gap-4 pb-5 border-b border-[#F3F4F6]">
        <div className={ICON_BOX}>
          <span className="text-orange-500">
            <EmailIcon />
          </span>
        </div>
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-[#111827] leading-tight">
            Conectează Email
          </h2>
          <p className="mt-1 text-[13px] text-[#6B7280] leading-relaxed">
            IMAP + SMTP cu parolă de aplicație
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="mt-5 space-y-5">

        {/* Provider */}
        <div className="space-y-2">
          <label htmlFor="em-provider" className={LABEL}>
            Provider
          </label>
          <select
            id="em-provider"
            value={provider}
            onChange={(e) => onProviderChange(e.target.value as "gmail" | "outlook" | "custom")}
            className={INPUT}
          >
            {EMAIL_PROVIDERS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label htmlFor="em-email" className={LABEL}>
            Adresă email
          </label>
          <input
            id="em-email"
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="you@gmail.com"
            required
            autoFocus
            className={INPUT}
          />
        </div>

        {/* Password */}
        <div className="space-y-2">
          <label htmlFor="em-password" className={LABEL}>
            {provider === "gmail" ? "Parolă de aplicație" : provider === "outlook" ? "Parolă cont / aplicație" : "Parolă"}
          </label>
          <input
            id="em-password"
            type="password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder="••••••••••••••••"
            required
            className={INPUT}
          />
          {provider === "gmail" && (
            <p className="text-[12px] text-[#9CA3AF] leading-relaxed">
              Generează o parolă de aplicație în{" "}
              <span className="font-semibold text-[#6B7280]">Google Account → Security → App passwords</span>.
            </p>
          )}
          {provider === "outlook" && (
            <p className="text-[12px] text-[#9CA3AF] leading-relaxed">
              Activează IMAP în setările Outlook și folosește parola contului.
            </p>
          )}
        </div>

        {/* Advanced toggle (only for gmail/outlook; always shown for custom) */}
        {!isCustom && (
          <button
            type="button"
            onClick={() => onShowAdvancedChange(!showAdvanced)}
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#6B7280] hover:text-[#111827] transition-colors duration-150"
          >
            {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            Setări avansate IMAP/SMTP
          </button>
        )}

        {/* Advanced section */}
        {showAdvancedSection && (
          <div className="space-y-4 rounded-xl border border-[#F3F4F6] bg-[#FAFAFA] px-4 py-4">
            <p className="text-[12px] font-semibold text-[#374151]">IMAP</p>
            <div className="grid grid-cols-[1fr_80px_auto] gap-2 items-end">
              <div className="space-y-1.5">
                <label className={LABEL}>Host</label>
                <input
                  type="text"
                  value={imapHost}
                  onChange={(e) => onImapHostChange(e.target.value)}
                  placeholder="imap.example.com"
                  className={INPUT}
                />
              </div>
              <div className="space-y-1.5">
                <label className={LABEL}>Port</label>
                <input
                  type="number"
                  value={imapPort}
                  onChange={(e) => onImapPortChange(e.target.value)}
                  placeholder="993"
                  className={INPUT}
                />
              </div>
              <div className="space-y-1.5">
                <label className={LABEL}>SSL</label>
                <div className="flex items-center h-[42px]">
                  <input
                    type="checkbox"
                    id="imap-secure"
                    checked={imapSecure}
                    onChange={(e) => onImapSecureChange(e.target.checked)}
                    className="h-4 w-4 rounded border-[#E5E7EB] text-[#111827] cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <p className="text-[12px] font-semibold text-[#374151] pt-1">SMTP</p>
            <div className="grid grid-cols-[1fr_80px_auto] gap-2 items-end">
              <div className="space-y-1.5">
                <label className={LABEL}>Host</label>
                <input
                  type="text"
                  value={smtpHost}
                  onChange={(e) => onSmtpHostChange(e.target.value)}
                  placeholder="smtp.example.com"
                  className={INPUT}
                />
              </div>
              <div className="space-y-1.5">
                <label className={LABEL}>Port</label>
                <input
                  type="number"
                  value={smtpPort}
                  onChange={(e) => onSmtpPortChange(e.target.value)}
                  placeholder="587"
                  className={INPUT}
                />
              </div>
              <div className="space-y-1.5">
                <label className={LABEL}>SSL</label>
                <div className="flex items-center h-[42px]">
                  <input
                    type="checkbox"
                    id="smtp-secure"
                    checked={smtpSecure}
                    onChange={(e) => onSmtpSecureChange(e.target.checked)}
                    className="h-4 w-4 rounded border-[#E5E7EB] text-[#111827] cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200/60 bg-red-50/60 px-4 py-3 text-[13px] text-red-600">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="pt-1">
          <button
            type="submit"
            disabled={isConnecting || !email.trim() || !password.trim()}
            className={PRIMARY_BTN}
          >
            {isConnecting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isConnecting ? "Se conectează…" : "Conectează Email"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Brand icons ───────────────────────────────────────────────────────────────

function TelegramIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}

function TeamsIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M20.625 7.875a2.625 2.625 0 1 0 0-5.25 2.625 2.625 0 0 0 0 5.25zM14.25 8.625a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm5.16 1.313a4.5 4.5 0 0 1 .84 2.594V17.25a.75.75 0 0 1-.75.75H17.25a.75.75 0 0 1-.75-.75v-4.313c0-1.173-.418-2.25-1.109-3.079A4.494 4.494 0 0 1 18.75 9a4.466 4.466 0 0 1 .66.938zM9 9.375a4.875 4.875 0 0 1 4.875 4.875v4.5a.75.75 0 0 1-.75.75h-8.25a.75.75 0 0 1-.75-.75v-4.5A4.875 4.875 0 0 1 9 9.375z" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M1.5 8.067v7.433A3 3 0 0 0 4.5 18.5h15a3 3 0 0 0 3-3V8.067l-8.928 5.493a3 3 0 0 1-3.144 0L1.5 8.067z" />
      <path d="M22.5 6.908V6.75a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3v.158l9.714 5.978a1.5 1.5 0 0 0 1.572 0L22.5 6.908z" />
    </svg>
  );
}
