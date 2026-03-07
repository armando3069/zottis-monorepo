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
import type { UseKnowledgeBaseReturn } from "@/hooks/useKnowledgeBase";

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
  );
}
