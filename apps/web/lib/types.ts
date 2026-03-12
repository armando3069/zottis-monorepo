export interface ConversationViewModel {
  id: number;
  contact: string;
  platform: string;
  lastMessage: string;
  time: string;
  unread: number;
  sentiment: string;
  category: string;
  entities: string[];
  avatar: string;
  // Lifecycle & contact info
  lifecycleStatus: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  contactCountry?: string | null;
  contactLanguage?: string | null;
  // Archive status
  isArchived: boolean;
}

/** Rich email metadata stored in message.attachments.emailMeta */
export interface EmailMeta {
  messageId?: string | null;
  subject?: string | null;
  from?: string | null;
  to?: string | null;
  cc?: string | null;
  date?: string | null;
  /** HTML body of the email (sanitized before rendering) */
  html?: string | null;
  inReplyTo?: string | null;
  references?: string | null;
}

export interface Message {
  id: number;
  conversation_id: number;
  text: string;
  /** "client" = incoming from contact; "bot" / "agent" = outgoing reply */
  sender_type: "client" | "bot" | "agent";
  timestamp?: string;
  created_at?: string;
  /** Platform that delivered this message: "telegram" | "whatsapp" | "email" */
  platform?: string;
  /** Flexible payload — for email platform contains emailMeta */
  attachments?: { emailMeta?: EmailMeta } | null;
}

export interface Channel {
  id: string;
  name: string;
  count: number;
}