"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useConversations } from "@/hooks/useConversations";
import { useMessages } from "@/hooks/useMessages";
import { buildChannels } from "@/lib/chatUtils";
import { sendReply, subscribeToNewMessage } from "@/services/api/api";
import { notifyNewMessage } from "@/lib/notify";
import type { ConversationViewModel, Message } from "@/lib/types";
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

  // Stable refs so the subscription effect doesn't re-run on every render
  const conversationsRef = useRef(conversations);
  useEffect(() => { conversationsRef.current = conversations; });
  const selectedConvRef = useRef(selectedConversation);
  useEffect(() => { selectedConvRef.current = selectedConversation; });

  // Global subscription: notify for client messages in conversations OTHER than
  // the currently selected one (selected conversation is handled by useMessages).
  useEffect(() => {
    const unsub = subscribeToNewMessage((msg: Message) => {
      if (msg.sender_type !== "client" || !msg.text) return;
      if (selectedConvRef.current?.id === msg.conversation_id) return;

      const conv = conversationsRef.current.find((c) => c.id === msg.conversation_id);
      if (conv) {
        notifyNewMessage({
          platform: conv.platform,
          contactName: conv.contact,
          textPreview: msg.text,
        });
      }
    });
    return () => { unsub(); };
  }, []);

  const channels = buildChannels(conversations);

  const filteredConversations = conversations.filter((conv) => {
    if (selectedChannel === "all") return true;
    return conv.platform === selectedChannel;
  });

  const handleSend = async () => {
    if (!messageInput.trim() || !selectedConversation) return;
    const text = messageInput.trim();
    setMessageInput("");
    try {
      await sendReply(selectedConversation.id, text, selectedConversation.platform);
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