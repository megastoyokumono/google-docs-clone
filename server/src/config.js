import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

dotenv.config();

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultDbPath = path.resolve(serverRoot, "data", "docs.sqlite");

export const config = {
  port: Number(process.env.PORT || 3001),
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
  dbPath: path.resolve(process.env.DB_PATH || defaultDbPath),
  requestSizeLimit: process.env.REQUEST_SIZE_LIMIT || "100mb",
  maxDocumentLength: Number(process.env.MAX_DOCUMENT_LENGTH || 100000000),
  jwtSecret: process.env.JWT_SECRET || "local-docs-clone-dev-secret-change-in-prod",
};
