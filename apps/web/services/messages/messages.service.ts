import { request } from "@/lib/api/request";
import { ROUTES } from "@/lib/api/routes";
import type { SendReplyPayload } from "./messages.types";

class MessagesService {
  sendReply = (
    conversationId: number,
    text: string,
    platform: string = "telegram",
  ): Promise<void> => {
    let url: string;
    if (platform === "whatsapp") {
      url = ROUTES.messages.whatsappReply;
    } else if (platform === "email") {
      url = ROUTES.messages.emailReply;
    } else {
      url = ROUTES.messages.telegramReply;
    }
    return request.post<void>(url, { conversationId, text } satisfies SendReplyPayload);
  };
}

export const messagesService = new MessagesService();
