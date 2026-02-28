"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  Upload,
  Trash2,
  FileText,
  BookOpen,
  Send,
  Loader2,
} from "lucide-react";
import { getAutoReplyStatus, setAutoReply, testAiReply } from "@/services/api/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface KnowledgeFile {
  id: string;
  name: string;
  pages: number;
  chunks: number;
  size: string;
  created: string;
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_FILES: KnowledgeFile[] = [
  {
    id: "1",
    name: "FAQ Produse.pdf",
    pages: 12,
    chunks: 48,
    size: "1.2 MB",
    created: "2026-02-20",
  },
  {
    id: "2",
    name: "Manual Utilizare.pdf",
    pages: 34,
    chunks: 136,
    size: "3.8 MB",
    created: "2026-02-25",
  },
];

// ── Toggle switch ─────────────────────────────────────────────────────────────

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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AiAssistantPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"configuration" | "knowledge">(
    "configuration"
  );

  // ── Auto-reply state ────────────────────────────────────────────────────────
  const [autoReply, setAutoReplyState] = useState(false);
  const [togglingAutoReply, setTogglingAutoReply] = useState(false);
  const [autoReplyError, setAutoReplyError] = useState<string | null>(null);

  // ── Test AI reply state ─────────────────────────────────────────────────────
  const [testInput, setTestInput] = useState("");
  const [testReply, setTestReply] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);

  // ── Knowledge state ─────────────────────────────────────────────────────────
  const [files, setFiles] = useState<KnowledgeFile[]>(MOCK_FILES);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Load auto-reply status on mount ────────────────────────────────────────
  useEffect(() => {
    getAutoReplyStatus()
      .then(({ enabled }) => setAutoReplyState(enabled))
      .catch(() => {/* silently ignore — API may not be ready */});
  }, []);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleAutoReplyToggle = async (next: boolean) => {
    setTogglingAutoReply(true);
    setAutoReplyError(null);
    try {
      const { enabled } = await setAutoReply(next);
      setAutoReplyState(enabled);
    } catch {
      setAutoReplyError("Nu s-a putut schimba starea. Încearcă din nou.");
    } finally {
      setTogglingAutoReply(false);
    }
  };

  const handleTestSubmit = async () => {
    if (!testInput.trim()) return;
    setTestLoading(true);
    setTestReply(null);
    setTestError(null);
    try {
      const { reply } = await testAiReply(testInput.trim());
      setTestReply(reply);
    } catch {
      setTestError("AI-ul nu este disponibil momentan. Verifică că Ollama rulează.");
    } finally {
      setTestLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleFileAdd = (file: File) => {
    if (!file.name.endsWith(".pdf")) return;
    const newFile: KnowledgeFile = {
      id: Date.now().toString(),
      name: file.name,
      pages: Math.floor(Math.random() * 40) + 5,
      chunks: Math.floor(Math.random() * 160) + 20,
      size:
        file.size > 1_000_000
          ? `${(file.size / 1_000_000).toFixed(1)} MB`
          : `${Math.round(file.size / 1000)} KB`,
      created: new Date().toISOString().slice(0, 10),
    };
    setFiles((prev) => [newFile, ...prev]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileAdd(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileAdd(file);
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">

        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Înapoi
          </button>

          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 shadow-lg">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">AI Assistant</h1>
              <p className="text-sm text-slate-500">
                Configurează asistentul inteligent pentru conversații
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-xl bg-slate-100 p-1">
          <button
            onClick={() => setActiveTab("configuration")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all ${
              activeTab === "configuration"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Bot className="h-4 w-4" />
            Configuration
          </button>
          <button
            onClick={() => setActiveTab("knowledge")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all ${
              activeTab === "knowledge"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            Knowledge Base
          </button>
        </div>

        {/* ── Tab: Configuration ── */}
        {activeTab === "configuration" && (
          <div className="space-y-4">

            {/* Auto-reply toggle */}
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
                    {autoReplyError && (
                      <p className="mt-2 text-xs text-red-500">{autoReplyError}</p>
                    )}
                  </div>
                </div>
                <Toggle
                  checked={autoReply}
                  onChange={handleAutoReplyToggle}
                  disabled={togglingAutoReply}
                />
              </div>
            </div>

            {/* Test AI reply */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4 mb-4">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50">
                  <Send className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Test AI Reply</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Trimite un mesaj de test și vezi răspunsul generat de AI.
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

            {/* Coming soon cards */}
            {[
              {
                label: "Response language",
                desc: "Detectează automat limba clientului și răspunde în aceeași limbă.",
              },
              {
                label: "Confidence threshold",
                desc: "Răspunde doar când gradul de siguranță al AI-ului depășește pragul setat.",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm opacity-50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-800">{item.label}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.desc}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                    În curând
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Tab: Knowledge Base ── */}
        {activeTab === "knowledge" && (
          <div className="space-y-5">
            {/* Upload area */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 transition-colors ${
                isDragging
                  ? "border-blue-400 bg-blue-50"
                  : "border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50/50"
              }`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                <Upload className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-center">
                <p className="font-medium text-slate-700">
                  Trage un fișier PDF aici
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  sau click pentru a selecta — doar fișiere <strong>.pdf</strong>
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleInputChange}
              />
            </div>

            {/* Table */}
            {files.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
                <FileText className="h-8 w-8 text-slate-300" />
                <p className="text-sm text-slate-400">
                  Niciun fișier încărcat încă.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Fișier
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Pages
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Chunks
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Size
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Created
                      </th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {files.map((file) => (
                      <tr
                        key={file.id}
                        className="transition-colors hover:bg-slate-50"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <FileText className="h-4 w-4 shrink-0 text-red-400" />
                            <span className="font-medium text-slate-700 truncate max-w-[160px]">
                              {file.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-center text-slate-600">
                          {file.pages}
                        </td>
                        <td className="px-4 py-3.5 text-center text-slate-600">
                          {file.chunks}
                        </td>
                        <td className="px-4 py-3.5 text-center text-slate-500">
                          {file.size}
                        </td>
                        <td className="px-4 py-3.5 text-center text-slate-500">
                          {file.created}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            onClick={() => handleDelete(file.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Șterge
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="border-t border-slate-100 bg-slate-50 px-5 py-2.5">
                  <p className="text-xs text-slate-400">
                    {files.length} fișier{files.length !== 1 ? "e" : ""} ·{" "}
                    {files.reduce((s, f) => s + f.chunks, 0)} chunks total
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
