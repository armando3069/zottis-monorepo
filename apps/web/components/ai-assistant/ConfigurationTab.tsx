"use client";

import { useState } from "react";
import {
  Bot,
  Send,
  Loader2,
  ChevronDown,
  SlidersHorizontal,
  ShieldAlert,
} from "lucide-react";
import { testAiReply, type ResponseTone } from "@/services/api/api";
import type { UseAiConfigReturn } from "@/hooks/useAiConfig";

// ── Constants ─────────────────────────────────────────────────────────────────

const TONE_OPTIONS: { value: ResponseTone; label: string; description: string }[] = [
  { value: "professional", label: "Professional",  description: "Clear, concise, and formal" },
  { value: "friendly",     label: "Friendly",      description: "Warm and helpful" },
  { value: "casual",       label: "Casual",        description: "Relaxed and conversational" },
  { value: "strict",       label: "Strict",        description: "Direct and minimal" },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-blue-600" : "bg-slate-200"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function ToneSelector({
  value,
  onChange,
  disabled,
}: {
  value: ResponseTone;
  onChange: (v: ResponseTone) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = TONE_OPTIONS.find((o) => o.value === value) ?? TONE_OPTIONS[0];

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 transition-colors hover:border-blue-300 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <div className="text-left">
          <span className="font-medium">{selected.label}</span>
          <span className="ml-2 text-slate-400">— {selected.description}</span>
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          {TONE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`flex w-full items-start gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-slate-50 ${
                opt.value === value ? "bg-blue-50" : ""
              }`}
            >
              <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 border-blue-500">
                {opt.value === value && (
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                )}
              </div>
              <div>
                <p className="font-medium text-slate-800">{opt.label}</p>
                <p className="text-xs text-slate-400">{opt.description}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ConfidenceSlider({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const color =
    value >= 75 ? "bg-green-500" :
    value >= 50 ? "bg-yellow-500" :
                  "bg-red-400";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-600">Confidence threshold</span>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold text-white ${color}`}>
          {value}%
        </span>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
      />

      <div className="flex justify-between text-xs text-slate-400">
        <span>0% — always respond</span>
        <span>100% — very strict</span>
      </div>
    </div>
  );
}

// ── ConfigurationTab ──────────────────────────────────────────────────────────

export interface ConfigurationTabProps {
  config: UseAiConfigReturn;
}

export default function ConfigurationTab({ config }: ConfigurationTabProps) {
  const {
    configLoading,
    autoReply,
    tone,
    threshold,
    savingConfig,
    configError,
    setToneState,
    setThresholdState,
    saveConfig,
  } = config;

  // ── Test AI reply state ───────────────────────────────────────────────────────
  const [testInput, setTestInput] = useState("");
  const [testReply, setTestReplyText] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);

  const handleTestSubmit = async () => {
    if (!testInput.trim()) return;
    setTestLoading(true);
    setTestReplyText(null);
    setTestError(null);
    try {
      const { reply } = await testAiReply(testInput.trim());
      setTestReplyText(reply);
    } catch {
      setTestError("AI-ul nu este disponibil momentan. Verifică că Ollama rulează.");
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="space-y-4">

      {configError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-600">{configError}</p>
        </div>
      )}

      {/* ── Auto-reply toggle ── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
              <Bot className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">
                Automatically responds to customer questions
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Asistentul AI va răspunde automat la mesajele primite
                folosind Knowledge Base-ul configurat.
              </p>
              <span
                className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  autoReply
                    ? "bg-green-100 text-green-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    autoReply ? "bg-green-500" : "bg-slate-400"
                  }`}
                />
                {autoReply ? "Activ" : "Inactiv"}
              </span>
            </div>
          </div>
          <Toggle
            checked={autoReply}
            onChange={(v) => saveConfig({ autoReplyEnabled: v })}
            disabled={savingConfig || configLoading}
          />
        </div>
      </div>

      {/* ── Response Tone ── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4 mb-4">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50">
            <SlidersHorizontal className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-800">Response Tone</p>
            <p className="mt-1 text-sm text-slate-500">
              Definește stilul de comunicare al asistentului AI în conversații.
            </p>
          </div>
        </div>

        {configLoading ? (
          <div className="flex items-center gap-2 py-3 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Se încarcă…
          </div>
        ) : (
          <ToneSelector
            value={tone}
            onChange={(v) => {
              setToneState(v);
              saveConfig({ responseTone: v });
            }}
            disabled={savingConfig}
          />
        )}
      </div>

      {/* ── Confidence Threshold ── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4 mb-5">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50">
            <ShieldAlert className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-800">Confidence Threshold</p>
            <p className="mt-1 text-sm text-slate-500">
              AI-ul răspunde automat <strong>numai</strong> dacă gradul de
              siguranță depășește pragul setat. Sub prag, mesajul rămâne
              pentru review manual.
            </p>
          </div>
        </div>

        {configLoading ? (
          <div className="flex items-center gap-2 py-3 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Se încarcă…
          </div>
        ) : (
          <ConfidenceSlider
            value={threshold}
            onChange={(v) => setThresholdState(v)}
            disabled={savingConfig}
          />
        )}

        {/* Save button — only appears after the user moves the slider */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => saveConfig({ confidenceThreshold: threshold })}
            disabled={savingConfig || configLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
          >
            {savingConfig ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            Salvează pragul
          </button>
        </div>
      </div>

      {/* ── Test AI reply ── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4 mb-4">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50">
            <Send className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-800">Test AI Reply</p>
            <p className="mt-1 text-sm text-slate-500">
              Trimite un mesaj de test și vezi răspunsul generat de AI cu
              tonul configurat mai sus.
            </p>
          </div>
        </div>

        <textarea
          value={testInput}
          onChange={(e) => setTestInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleTestSubmit();
            }
          }}
          rows={3}
          placeholder="Scrie un mesaj de test..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 placeholder-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
        />

        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-400">
            Enter pentru a trimite · Shift+Enter pentru linie nouă
          </p>
          <button
            onClick={handleTestSubmit}
            disabled={testLoading || !testInput.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
          >
            {testLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {testLoading ? "Se generează..." : "Test"}
          </button>
        </div>

        {testError && (
          <div className="mt-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-600">{testError}</p>
          </div>
        )}

        {testReply && (
          <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-blue-400">
              Răspuns AI
            </p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{testReply}</p>
          </div>
        )}
      </div>

    </div>
  );
}
