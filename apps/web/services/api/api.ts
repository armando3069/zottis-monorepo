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

// ── AI Assistant (REST) ───────────────────────────────────────────────────────

async function aiPost<T>(path: string, body?: object): Promise<T> {
    const token = getToken();
    const res = await fetch(`${API_URL}/${path}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message ?? `${path} failed`);
    }
    return res.json() as Promise<T>;
}

async function aiGet<T>(path: string): Promise<T> {
    const token = getToken();
    const res = await fetch(`${API_URL}/${path}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error(`GET ${path} failed`);
    return res.json() as Promise<T>;
}

export function getAutoReplyStatus(): Promise<{ enabled: boolean }> {
    return aiGet("ai-assistant/auto-reply/status");
}

export function setAutoReply(enabled: boolean): Promise<{ enabled: boolean }> {
    return aiPost("ai-assistant/auto-reply/enable", { enabled });
}

export function testAiReply(text: string): Promise<{ reply: string }> {
    return aiPost("ai-assistant/test-reply", { text });
}

// ── Knowledge Base (REST) ─────────────────────────────────────────────────────

export interface IndexedFile {
    name: string;
    chunks: number;
    uploadedAt: string;
}

export async function uploadKnowledgePdf(
    file: File,
): Promise<{ success: boolean; chunks: number; file: string }> {
    const token = getToken();
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_URL}/knowledge/upload`, {
        method: "POST",
        // Do NOT set Content-Type — browser sets multipart/form-data + boundary automatically
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message ?? "Upload failed");
    }
    return res.json();
}

export function askKnowledge(
    question: string,
): Promise<{ answer: string; usedChunks?: string[] }> {
    return aiPost("knowledge/ask", { question });
}

export function getKnowledgeFiles(): Promise<{ files: IndexedFile[] }> {
    return aiGet("knowledge/files");
}

export async function clearKnowledge(): Promise<void> {
    const token = getToken();
    const res = await fetch(`${API_URL}/knowledge/clear`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error("Failed to clear knowledge base");
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