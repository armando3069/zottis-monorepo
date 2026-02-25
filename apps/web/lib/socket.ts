"use client";

import { io, Socket } from "socket.io-client";
import { getToken } from "@/services/auth/auth-service";

let socket: Socket | null = null;

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3001";

export function getSocket(): Socket {
    if (!socket) {
        const token = getToken();
        socket = io(WS_URL, {
            transports: ["websocket"],
            withCredentials: true,
            auth: token ? { token } : {},
        });

        socket.on("connect", () => {
            console.log("[socket] connected", socket?.id);
        });

        socket.on("disconnect", (reason) => {
            console.log("[socket] disconnected", reason);
        });
    }

    return socket;
}

/** Destroy the current socket so it is recreated fresh on next getSocket() call. */
export function resetSocket(): void {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}