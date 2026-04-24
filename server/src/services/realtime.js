import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { getDocumentById } from "../db/documentsRepository.js";

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
    if (!room) return;
    room.delete(socket);
    if (room.size === 0) {
      rooms.delete(documentId);
    }
  }

  websocketServer.on("connection", (socket, request) => {
    const requestUrl = new URL(request.url, "http://localhost");
    const documentId = requestUrl.searchParams.get("documentId");
    const token = requestUrl.searchParams.get("token");

    if (!documentId) {
      socket.close(1008, "Missing documentId");
      return;
    }

    // Verify JWT
    let user;
    try {
      const payload = jwt.verify(token, config.jwtSecret);
      user = { id: payload.sub, username: payload.username };
    } catch {
      socket.close(1008, "Unauthorized");
      return;
    }

    // Verify user owns the document
    const doc = getDocumentById(documentId, user.id);
    if (!doc) {
      socket.close(1008, "Document not found or access denied");
      return;
    }

    socket.userId = user.id;
    socket.documentId = documentId;
    joinRoom(documentId, socket);

    socket.on("message", (rawMessage) => {
      let payload;
      try {
        payload = JSON.parse(rawMessage.toString());
      } catch {
        return;
      }

      if (payload.type !== "document:update") return;

      const room = rooms.get(documentId);
      if (!room) return;

      const message = JSON.stringify({
        type: "document:update",
        documentId,
        title: payload.title,
        content: payload.content,
        lineSpacing: payload.lineSpacing,
        margins: payload.margins,
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
