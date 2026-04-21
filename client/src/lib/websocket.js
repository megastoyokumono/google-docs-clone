import { WS_URL } from "./config";

export function connectToDocument(documentId, handlers) {
  const socket = new WebSocket(`${WS_URL}/ws?documentId=${documentId}`);

  socket.addEventListener("message", (event) => {
    try {
      const payload = JSON.parse(event.data);
      handlers.onMessage?.(payload);
    } catch (error) {
      handlers.onError?.(error);
    }
  });

  socket.addEventListener("open", () => {
    handlers.onOpen?.(socket);
  });

  socket.addEventListener("close", () => {
    handlers.onClose?.();
  });

  socket.addEventListener("error", (error) => {
    handlers.onError?.(error);
  });

  return socket;
}
