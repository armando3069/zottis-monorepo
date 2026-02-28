"use client";

import { useRef, useState, useEffect, useCallback } from "react";
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
  MessageSquare,
  X,
} from "lucide-react";
import {
  getAutoReplyStatus,
  setAutoReply,
  testAiReply,
  uploadKnowledgePdf,
  askKnowledge,
  getKnowledgeFiles,
  clearKnowledge,
  type IndexedFile,
} from "@/services/api/api";

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
  const [testReply, setTestReplyText] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);

  // ── Knowledge Base state ────────────────────────────────────────────────────
  const [kbFiles, setKbFiles] = useState<IndexedFile[]>([]);
  const [kbFilesLoading, setKbFilesLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<
    | null
    | { state: "uploading"; name: string }
    | { state: "done"; name: string; chunks: number }
    | { state: "error"; message: string }
  >(null);
  const [kbQuestion, setKbQuestion] = useState("");
  const [kbAnswer, setKbAnswer] = useState<string | null>(null);
  const [kbAnswerLoading, setKbAnswerLoading] = useState(false);
  const [kbAnswerError, setKbAnswerError] = useState<string | null>(null);
  const [clearingKb, setClearingKb] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Load auto-reply status on mount ────────────────────────────────────────
  useEffect(() => {
    getAutoReplyStatus()
      .then(({ enabled }) => setAutoReplyState(enabled))
      .catch(() => {/* silently ignore — API may not be ready */});
  }, []);

  // ── Load KB files when tab is opened ───────────────────────────────────────
  const loadKbFiles = useCallback(async () => {
    setKbFilesLoading(true);
    try {
      const { files } = await getKnowledgeFiles();
      setKbFiles(files);
    } catch {
      // Not critical — in-memory data may have reset
    } finally {
      setKbFilesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "knowledge") loadKbFiles();
  }, [activeTab, loadKbFiles]);

  // ── Configuration handlers ──────────────────────────────────────────────────

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

  // ── Knowledge Base handlers ─────────────────────────────────────────────────

  const handlePdfUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setUploadStatus({ state: "error", message: "Doar fișiere PDF sunt acceptate." });
      return;
    }
    setUploadStatus({ state: "uploading", name: file.name });
    try {
      const result = await uploadKnowledgePdf(file);
      setUploadStatus({ state: "done", name: result.file, chunks: result.chunks });
      // Refresh the files list
      const { files } = await getKnowledgeFiles();
      setKbFiles(files);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload eșuat.";
      setUploadStatus({ state: "error", message: msg });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handlePdfUpload(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handlePdfUpload(file);
  };

  const handleKbAsk = async () => {
    if (!kbQuestion.trim()) return;
    setKbAnswerLoading(true);
    setKbAnswer(null);
    setKbAnswerError(null);
    try {
      const { answer } = await askKnowledge(kbQuestion.trim());
      setKbAnswer(answer);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Eroare la generarea răspunsului.";
      setKbAnswerError(msg);
    } finally {
      setKbAnswerLoading(false);
    }
  };

  const handleClearKb = async () => {
    setClearingKb(true);
    try {
      await clearKnowledge();
      setKbFiles([]);
      setKbAnswer(null);
      setUploadStatus(null);
    } catch {
      /* ignore */
    } finally {
      setClearingKb(false);
    }
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
              onClick={() => uploadStatus?.state !== "uploading" && fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 transition-colors ${
                uploadStatus?.state === "uploading"
                  ? "cursor-wait border-blue-300 bg-blue-50/50"
                  : isDragging
                  ? "border-blue-400 bg-blue-50"
                  : "border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50/50"
              }`}
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                uploadStatus?.state === "uploading" ? "bg-blue-100" : "bg-blue-50"
              }`}>
                {uploadStatus?.state === "uploading" ? (
                  <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                ) : (
                  <Upload className="h-5 w-5 text-blue-600" />
                )}
              </div>

              {uploadStatus?.state === "uploading" ? (
                <div className="text-center">
                  <p className="font-medium text-slate-700">
                    Se procesează <span className="text-blue-600">{uploadStatus.name}</span>…
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    Parsare PDF, creare embeddings…
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="font-medium text-slate-700">
                    Trage un fișier PDF aici
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    sau click pentru a selecta — doar fișiere <strong>.pdf</strong>
                  </p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={handleInputChange}
                disabled={uploadStatus?.state === "uploading"}
              />
            </div>

            {/* Upload result banner */}
            {uploadStatus && uploadStatus.state !== "uploading" && (
              <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
                uploadStatus.state === "done"
                  ? "border-green-200 bg-green-50"
                  : "border-red-200 bg-red-50"
              }`}>
                <div className="flex-1">
                  {uploadStatus.state === "done" ? (
                    <p className="text-sm text-green-700">
                      <span className="font-semibold">{uploadStatus.name}</span> indexat cu succes
                      — <span className="font-semibold">{uploadStatus.chunks}</span> chunks.
                    </p>
                  ) : (
                    <p className="text-sm text-red-600">{uploadStatus.message}</p>
                  )}
                </div>
                <button
                  onClick={() => setUploadStatus(null)}
                  className="shrink-0 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Indexed files */}
            {kbFilesLoading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Se încarcă fișierele…
              </div>
            ) : kbFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center">
                <FileText className="h-8 w-8 text-slate-300" />
                <p className="text-sm text-slate-400">
                  Niciun fișier indexat. Încarcă un PDF pentru a începe.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Fișiere indexate
                  </p>
                  <button
                    onClick={handleClearKb}
                    disabled={clearingKb}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                  >
                    {clearingKb ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    Șterge tot
                  </button>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Fișier
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Chunks
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Indexat
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {kbFiles.map((file, i) => (
                      <tr key={i} className="transition-colors hover:bg-slate-50">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <FileText className="h-4 w-4 shrink-0 text-red-400" />
                            <span className="font-medium text-slate-700 truncate max-w-[200px]">
                              {file.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-center text-slate-600">
                          {file.chunks}
                        </td>
                        <td className="px-4 py-3.5 text-center text-slate-500">
                          {file.uploadedAt}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="border-t border-slate-100 bg-slate-50 px-5 py-2.5">
                  <p className="text-xs text-slate-400">
                    {kbFiles.length} fișier{kbFiles.length !== 1 ? "e" : ""} ·{" "}
                    {kbFiles.reduce((s, f) => s + f.chunks, 0)} chunks total
                  </p>
                </div>
              </div>
            )}

            {/* Q&A section */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4 mb-4">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                  <MessageSquare className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">
                    Întreabă Knowledge Base-ul
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    AI-ul va răspunde <em>exclusiv</em> pe baza documentelor PDF
                    încărcate.
                  </p>
                </div>
              </div>

              <textarea
                value={kbQuestion}
                onChange={(e) => setKbQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleKbAsk();
                  }
                }}
                rows={3}
                placeholder="Ex: Care este procedura de returnare a produselor?"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 placeholder-slate-400 focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 resize-none"
              />

              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-xs text-slate-400">
                  Enter pentru a trimite · Shift+Enter pentru linie nouă
                </p>
                <button
                  onClick={handleKbAsk}
                  disabled={kbAnswerLoading || !kbQuestion.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                >
                  {kbAnswerLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {kbAnswerLoading ? "Se caută…" : "Întreabă"}
                </button>
              </div>

              {kbAnswerError && (
                <div className="mt-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                  <p className="text-sm text-red-600">{kbAnswerError}</p>
                </div>
              )}

              {kbAnswer && (
                <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-500">
                    Răspuns din Knowledge Base
                  </p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{kbAnswer}</p>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
