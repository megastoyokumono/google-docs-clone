import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { config } from "../config.js";

fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });

const database = new Database(config.dbPath);

database.pragma("journal_mode = WAL");

database.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '<p></p>',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

try {
  database.exec("ALTER TABLE documents ADD COLUMN lineSpacing TEXT DEFAULT '1.6'");
} catch (error) {
  // Column might already exist, ignore error
}

try {
  database.exec("ALTER TABLE documents ADD COLUMN margins TEXT DEFAULT '{\"top\":72,\"right\":72,\"bottom\":72,\"left\":72}'");
} catch (error) {
  // Column might already exist, ignore error
}

export default database;
