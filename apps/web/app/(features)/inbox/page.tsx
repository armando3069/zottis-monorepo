import { Suspense } from "react";
import { ChatLayout } from "@/app/(features)/inbox/components/chat/ChatLayout";

export default function InboxPage() {
  return (
    <Suspense>
      <ChatLayout />
    </Suspense>
  );
}
