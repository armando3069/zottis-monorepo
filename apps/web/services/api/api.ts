"use client";

import { getSocket } from "@/lib/socket";
import { getToken } from "@/services/auth/auth-service";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// ── Socket.IO request/response helper ────────────────────────────────────────

function socketRequestResponse<T>(
    emitEvent: string,
    payload: unknown,
    successEvent: string,
    errorEvent = "error"
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

export function getConversations(): Promise<any[]> {
    return socketRequestResponse<any[]>("getConversations", undefined, "conversations");
}

export function getMessages(conversationId: number): Promise<any[]> {
    return socketRequestResponse<any[]>("getMessages", { conversationId }, "messages");
}

// ── Mutations (REST) ──────────────────────────────────────────────────────────

export async function sendReply(
    conversationId: number,
    text: string,
    platform: string = "telegram",
): Promise<void> {
    const token = getToken();
    const endpoint = platform === "whatsapp" ? "whatsapp/reply" : "telegram/reply";
    const res = await fetch(`${API_URL}/${endpoint}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ conversationId, text }),
    });

    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { message?: string }).message ?? "Failed to send reply");
    }
}

// abonări la evenimente realtime
export function subscribeToNewMessage(handler: (message: any) => void) {
    const socket = getSocket();
    socket.on("newMessage", handler);
    return () => socket.off("newMessage", handler);
}

export function subscribeToNewConversation(handler: (conversation: any) => void) {
    const socket = getSocket();
    socket.on("newConversation", handler);
    return () => socket.off("newConversation", handler);
}