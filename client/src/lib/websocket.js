import { WS_URL } from "./config";

function getToken() {
  return localStorage.getItem("docs-clone:token");
}

export function connectToDocument(documentId, handlers) {
  const token = getToken();
  const socket = new WebSocket(`${WS_URL}/ws?documentId=${documentId}&token=${encodeURIComponent(token || "")}`);

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
