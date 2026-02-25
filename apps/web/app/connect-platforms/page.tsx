"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, LayoutTemplate } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getToken } from "@/services/auth/auth-service";
import {
  connectTelegram,
  getPlatformAccounts,
} from "@/services/platforms/platform-service";

// ── Platform config ─────────────────────────────────────────────────────────

type PlatformStatus = "available" | "coming-soon";

interface PlatformConfig {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  status: PlatformStatus;
  accentColor: string; // Tailwind text colour class
  bgColor: string;     // Tailwind bg colour class
  borderActive: string; // Tailwind border/ring class when selected
}

const PLATFORMS: PlatformConfig[] = [
  {
    id: "telegram",
    label: "Telegram",
    description: "Conectează-ți botul de suport sau vânzări.",
    icon: <TelegramIcon />,
    status: "available",
    accentColor: "text-sky-500",
    bgColor: "bg-sky-50",
    borderActive: "border-sky-500 ring-sky-500",
  },
  {
    id: "slack",
    label: "Slack",
    description: "Gestionează conversații din workspace-ul tău Slack.",
    icon: <SlackIcon />,
    status: "coming-soon",
    accentColor: "text-purple-500",
    bgColor: "bg-purple-50",
    borderActive: "border-purple-500 ring-purple-500",
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    description: "Conectează contul tău WhatsApp Business.",
    icon: <WhatsAppIcon />,
    status: "coming-soon",
    accentColor: "text-green-500",
    bgColor: "bg-green-50",
    borderActive: "border-green-500 ring-green-500",
  },
  {
    id: "teams",
    label: "Microsoft Teams",
    description: "Integrează cu Microsoft Teams pentru echipa ta.",
    icon: <TeamsIcon />,
    status: "coming-soon",
    accentColor: "text-indigo-500",
    bgColor: "bg-indigo-50",
    borderActive: "border-indigo-500 ring-indigo-500",
  },
];

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ConnectPlatformsPage() {
  const router = useRouter();
  const { isLoading: isAuthLoading } = useAuth();

  const [isCheckingPlatforms, setIsCheckingPlatforms] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [botToken, setBotToken] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const platformsChecked = useRef(false);

  // Auth guard: no token → login
  useEffect(() => {
    if (isAuthLoading) return;
    if (!getToken()) {
      router.replace("/auth/login");
    }
  }, [isAuthLoading, router]);

  // If the user already has a platform connected, skip this page.
  useEffect(() => {
    if (isAuthLoading || platformsChecked.current) return;
    const token = getToken();
    if (!token) return;

    platformsChecked.current = true;

    getPlatformAccounts(token)
      .then(({ total }) => {
        if (total > 0) {
          router.replace("/");
        } else {
          setIsCheckingPlatforms(false);
        }
      })
      .catch(() => {
        // Endpoint not ready yet — show the page anyway.
        setIsCheckingPlatforms(false);
      });
  }, [isAuthLoading, router]);

  const handleCardClick = (platform: PlatformConfig) => {
    if (platform.status !== "available") return;
    setSelectedId(platform.id);
    setConnectError(null);
    setBotToken("");
  };

  const handleTelegramSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token) return;

    setConnectError(null);
    setIsConnecting(true);

    try {
      await connectTelegram(token, botToken.trim());
      setToast("Telegram a fost conectat cu succes.");
      setTimeout(() => router.replace("/"), 1500);
    } catch (err) {
      setConnectError(
        err instanceof Error ? err.message : "A apărut o eroare. Încearcă din nou."
      );
    } finally {
      setIsConnecting(false);
    }
  };

  if (isAuthLoading || isCheckingPlatforms) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Success toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-medium text-white shadow-lg animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {toast}
        </div>
      )}

      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-lg">
            <LayoutTemplate className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">
            Conectează-ți prima platformă
          </h1>
          <p className="mt-3 text-base text-slate-500 max-w-md mx-auto">
            Alege canalul de comunicare pe care vrei să-l gestionezi. Poți adăuga
            mai multe platforme ulterior.
          </p>
        </div>

        {/* Two-column layout */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* ── Left: platform cards ── */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:flex-1">
            {PLATFORMS.map((platform) => (
              <PlatformCard
                key={platform.id}
                platform={platform}
                isSelected={selectedId === platform.id}
                onClick={() => handleCardClick(platform)}
              />
            ))}
          </div>

          {/* ── Right: connect form ── */}
          <div className="w-full lg:w-96 lg:shrink-0">
            {selectedId === "telegram" ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                {/* Form header */}
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50">
                    <span className="text-sky-500">
                      <TelegramIcon />
                    </span>
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-slate-800">
                      Conectează Telegram
                    </h2>
                    <p className="text-xs text-slate-500">
                      Introdu token-ul botului tău
                    </p>
                  </div>
                </div>

                <form onSubmit={handleTelegramSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="bot-token"
                      className="block text-sm font-medium text-slate-700"
                    >
                      Bot Token
                    </label>
                    <input
                      id="bot-token"
                      type="password"
                      value={botToken}
                      onChange={(e) => setBotToken(e.target.value)}
                      placeholder="1234567890:ABCDefgh..."
                      required
                      autoFocus
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <p className="text-xs text-slate-400">
                      Obține token-ul de la{" "}
                      <span className="font-medium text-slate-500">@BotFather</span>{" "}
                      pe Telegram cu comanda{" "}
                      <code className="rounded bg-slate-100 px-1 py-0.5">/newbot</code>.
                    </p>
                  </div>

                  {connectError && (
                    <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      {connectError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isConnecting || !botToken.trim()}
                    className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60"
                  >
                    {isConnecting ? "Se conectează…" : "Conectează Telegram"}
                  </button>
                </form>
              </div>
            ) : (
              /* Placeholder when no card is selected */
              <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                  <LayoutTemplate className="h-5 w-5 text-slate-400" />
                </div>
                <p className="text-sm text-slate-400">
                  Selectează o platformă din stânga pentru a o conecta.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── PlatformCard ─────────────────────────────────────────────────────────────

function PlatformCard({
  platform,
  isSelected,
  onClick,
}: {
  platform: PlatformConfig;
  isSelected: boolean;
  onClick: () => void;
}) {
  const available = platform.status === "available";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!available}
      className={[
        "relative w-full rounded-2xl border p-5 text-left transition-all duration-150",
        available ? "cursor-pointer" : "cursor-not-allowed opacity-60",
        isSelected
          ? `border-sky-500 ring-1 ring-sky-500 bg-white shadow-md`
          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm",
      ].join(" ")}
    >
      {/* Coming-soon badge */}
      {platform.status === "coming-soon" && (
        <span className="absolute right-3 top-3 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
          În curând
        </span>
      )}

      {/* Icon */}
      <div
        className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ${platform.bgColor}`}
      >
        <span className={platform.accentColor}>{platform.icon}</span>
      </div>

      {/* Text */}
      <p className="font-semibold text-slate-800">{platform.label}</p>
      <p className="mt-1 text-sm text-slate-500">{platform.description}</p>
    </button>
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

function SlackIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 54 54"
      aria-hidden="true"
    >
      <path d="M19.712.133a5.381 5.381 0 0 0-5.376 5.387 5.381 5.381 0 0 0 5.376 5.386h5.376V5.52A5.381 5.381 0 0 0 19.712.133m0 14.365H5.376A5.381 5.381 0 0 0 0 19.884a5.381 5.381 0 0 0 5.376 5.387h14.336a5.381 5.381 0 0 0 5.376-5.387 5.381 5.381 0 0 0-5.376-5.386" fill="#36C5F0" />
      <path d="M53.76 19.884a5.381 5.381 0 0 0-5.376-5.386 5.381 5.381 0 0 0-5.376 5.386v5.387h5.376a5.381 5.381 0 0 0 5.376-5.387m-14.336 0V5.52A5.381 5.381 0 0 0 34.048.133a5.381 5.381 0 0 0-5.376 5.387v14.364a5.381 5.381 0 0 0 5.376 5.387 5.381 5.381 0 0 0 5.376-5.387" fill="#2EB67D" />
      <path d="M34.048 54a5.381 5.381 0 0 0 5.376-5.387 5.381 5.381 0 0 0-5.376-5.386h-5.376v5.386A5.381 5.381 0 0 0 34.048 54m0-14.365h14.336a5.381 5.381 0 0 0 5.376-5.386 5.381 5.381 0 0 0-5.376-5.387H34.048a5.381 5.381 0 0 0-5.376 5.387 5.381 5.381 0 0 0 5.376 5.386" fill="#ECB22E" />
      <path d="M0 34.249a5.381 5.381 0 0 0 5.376 5.386 5.381 5.381 0 0 0 5.376-5.386v-5.387H5.376A5.381 5.381 0 0 0 0 34.249m14.336 0v14.364A5.381 5.381 0 0 0 19.712 54a5.381 5.381 0 0 0 5.376-5.387V34.249a5.381 5.381 0 0 0-5.376-5.387 5.381 5.381 0 0 0-5.376 5.387" fill="#E01E5A" />
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
