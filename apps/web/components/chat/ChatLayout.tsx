"use client";

import { useState, useCallback } from "react";
import { useConversations } from "@/hooks/useConversations";
import { useMessages } from "@/hooks/useMessages";
import { buildChannels } from "@/lib/chatUtils";
import { sendReply } from "@/services/api/api";
import type { ConversationViewModel } from "@/lib/types";
import { Sidebar } from "./Sidebar";
import { ConversationList } from "./ConversationList";
import { ChatArea } from "./ChatArea";

export function ChatLayout() {
  const [selectedChannel, setSelectedChannel] = useState("all");
  const [selectedConversation, setSelectedConversation] = useState<ConversationViewModel | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { conversations, setConversations, isLoading: isLoadingConversations } = useConversations();

  // Stable callback: updates a conversation's preview in the list when a message arrives.
  const handlePreviewUpdate = useCallback(
    (conversationId: number, lastMessage: string, time: string) => {
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, lastMessage, time } : c))
      );
    },
    [setConversations]
  );

  const { messages, isLoading: isLoadingMessages } = useMessages({
    selectedConversation,
    onPreviewUpdate: handlePreviewUpdate,
  });

  const channels = buildChannels(conversations.length);

  const filteredConversations = conversations.filter((conv) => {
    if (selectedChannel === "all") return true;
    return conv.platform === selectedChannel;
  });

  const handleSend = async () => {
    if (!messageInput.trim() || !selectedConversation) return;
    const text = messageInput.trim();
    setMessageInput("");
    try {
      await sendReply(selectedConversation.id, text);
      // The sent message is received via the "newMessage" subscription in useMessages.
    } catch (e) {
      console.error("sendReply error", e);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Sidebar
        channels={channels}
        selectedChannel={selectedChannel}
        onSelectChannel={setSelectedChannel}
      />
      <ConversationList
        conversations={filteredConversations}
        selectedConversation={selectedConversation}
        isLoading={isLoadingConversations}
        onSelectConversation={setSelectedConversation}
      />
      <ChatArea
        conversation={selectedConversation}
        messages={messages}
        isLoadingMessages={isLoadingMessages}
        messageInput={messageInput}
        showSuggestions={showSuggestions}
        onMessageInputChange={setMessageInput}
        onShowSuggestionsChange={setShowSuggestions}
        onSend={handleSend}
      />
    </div>
  );
}