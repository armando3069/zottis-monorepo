"use client";

import { useRef, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { knowledgeService, knowledgeQueryKeys } from "@/services/knowledge/knowledge.service";
import type { IndexedFile } from "@/services/knowledge/knowledge.types";

export type UploadStatus =
  | null
  | { state: "uploading"; name: string }
  | { state: "done"; name: string; chunks: number }
  | { state: "error"; message: string };

export interface UseKnowledgeBaseReturn {
  kbFiles: IndexedFile[];
  kbFilesLoading: boolean;
  isDragging: boolean;
  setIsDragging: (v: boolean) => void;
  uploadStatus: UploadStatus;
  setUploadStatus: (v: UploadStatus) => void;
  kbQuestion: string;
  setKbQuestion: (v: string) => void;
  kbAnswer: string | null;
  kbAnswerLoading: boolean;
  kbAnswerError: string | null;
  clearingKb: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  loadKbFiles: () => Promise<void>;
  handlePdfUpload: (file: File) => Promise<void>;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDrop: (e: React.DragEvent) => void;
  handleKbAsk: () => Promise<void>;
  handleClearKb: () => Promise<void>;
}

export function useKnowledgeBase(): UseKnowledgeBaseReturn {
  const queryClient = useQueryClient();

  const { data, isLoading: kbFilesLoading, refetch } = useQuery({
    ...knowledgeQueryKeys.files(),
  });
  const kbFiles = data?.files ?? [];

  const loadKbFiles = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>(null);
  const [kbQuestion, setKbQuestion] = useState("");
  const [kbAnswer, setKbAnswer] = useState<string | null>(null);
  const [kbAnswerLoading, setKbAnswerLoading] = useState(false);
  const [kbAnswerError, setKbAnswerError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => knowledgeService.uploadPdf(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: knowledgeQueryKeys.files().queryKey });
    },
  });

  const clearMutation = useMutation({
    mutationFn: () => knowledgeService.clear(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: knowledgeQueryKeys.files().queryKey });
    },
  });

  const handlePdfUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setUploadStatus({ state: "error", message: "Doar fișiere PDF sunt acceptate." });
      return;
    }
    setUploadStatus({ state: "uploading", name: file.name });
    try {
      const result = await uploadMutation.mutateAsync(file);
      setUploadStatus({ state: "done", name: result.file, chunks: result.chunks });
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
      const { answer } = await knowledgeService.ask(kbQuestion.trim());
      setKbAnswer(answer);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Eroare la generarea răspunsului.";
      setKbAnswerError(msg);
    } finally {
      setKbAnswerLoading(false);
    }
  };

  const handleClearKb = async () => {
    try {
      await clearMutation.mutateAsync();
      setKbAnswer(null);
      setUploadStatus(null);
    } catch {
      /* ignore */
    }
  };

  return {
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
    clearingKb: clearMutation.isPending,
    fileInputRef,
    loadKbFiles,
    handlePdfUpload,
    handleInputChange,
    handleDrop,
    handleKbAsk,
    handleClearKb,
  };
}
