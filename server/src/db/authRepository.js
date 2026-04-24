import crypto from "node:crypto";
import database from "./database.js";

const findByUsernameStatement = database.prepare(`
  SELECT id, username, password_hash AS passwordHash, created_at AS createdAt
  FROM users
  WHERE username = ?
`);

const insertUserStatement = database.prepare(`
  INSERT INTO users (id, username, password_hash, created_at)
  VALUES (@id, @username, @passwordHash, @createdAt)
`);

export function getUserByUsername(username) {
  return findByUsernameStatement.get(username) || null;
}

export function createUser({ username, passwordHash }) {
  const user = {
    id: crypto.randomUUID(),
    username,
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  insertUserStatement.run(user);
  return { id: user.id, username: user.username, createdAt: user.createdAt };
}
