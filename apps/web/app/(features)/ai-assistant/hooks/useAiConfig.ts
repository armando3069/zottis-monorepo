"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  aiAssistantService,
  aiAssistantQueryKeys,
} from "@/services/ai-assistant/ai-assistant.service";
import type { AiAssistantConfig, AiAssistantConfigPatch, ResponseTone } from "@/services/ai-assistant/ai-assistant.types";

export interface UseAiConfigReturn {
  configLoading: boolean;
  autoReply: boolean;
  tone: ResponseTone;
  threshold: number;
  savingConfig: boolean;
  configError: string | null;
  setToneState: (v: ResponseTone) => void;
  setThresholdState: (v: number) => void;
  saveConfig: (patch: AiAssistantConfigPatch) => Promise<void>;
}

export function useAiConfig(): UseAiConfigReturn {
  const queryClient = useQueryClient();

  const { data: config, isLoading: configLoading } = useQuery({
    ...aiAssistantQueryKeys.config(),
    retry: false,
  });

  const [tone, setToneState] = useState<ResponseTone>("professional");
  const [threshold, setThresholdState] = useState(70);

  // Sync local controlled state from the loaded config
  useEffect(() => {
    if (config) {
      setToneState(config.responseTone);
      setThresholdState(config.confidenceThreshold);
    }
  }, [config]);

  const { mutateAsync, isPending: savingConfig, error: saveError } = useMutation({
    mutationFn: (patch: AiAssistantConfigPatch) => aiAssistantService.updateConfig(patch),
    onSuccess: (updated: AiAssistantConfig) => {
      queryClient.setQueryData(aiAssistantQueryKeys.config().queryKey, updated);
    },
  });

  const saveConfig = useCallback(
    async (patch: AiAssistantConfigPatch) => {
      await mutateAsync(patch);
    },
    [mutateAsync],
  );

  return {
    configLoading,
    autoReply: config?.autoReplyEnabled ?? false,
    tone,
    threshold,
    savingConfig,
    configError:
      saveError instanceof Error
        ? "Nu s-a putut salva configurația. Încearcă din nou."
        : null,
    setToneState,
    setThresholdState,
    saveConfig,
  };
}
