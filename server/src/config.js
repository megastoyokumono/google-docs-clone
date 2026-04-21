import path from "node:path";
import dotenv from "dotenv";

dotenv.config();

const defaultDbPath = path.resolve(process.cwd(), "server", "data", "docs.sqlite");

export const config = {
  port: Number(process.env.PORT || 3001),
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
  dbPath: path.resolve(process.env.DB_PATH || defaultDbPath),
  requestSizeLimit: process.env.REQUEST_SIZE_LIMIT || "25mb",
  maxDocumentLength: Number(process.env.MAX_DOCUMENT_LENGTH || 10000000),
};
