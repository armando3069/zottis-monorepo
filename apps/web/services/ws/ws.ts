"use client";

import { getSocket } from "@/lib/socket";

// ── Socket.IO request/response helper ────────────────────────────────────────

function socketRequestResponse<T>(
  emitEvent: string,
  payload: unknown,
  successEvent: string,
  errorEvent = "error",
): Promise<T> {
  const socket = getSocket();

  return new Promise((resolve, reject) => {
    const handleSuccess = (data: T) => {
      socket.off(successEvent, handleSuccess);
      socket.off(errorEvent, handleError);
      resolve(data);
    };

    const handleError = (err: unknown) => {
      socket.off(successEvent, handleSuccess);
      socket.off(errorEvent, handleError);
      reject(err);
    };

    socket.once(successEvent, handleSuccess);
    socket.once(errorEvent, handleError);

    socket.emit(emitEvent, payload);
  });
}

// ── Real-time data (Socket.IO) ────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getConversations(): Promise<any[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return socketRequestResponse<any[]>("getConversations", undefined, "conversations");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getMessages(conversationId: number): Promise<any[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return socketRequestResponse<any[]>("getMessages", { conversationId }, "messages");
}

// ── Real-time subscriptions ───────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function subscribeToNewMessage(handler: (message: any) => void) {
  const socket = getSocket();
  socket.on("newMessage", handler);
  return () => socket.off("newMessage", handler);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function subscribeToNewConversation(handler: (conversation: any) => void) {
  const socket = getSocket();
  socket.on("newConversation", handler);
  return () => socket.off("newConversation", handler);
}
