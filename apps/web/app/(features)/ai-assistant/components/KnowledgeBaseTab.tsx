"use client";

import { useEffect } from "react";
import {
  Upload,
  Trash2,
  FileText,
  Send,
  Loader2,
  MessageSquare,
  X,
} from "lucide-react";
import type { UseKnowledgeBaseReturn } from "@/app/(features)/ai-assistant/hooks/useKnowledgeBase";

// ── Shared styles (must mirror ConfigurationTab tokens) ──────────────────────

const CARD = "rounded-2xl border border-[var(--border-warm)] bg-[var(--bg-surface)] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)]";
const ICON_BOX = "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F3F4F6]";
const ICON = "h-[18px] w-[18px] text-[var(--text-secondary)]";
const CARD_TITLE = "text-[14px] font-semibold text-[var(--text-primary)] leading-tight";
const CARD_DESC = "mt-1 text-[13px] text-[var(--text-tertiary)] leading-relaxed";
const PRIMARY_BTN = "inline-flex items-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent-primary)] px-4 py-2 text-[13px] font-medium text-white hover:bg-[var(--accent-primary-hover)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 transition-all duration-150 ease-out shadow-[var(--shadow-xs)]";
const TEXTAREA = "w-full rounded-xl border border-[var(--border-warm)] bg-[var(--bg-surface)] px-4 py-3 text-[13px] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/8 focus:border-[var(--text-tertiary)] resize-none transition-all duration-150 ease-out leading-relaxed";
const TH_CELL = "px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]";

// ── Component ────────────────────────────────────────────────────────────────

export interface KnowledgeBaseTabProps {
  kb: UseKnowledgeBaseReturn;
}

export default function KnowledgeBaseTab({ kb }: KnowledgeBaseTabProps) {
  const {
    kbFiles,
    kbFilesLoading,
    isDragging,
    setIsDragging,
    uploadStatus,
    setUploadStatus,
    kbQuestion,
    setKbQuestion,
    kbAnswer,
    kbAnswerLoading,
    kbAnswerError,
    clearingKb,
    fileInputRef,
    loadKbFiles,
    handleInputChange,
    handleDrop,
    handleKbAsk,
    handleClearKb,
  } = kb;

  // Load KB files when this tab mounts
  useEffect(() => {
    loadKbFiles();
  }, [loadKbFiles]);

  return (
    <div className="space-y-4">

      {/* ── Upload / Dropzone ────────────────────────────────────── */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => uploadStatus?.state !== "uploading" && fileInputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 transition-all duration-150 ease-out ${
          uploadStatus?.state === "uploading"
            ? "cursor-wait border-[var(--text-tertiary)] bg-[var(--bg-surface-hover)]"
            : isDragging
            ? "border-[var(--text-tertiary)] bg-[var(--bg-surface-hover)]"
            : "border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-[var(--text-tertiary)] hover:bg-[var(--bg-surface-hover)]"
        }`}
      >
        <div className={ICON_BOX.replace("h-9 w-9", "h-11 w-11")}>
          {uploadStatus?.state === "uploading" ? (
            <Loader2 className="h-5 w-5 text-[var(--text-secondary)] animate-spin" />
          ) : (
            <Upload className="h-5 w-5 text-[var(--text-secondary)]" />
          )}
        </div>

        {uploadStatus?.state === "uploading" ? (
          <div className="text-center">
            <p className="text-[14px] font-medium text-[var(--text-primary)]">
              Se procesează <span className="font-semibold">{uploadStatus.name}</span>…
            </p>
            <p className="mt-1 text-[13px] text-[var(--text-tertiary)]">
              Parsare PDF, creare embeddings…
            </p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-[14px] font-medium text-[var(--text-primary)]">
              Trage un fișier PDF aici
            </p>
            <p className="mt-1 text-[13px] text-[var(--text-tertiary)]">
              sau click pentru a selecta — doar fișiere <strong className="font-medium text-[var(--text-secondary)]">.pdf</strong>
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

      {/* ── Upload result banner ─────────────────────────────────── */}
      {uploadStatus && uploadStatus.state !== "uploading" && (
        <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
          uploadStatus.state === "done"
            ? "border-emerald-200/60 bg-emerald-50/50"
            : "border-red-200/60 bg-red-50/50"
        }`}>
          <div className="flex-1">
            {uploadStatus.state === "done" ? (
              <p className="text-[13px] text-emerald-700">
                <span className="font-semibold">{uploadStatus.name}</span> indexat cu succes
                — <span className="font-semibold tabular-nums">{uploadStatus.chunks}</span> chunks.
              </p>
            ) : (
              <p className="text-[13px] text-red-600">{uploadStatus.message}</p>
            )}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setUploadStatus(null); }}
            className="shrink-0 p-1 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] transition-all duration-150 ease-out"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ── Indexed files ────────────────────────────────────────── */}
      {kbFilesLoading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-[13px] text-[var(--text-tertiary)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Se încarcă fișierele…
        </div>
      ) : kbFiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[var(--border-default)] bg-[var(--bg-surface)] py-12 text-center">
          <div className={ICON_BOX.replace("h-9 w-9", "h-11 w-11")}>
            <FileText className="h-5 w-5 text-[var(--text-tertiary)]" />
          </div>
          <p className="text-[13px] text-[var(--text-tertiary)]">
            Niciun fișier indexat. Încarcă un PDF pentru a începe.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)]">
          {/* Header row */}
          <div className="flex items-center justify-between border-b border-[var(--border-default)] bg-[var(--bg-surface-hover)] px-5 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
              Fișiere indexate
            </p>
            <button
              onClick={handleClearKb}
              disabled={clearingKb}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12px] font-medium text-red-500 hover:bg-red-50/60 disabled:opacity-40 transition-all duration-150 ease-out"
            >
              {clearingKb ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
              Șterge tot
            </button>
          </div>

          {/* Table */}
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[var(--border-subtle)]">
                <th className={TH_CELL}>Fișier</th>
                <th className={`${TH_CELL} text-center`}>Chunks</th>
                <th className={`${TH_CELL} text-center`}>Indexat</th>
              </tr>
            </thead>
            <tbody>
              {kbFiles.map((file, i) => (
                <tr
                  key={i}
                  className="border-b border-[var(--border-subtle)] last:border-b-0 transition-colors duration-150 ease-out hover:bg-[var(--bg-surface-hover)]"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <FileText className="h-4 w-4 shrink-0 text-[var(--text-tertiary)]" />
                      <span className="font-medium text-[var(--text-primary)] truncate max-w-[240px]">
                        {file.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-[var(--text-secondary)] tabular-nums">
                    {file.chunks}
                  </td>
                  <td className="px-4 py-3 text-center text-[var(--text-tertiary)]">
                    {file.uploadedAt}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer */}
          <div className="border-t border-[var(--border-default)] bg-[var(--bg-surface-hover)] px-5 py-2.5">
            <p className="text-[11px] text-[var(--text-tertiary)] tabular-nums">
              {kbFiles.length} fișier{kbFiles.length !== 1 ? "e" : ""} ·{" "}
              {kbFiles.reduce((s, f) => s + f.chunks, 0)} chunks total
            </p>
          </div>
        </div>
      )}

      {/* ── Ask Knowledge Base ────────────────────────────────────── */}
      <div className={CARD}>
        <div className="flex items-start gap-3.5 mb-5">
          <div className={ICON_BOX}>
            <MessageSquare className={ICON} />
          </div>
          <div>
            <p className={CARD_TITLE}>
              Întreabă Knowledge Base-ul
            </p>
            <p className={CARD_DESC}>
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
          className={TEXTAREA}
        />

        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-[11px] text-[var(--text-tertiary)]">
            Enter pentru a trimite · Shift+Enter pentru linie nouă
          </p>
          <button
            onClick={handleKbAsk}
            disabled={kbAnswerLoading || !kbQuestion.trim()}
            className={PRIMARY_BTN}
          >
            {kbAnswerLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            {kbAnswerLoading ? "Se caută…" : "Întreabă"}
          </button>
        </div>

        {kbAnswerError && (
          <div className="mt-3 rounded-xl border border-red-200/60 bg-red-50/50 px-4 py-3">
            <p className="text-[13px] text-red-600">{kbAnswerError}</p>
          </div>
        )}

        {kbAnswer && (
          <div className="mt-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-hover)] px-4 py-3">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
              Răspuns din Knowledge Base
            </p>
            <p className="text-[13px] text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">{kbAnswer}</p>
          </div>
        )}
      </div>

    </div>
  );
}
