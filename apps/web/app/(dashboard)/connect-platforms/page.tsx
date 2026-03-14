"use client";

import { type FormEvent, useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Copy,
  Check,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getToken } from "@/services/auth/auth-service";
import { platformsService } from "@/services/platforms/platforms.service";
import type { PlatformAccount } from "@/services/platforms/platforms.types";

// ── Design tokens — mirrors ConfigurationTab / rest of the app ───────────────
// All values use CSS variables so light / dark / system themes work automatically.
// No hardcoded hex colours below this line.

/** Card surface — same family as AI-Assistant / Contacts cards */
const CARD =
  "rounded-2xl border border-[var(--border-warm)] bg-[var(--bg-surface)] shadow-[var(--shadow-card)]";

/** Icon container — same as ConfigurationTab icon boxes */
const ICON_BOX =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--bg-surface-hover)]";

/** Text input / select — theme-aware */
const INPUT =
  "w-full rounded-[var(--radius-input)] border border-[var(--border-default)] bg-[var(--bg-page)]" +
  " px-4 py-2.5 text-[13px] text-[var(--text-primary)] placeholder-[var(--text-tertiary)]" +
  " focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/10 focus:border-[var(--text-secondary)]" +
  " transition-all duration-150 ease-out leading-snug";

/** Field label */
const LABEL = "block text-[13px] font-medium text-[var(--text-secondary)]";

/** Primary CTA — uses accent-primary from the theme system */
const PRIMARY_BTN =
  "w-full inline-flex items-center justify-center gap-2 rounded-[var(--radius-button)]" +
  " bg-[var(--accent-primary)] py-2.5 text-[13px] font-medium text-white" +
  " hover:bg-[var(--accent-primary-hover)] active:scale-[0.98]" +
  " disabled:cursor-not-allowed disabled:opacity-40" +
  " transition-all duration-150 ease-out shadow-[var(--shadow-xs)]";

/** Small uppercase section label */
const SECTION_LABEL =
  "text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]";

// ── Platform config ───────────────────────────────────────────────────────────

type PlatformStatus = "available" | "coming-soon";

interface PlatformConfig {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  status: PlatformStatus;
  iconClass: string;
}

const PLATFORMS: PlatformConfig[] = [
  {
    id: "telegram",
    label: "Telegram",
    description: "Conectează-ți botul de suport sau vânzări.",
    icon: <TelegramIcon />,
    status: "available",
    iconClass: "text-sky-500 dark:text-sky-400",
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    description: "Conectează contul tău WhatsApp Business.",
    icon: <WhatsAppIcon />,
    status: "available",
    iconClass: "text-emerald-600 dark:text-emerald-400",
  },
  {
    id: "email",
    label: "Email (IMAP/SMTP)",
    description: "Conectează Gmail sau Outlook cu parola de aplicație.",
    icon: <EmailIcon />,
    status: "available",
    iconClass: "text-orange-500 dark:text-orange-400",
  },
];

// ── Step indicator ────────────────────────────────────────────────────────────

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
      <span
        className={[
          "h-6 w-6 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold transition-all duration-200",
          state === "active"
            ? "bg-[var(--accent-primary)] text-white"
            : "",
          state === "completed"
            ? "bg-emerald-500 text-white dark:bg-emerald-600"
            : "",
          state === "upcoming"
            ? "bg-[var(--bg-surface-hover)] text-[var(--text-tertiary)] border border-[var(--border-default)]"
            : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {state === "completed" ? <Check className="h-3 w-3" /> : number}
      </span>

      <span
        className={[
          "text-[13px] transition-colors duration-200",
          state === "active"    ? "font-semibold text-[var(--text-primary)]" : "",
          state === "completed" ? "font-medium text-emerald-600 dark:text-emerald-400" : "",
          state === "upcoming"  ? "text-[var(--text-tertiary)]" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {label}
      </span>
    </div>
  );
}

// ── Inner page ────────────────────────────────────────────────────────────────

function ConnectPlatformsContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const isManaging   = searchParams.get("manage") === "1";
  const { isLoading: isAuthLoading } = useAuth();

  const [isCheckingPlatforms, setIsCheckingPlatforms] = useState(true);
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId]     = useState<string | null>(null);

  // Telegram fields
  const [tgBotToken, setTgBotToken] = useState("");

  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [toast, setToast]               = useState<string | null>(null);

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
          router.replace("/inbox");
        } else {
          setIsCheckingPlatforms(false);
        }
      })
      .catch(() => setIsCheckingPlatforms(false));
  }, [isAuthLoading, isManaging, router]);

  // WhatsApp fields
  const [waAccessToken, setWaAccessToken]     = useState("");
  const [waPhoneNumberId, setWaPhoneNumberId] = useState("");

  // Email fields
  const [emEmail, setEmEmail]               = useState("");
  const [emPassword, setEmPassword]         = useState("");
  const [emProvider, setEmProvider]         = useState<"gmail" | "outlook" | "custom">("gmail");
  const [emShowAdvanced, setEmShowAdvanced] = useState(false);
  const [emImapHost, setEmImapHost]         = useState("");
  const [emImapPort, setEmImapPort]         = useState("993");
  const [emImapSecure, setEmImapSecure]     = useState(true);
  const [emSmtpHost, setEmSmtpHost]         = useState("");
  const [emSmtpPort, setEmSmtpPort]         = useState("587");
  const [emSmtpSecure, setEmSmtpSecure]     = useState(false);

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
      if (!isManaging) setTimeout(() => router.replace("/inbox"), 1500);
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
      if (!isManaging) setTimeout(() => router.replace("/inbox"), 1500);
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
        email:    emEmail.trim(),
        password: emPassword,
        provider: emProvider,
      };

      if (emProvider === "custom" || emShowAdvanced) {
        if (emImapHost.trim()) {
          payload.imapOverride = {
            host:   emImapHost.trim(),
            port:   parseInt(emImapPort, 10) || 993,
            secure: emImapSecure,
          };
        }
        if (emSmtpHost.trim()) {
          payload.smtpOverride = {
            host:   emSmtpHost.trim(),
            port:   parseInt(emSmtpPort, 10) || 587,
            secure: emSmtpSecure,
          };
        }
      }

      await platformsService.connectEmail(payload);
      setToast("Email conectat cu succes.");
      setConnectedIds((prev) => new Set(prev).add("email"));
      setSelectedId(null);
      if (!isManaging) setTimeout(() => router.replace("/inbox"), 1500);
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
        <Loader2 className="h-5 w-5 animate-spin text-[var(--text-tertiary)]" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden rounded-xl bg-[var(--bg-surface)] shadow-[var(--shadow-card)] border border-[var(--border-default)]">
      {/* ── Toast ── */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] font-medium text-emerald-700 shadow-[var(--shadow-dropdown)] dark:border-emerald-900/50 dark:bg-emerald-950/50 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {toast}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[980px] mx-auto px-8 py-8">

          {/* ── Page header ──────────────────────────────────────────── */}
          <div className="mb-7">
            <h1 className="text-[20px] font-semibold text-[var(--text-primary)] tracking-tight leading-none">
              {isManaging ? "Gestionează platformele" : "Conectează-ți prima platformă"}
            </h1>
            <p className="mt-1.5 text-[13px] text-[var(--text-secondary)] leading-relaxed">
              {isManaging
                ? "Adaugă sau gestionează canalele de comunicare conectate."
                : "Alege canalul de comunicare pe care vrei să-l gestionezi."}
            </p>
          </div>

          {/* ── Step flow ─────────────────────────────────────────────── */}
          <div className="mb-8 flex items-center gap-3">
            <StepItem
              number={1}
              label="Alege platforma"
              state={currentStep > 1 ? "completed" : "active"}
            />
            <div className="w-8 h-px bg-[var(--border-default)]" />
            <StepItem
              number={2}
              label="Conectează"
              state={currentStep === 2 ? "active" : "upcoming"}
            />
            <div className="w-8 h-px bg-[var(--border-default)]" />
            <StepItem number={3} label="Configurează" state="upcoming" />
          </div>

          {/* ── Two-column layout ──────────────────────────────────────── */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-start">

            {/* ── LEFT: Platform grid ──────────────────────────────── */}
            <div className="flex-1 min-w-0 space-y-3">
              <p className={SECTION_LABEL}>Platforme disponibile</p>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
          <Loader2 className="h-5 w-5 animate-spin text-[var(--text-tertiary)]" />
        </div>
      }
    >
      <ConnectPlatformsContent />
    </Suspense>
  );
}

// ── PlatformCard ──────────────────────────────────────────────────────────────

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
        // Base shell — same card family as the rest of the app
        "group relative w-full rounded-2xl border p-5 text-left transition-all duration-150 ease-out overflow-hidden",
        "bg-[var(--bg-surface)] border-[var(--border-warm)]",

        // Hover — subtle lift with soft border change
        clickable && !isSelected
          ? "cursor-pointer hover:bg-[var(--bg-surface-hover)] hover:border-[var(--border-default)] hover:shadow-[var(--shadow-sm)]"
          : "",

        // Selected — accent border + very light ring, matching the app's selected-state language
        isSelected
          ? "border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/10 shadow-[var(--shadow-sm)] cursor-default"
          : "",

        // Connected — gently muted, not distracting
        isConnected && !isSelected ? "cursor-default opacity-75" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Selected top accent bar */}
      {isSelected && (
        <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-2xl bg-[var(--accent-primary)]" />
      )}

      {/* Connected top accent bar — soft green */}
      {isConnected && !isSelected && (
        <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-2xl bg-emerald-500 dark:bg-emerald-600" />
      )}

      {/* Connected badge — same soft semantic color as lifecycle badges */}
      {isConnected && (
        <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/50 dark:text-emerald-400">
          <CheckCircle2 className="h-3 w-3" />
          Conectat
        </span>
      )}

      {/* Icon box — same style as ConfigurationTab icon boxes */}
      <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--bg-surface-hover)] transition-colors duration-200 group-hover:bg-[var(--border-subtle)]">
        <span className={platform.iconClass}>{platform.icon}</span>
      </div>

      {/* Content */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[14px] font-semibold text-[var(--text-primary)] leading-tight">
            {platform.label}
          </p>
          <p className="mt-1 text-[12px] text-[var(--text-secondary)] leading-relaxed">
            {platform.description}
          </p>
        </div>

        {clickable && (
          <ArrowRight
            className={[
              "h-4 w-4 shrink-0 mt-0.5 transition-all duration-200 text-[var(--text-tertiary)]",
              isSelected
                ? "opacity-70"
                : "opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5",
            ].join(" ")}
          />
        )}
      </div>
    </button>
  );
}

// ── Empty config panel ────────────────────────────────────────────────────────

function EmptyConfigPanel() {
  return (
    <div className="flex min-h-[340px] flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-default)] bg-[var(--bg-surface-hover)]/50 px-8 py-12 text-center">
      {/* Platform icon trio — cards-in-cards, same depth language */}
      <div className="mb-5 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-warm)] bg-[var(--bg-surface)] shadow-[var(--shadow-sm)]">
          <span className="text-sky-500 dark:text-sky-400"><TelegramIcon /></span>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border-warm)] bg-[var(--bg-surface)] shadow-[var(--shadow-card)]">
          <span className="text-emerald-600 dark:text-emerald-400"><WhatsAppIcon /></span>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-warm)] bg-[var(--bg-surface)] shadow-[var(--shadow-sm)]">
          <span className="text-orange-500 dark:text-orange-400"><EmailIcon /></span>
        </div>
      </div>

      <p className="text-[14px] font-semibold text-[var(--text-primary)] leading-tight">
        Nicio platformă selectată
      </p>
      <p className="mt-2 max-w-[220px] text-[13px] text-[var(--text-secondary)] leading-relaxed">
        Alege o platformă din stânga pentru a configura integrarea.
      </p>
    </div>
  );
}

// ── Telegram form ─────────────────────────────────────────────────────────────

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
      <div className="flex items-start gap-3 pb-5 border-b border-[var(--border-subtle)]">
        <div className={ICON_BOX}>
          <span className="text-sky-500 dark:text-sky-400"><TelegramIcon /></span>
        </div>
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-[var(--text-primary)] leading-tight">
            Conectează Telegram
          </h2>
          <p className="mt-0.5 text-[13px] text-[var(--text-secondary)] leading-relaxed">
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
          <p className="text-[12px] text-[var(--text-tertiary)] leading-relaxed">
            Obține token-ul de la{" "}
            <span className="font-semibold text-[var(--text-secondary)]">@BotFather</span> cu comanda{" "}
            <code className="rounded border border-[var(--border-default)] bg-[var(--bg-surface-hover)] px-1.5 py-0.5 text-[11px] font-mono text-[var(--text-primary)]">
              /newbot
            </code>
            .
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
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

// ── WhatsApp form ─────────────────────────────────────────────────────────────

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
      <p className="text-[12px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.06em]">
        {label}
      </p>
      <div className="flex items-center gap-2 rounded-[var(--radius-input)] border border-[var(--border-default)] bg-[var(--bg-page)] px-3.5 py-2.5">
        <code className="flex-1 min-w-0 truncate text-[12px] font-mono text-[var(--text-primary)] leading-snug">
          {value}
        </code>
        <button
          type="button"
          onClick={copy}
          className={[
            "shrink-0 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-all duration-150 ease-out",
            copied
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
              : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]",
          ].join(" ")}
        >
          {copied ? (
            <><Check className="h-3 w-3" />Copiat</>
          ) : (
            <><Copy className="h-3 w-3" />Copiază</>
          )}
        </button>
      </div>
    </div>
  );
}

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
        <div className="flex items-start gap-3 pb-5 border-b border-[var(--border-subtle)]">
          <div className={ICON_BOX}>
            <span className="text-emerald-600 dark:text-emerald-400"><WhatsAppIcon /></span>
          </div>
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold text-[var(--text-primary)] leading-tight">
              Conectează WhatsApp
            </h2>
            <p className="mt-0.5 text-[13px] text-[var(--text-secondary)] leading-relaxed">
              WhatsApp Business Cloud API
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div className="space-y-2">
            <label htmlFor="wa-token" className={LABEL}>Access Token</label>
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
            <label htmlFor="wa-phone-id" className={LABEL}>Phone Number ID</label>
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
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
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
        <div className="mb-5">
          <p className="text-[13px] font-semibold text-[var(--text-primary)]">Configurare Webhook</p>
          <p className="mt-0.5 text-[12px] text-[var(--text-secondary)] leading-relaxed">
            Configurează webhook-ul în Meta Developer Portal.
          </p>
        </div>

        <div className="space-y-4">
          <CopyField label="Callback URL" value={WHATSAPP_WEBHOOK_URL} />
          <CopyField label="Verify Token" value={WHATSAPP_VERIFY_TOKEN} />
        </div>

        {/* Instructions — inset info block matching app's note-style surfaces */}
        <div className="mt-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] px-4 py-4">
          <p className="text-[12px] font-semibold text-[var(--text-secondary)] mb-2.5">Pași de urmat</p>
          <ol className="space-y-2 text-[12px] text-[var(--text-tertiary)] leading-relaxed">
            <li className="flex gap-2">
              <span className="shrink-0 font-semibold text-[var(--accent-primary)]">1.</span>
              <span>
                Meta Developer Portal → WhatsApp → Configuration → Webhook →{" "}
                <span className="font-semibold text-[var(--text-secondary)]">Edit</span>
              </span>
            </li>
            <li className="flex gap-2">
              <span className="shrink-0 font-semibold text-[var(--accent-primary)]">2.</span>
              <span>
                Lipește URL-ul și token-ul de mai sus, apasă{" "}
                <span className="font-semibold text-[var(--text-secondary)]">Verify and Save</span>
              </span>
            </li>
            <li className="flex gap-2">
              <span className="shrink-0 font-semibold text-[var(--accent-primary)]">3.</span>
              <span>
                Abonează-te la evenimentul{" "}
                <code className="rounded border border-[var(--border-default)] bg-[var(--bg-surface-hover)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--text-primary)]">
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

// ── Email form ────────────────────────────────────────────────────────────────

const EMAIL_PROVIDERS = [
  { value: "gmail",   label: "Gmail" },
  { value: "outlook", label: "Outlook / Microsoft 365" },
  { value: "custom",  label: "Custom (IMAP/SMTP)" },
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
  const isCustom            = provider === "custom";
  const showAdvancedSection = showAdvanced || isCustom;

  return (
    <div className={`${CARD} p-6`}>
      {/* Header */}
      <div className="flex items-start gap-3 pb-5 border-b border-[var(--border-subtle)]">
        <div className={ICON_BOX}>
          <span className="text-orange-500 dark:text-orange-400"><EmailIcon /></span>
        </div>
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-[var(--text-primary)] leading-tight">
            Conectează Email
          </h2>
          <p className="mt-0.5 text-[13px] text-[var(--text-secondary)] leading-relaxed">
            IMAP + SMTP cu parolă de aplicație
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="mt-5 space-y-5">

        {/* Provider */}
        <div className="space-y-2">
          <label htmlFor="em-provider" className={LABEL}>Provider</label>
          <select
            id="em-provider"
            value={provider}
            onChange={(e) => onProviderChange(e.target.value as "gmail" | "outlook" | "custom")}
            className={INPUT}
          >
            {EMAIL_PROVIDERS.map((p) => (
              <option key={p.value} value={p.value} className="bg-[var(--bg-surface)]">
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label htmlFor="em-email" className={LABEL}>Adresă email</label>
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
            {provider === "gmail"
              ? "Parolă de aplicație"
              : provider === "outlook"
              ? "Parolă cont / aplicație"
              : "Parolă"}
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
            <p className="text-[12px] text-[var(--text-tertiary)] leading-relaxed">
              Generează o parolă de aplicație în{" "}
              <span className="font-semibold text-[var(--text-secondary)]">
                Google Account → Security → App passwords
              </span>
              .
            </p>
          )}
          {provider === "outlook" && (
            <p className="text-[12px] text-[var(--text-tertiary)] leading-relaxed">
              Activează IMAP în setările Outlook și folosește parola contului.
            </p>
          )}
        </div>

        {/* Advanced toggle */}
        {!isCustom && (
          <button
            type="button"
            onClick={() => onShowAdvancedChange(!showAdvanced)}
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors duration-150"
          >
            {showAdvanced
              ? <ChevronUp className="h-3.5 w-3.5" />
              : <ChevronDown className="h-3.5 w-3.5" />}
            Setări avansate IMAP/SMTP
          </button>
        )}

        {/* Advanced section — inset panel matching WhatsApp instructions block */}
        {showAdvancedSection && (
          <div className="space-y-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] px-4 py-4">
            <p className="text-[12px] font-semibold text-[var(--text-secondary)]">IMAP</p>
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
                    className="h-4 w-4 rounded border-[var(--border-default)] cursor-pointer accent-[var(--accent-primary)]"
                  />
                </div>
              </div>
            </div>

            <p className="text-[12px] font-semibold text-[var(--text-secondary)] pt-1">SMTP</p>
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
                    className="h-4 w-4 rounded border-[var(--border-default)] cursor-pointer accent-[var(--accent-primary)]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
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
