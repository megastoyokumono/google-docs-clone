import { WebSocketServer } from "ws";

export function attachRealtime(server) {
  const websocketServer = new WebSocketServer({
    server,
    path: "/ws",
  });

  const rooms = new Map();

  function joinRoom(documentId, socket) {
    const room = rooms.get(documentId) || new Set();
    room.add(socket);
    rooms.set(documentId, room);
  }

  function leaveRoom(documentId, socket) {
    const room = rooms.get(documentId);
    if (!room) {
      return;
    }

    room.delete(socket);
    if (room.size === 0) {
      rooms.delete(documentId);
    }
  }

  websocketServer.on("connection", (socket, request) => {
    const requestUrl = new URL(request.url, "http://localhost");
    const documentId = requestUrl.searchParams.get("documentId");

    if (!documentId) {
      socket.close(1008, "Missing documentId");
      return;
    }

    socket.documentId = documentId;
    joinRoom(documentId, socket);

    socket.on("message", (rawMessage) => {
      let payload;

      try {
        payload = JSON.parse(rawMessage.toString());
      } catch {
        return;
      }

      if (payload.type !== "document:update") {
        return;
      }

      const room = rooms.get(documentId);
      if (!room) {
        return;
      }

      const message = JSON.stringify({
        type: "document:update",
        documentId,
        title: payload.title,
        content: payload.content,
        sourceClientId: payload.sourceClientId,
        updatedAt: new Date().toISOString(),
      });

      for (const client of room) {
        if (client.readyState === 1) {
          client.send(message);
        }
      }
    });

    socket.on("close", () => {
      leaveRoom(documentId, socket);
    });
  });

  return websocketServer;
}
