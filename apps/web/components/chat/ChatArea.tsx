import type { ConversationViewModel, Message } from "@/lib/types";
import type { ContactInfoPatch } from "@/services/conversations/conversations.types";
import { ChatHeader } from "./ChatHeader";
import { MessagesList } from "./MessagesList";
import { MessageInput } from "./MessageInput";
import { EmptyState } from "./EmptyState";

interface ChatAreaProps {
  conversation: ConversationViewModel | null;
  messages: Message[];
  isLoadingMessages: boolean;
  messageInput: string;
  suggestions: string[];
  isLoadingSuggestions: boolean;
  isSuggestionsOpen: boolean;
  onMessageInputChange: (value: string) => void;
  onToggleSuggestions: () => void;
  onCloseSuggestions: () => void;
  onUpdateConversation: (id: number, patch: ContactInfoPatch) => Promise<void>;
  onArchive: (id: number) => void;
  onSend: () => void;
}

export function ChatArea({
  conversation,
  messages,
  isLoadingMessages,
  messageInput,
  suggestions,
  isLoadingSuggestions,
  isSuggestionsOpen,
  onMessageInputChange,
  onToggleSuggestions,
  onCloseSuggestions,
  onUpdateConversation,
  onArchive,
  onSend,
}: ChatAreaProps) {
  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col bg-[var(--bg-page)] rounded-r-xl">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[var(--bg-page)] rounded-r-xl">
      <ChatHeader conversation={conversation} onUpdateConversation={onUpdateConversation} onArchive={onArchive} />
      <MessagesList
        messages={messages}
        isLoading={isLoadingMessages}
        avatar={conversation.avatar}
      />
      <MessageInput
        value={messageInput}
        suggestions={suggestions}
        isLoadingSuggestions={isLoadingSuggestions}
        isSuggestionsOpen={isSuggestionsOpen}
        onValueChange={onMessageInputChange}
        onToggleSuggestions={onToggleSuggestions}
        onCloseSuggestions={onCloseSuggestions}
        onSend={onSend}
      />
    </div>
  );
}
