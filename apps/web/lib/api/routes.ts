export const ROUTES = {
  auth: {
    login: "/auth/login",
    signup: "/auth/signup",
    me: "/auth/me",
  },
  conversations: {
    contacts: "/conversations/contacts",
    contactInfo: (id: number) => `/conversations/${id}/contact-info`,
    markAsRead: (id: number) => `/conversations/${id}/read`,
    archive: (id: number) => `/conversations/${id}/archive`,
    unarchive: (id: number) => `/conversations/${id}/unarchive`,
  },
  aiAssistant: {
    config: "/ai-assistant/config",
    autoReplyStatus: "/ai-assistant/auto-reply/status",
    autoReplyEnable: "/ai-assistant/auto-reply/enable",
    testReply: "/ai-assistant/test-reply",
    translate: "/ai-assistant/translate",
    suggestedReplies: (conversationId: number) =>
      `/ai-assistant/conversations/${conversationId}/suggested-replies`,
  },
  knowledge: {
    upload: "/knowledge/upload",
    ask: "/knowledge/ask",
    files: "/knowledge/files",
    clear: "/knowledge/clear",
  },
  messages: {
    telegramReply: "/telegram/reply",
    whatsappReply: "/whatsapp/reply",
    emailReply: "/email/reply",
  },
  platforms: {
    accounts: "/platform-accounts",
    telegramConnect: "/telegram/connect",
    whatsappConnect: "/whatsapp/connect",
    emailConnect: "/email/connect",
    emailDisconnect: (email: string) => `/email/disconnect/${encodeURIComponent(email)}`,
    emailTest: (email: string) => `/email/test/${encodeURIComponent(email)}`,
    emailAccounts: "/email/accounts",
  },
} as const;
