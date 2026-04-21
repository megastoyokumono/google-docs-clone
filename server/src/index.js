import http from "node:http";
import cors from "cors";
import express from "express";
import { config } from "./config.js";
import documentsRouter from "./routes/documents.js";
import { attachRealtime } from "./services/realtime.js";
import "./db/database.js";

const app = express();

app.use(
  cors({
    origin: config.clientOrigin,
  }),
);
app.use(express.json({ limit: config.requestSizeLimit }));

app.get("/api/health", (_request, response) => {
  response.json({ ok: true });
});

app.use("/api/documents", documentsRouter);

app.use((error, _request, response, _next) => {
  if (error?.type === "entity.too.large" || error?.status === 413) {
    return response.status(413).json({
      error: "Document is too large to save. Try reducing pasted content or increase REQUEST_SIZE_LIMIT.",
    });
  }

  console.error(error);
  response.status(500).json({ error: "Internal server error" });
});

const server = http.createServer(app);
attachRealtime(server);

server.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
});
