import { createQueryKeys } from "@lukemorales/query-key-factory";
import { request } from "@/lib/api/request";
import { ROUTES } from "@/lib/api/routes";
import type {
  AiAssistantConfig,
  AiAssistantConfigPatch,
  TranslatePayload,
  TranslateResult,
} from "./ai-assistant.types";

class AiAssistantService {
  getConfig = (): Promise<AiAssistantConfig> =>
    request.get<AiAssistantConfig>(ROUTES.aiAssistant.config);

  updateConfig = (patch: AiAssistantConfigPatch): Promise<AiAssistantConfig> =>
    request.post<AiAssistantConfig>(ROUTES.aiAssistant.config, patch);

  getAutoReplyStatus = (): Promise<{ enabled: boolean }> =>
    request.get<{ enabled: boolean }>(ROUTES.aiAssistant.autoReplyStatus);

  setAutoReply = (enabled: boolean): Promise<{ enabled: boolean }> =>
    request.post<{ enabled: boolean }>(ROUTES.aiAssistant.autoReplyEnable, { enabled });

  testReply = (text: string): Promise<{ reply: string }> =>
    request.post<{ reply: string }>(ROUTES.aiAssistant.testReply, { text });

  translate = (payload: TranslatePayload): Promise<TranslateResult> =>
    request.post<TranslateResult>(ROUTES.aiAssistant.translate, payload);

  getSuggestedReplies = (conversationId: number): Promise<{ suggestions: string[] }> =>
    request.get<{ suggestions: string[] }>(
      ROUTES.aiAssistant.suggestedReplies(conversationId),
    );
}

export const aiAssistantService = new AiAssistantService();

export const aiAssistantQueryKeys = createQueryKeys("aiAssistant", {
  config: () => ({
    queryKey: ["config"],
    queryFn: () => aiAssistantService.getConfig(),
  }),
  autoReplyStatus: () => ({
    queryKey: ["autoReplyStatus"],
    queryFn: () => aiAssistantService.getAutoReplyStatus(),
  }),
  suggestedReplies: (conversationId: number) => ({
    queryKey: ["suggestedReplies", conversationId],
    queryFn: () => aiAssistantService.getSuggestedReplies(conversationId),
  }),
});
