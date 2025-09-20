import { useEffect, useState } from "react";
import socket from "../socket/socket";

/**
 * useRideSocket
 * @param {Object} handlers - An object mapping event names to handler functions
 
 */
export default function useRideSocket(handlers = {}) {
  const [isSocketReady, setIsSocketReady] = useState(false);

  useEffect(() => {
    // Ensure socket is connected
    if (!socket.connected) socket.connect();

    // Connection ready
    socket.on("connect", () => setIsSocketReady(true));

    // Register all provided event handlers
    Object.entries(handlers).forEach(([event, handler]) => {
      if (typeof handler === "function") {
        socket.on(event, handler);
      }
    });

    // Cleanup on unmount
    return () => {
      socket.off("connect");
      Object.entries(handlers).forEach(([event, handler]) => {
        if (typeof handler === "function") {
          socket.off(event, handler);
        }
      });
    };
  }, [handlers]);

  return { socket, isSocketReady };
}
