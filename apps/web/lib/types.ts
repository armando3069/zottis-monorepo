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
}

export interface Message {
  id: number;
  conversation_id: number;
  text: string;
  sender_type: "client" | "agent";
  timestamp?: string;
  created_at?: string;
}

export interface Channel {
  id: string;
  name: string;
  count: number;
}