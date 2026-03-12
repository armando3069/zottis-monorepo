import { Suspense } from "react";
import { ChatLayout } from "@/components/chat/ChatLayout";

export default function InboxPage() {
  return (
    <Suspense>
      <ChatLayout />
    </Suspense>
  );
}
