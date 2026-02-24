import type { ConversationViewModel, Message } from "@/lib/types";
import { ChatHeader } from "./ChatHeader";
import { MessagesList } from "./MessagesList";
import { MessageInput } from "./MessageInput";
import { EmptyState } from "./EmptyState";

interface ChatAreaProps {
  conversation: ConversationViewModel | null;
  messages: Message[];
  isLoadingMessages: boolean;
  messageInput: string;
  showSuggestions: boolean;
  onMessageInputChange: (value: string) => void;
  onShowSuggestionsChange: (show: boolean) => void;
  onSend: () => void;
}

export function ChatArea({
  conversation,
  messages,
  isLoadingMessages,
  messageInput,
  showSuggestions,
  onMessageInputChange,
  onShowSuggestionsChange,
  onSend,
}: ChatAreaProps) {
  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col bg-white">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      <ChatHeader conversation={conversation} />
      <MessagesList
        messages={messages}
        isLoading={isLoadingMessages}
        avatar={conversation.avatar}
      />
      <MessageInput
        value={messageInput}
        showSuggestions={showSuggestions}
        onValueChange={onMessageInputChange}
        onShowSuggestionsChange={onShowSuggestionsChange}
        onSend={onSend}
      />
    </div>
  );
}