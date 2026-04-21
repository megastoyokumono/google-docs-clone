import crypto from "node:crypto";
import database from "./database.js";

const listStatement = database.prepare(`
  SELECT id, title, content, created_at AS createdAt, updated_at AS updatedAt
  FROM documents
  ORDER BY datetime(updated_at) DESC
`);

const getStatement = database.prepare(`
  SELECT id, title, content, created_at AS createdAt, updated_at AS updatedAt
  FROM documents
  WHERE id = ?
`);

const insertStatement = database.prepare(`
  INSERT INTO documents (id, title, content, created_at, updated_at)
  VALUES (@id, @title, @content, @createdAt, @updatedAt)
`);

const updateStatement = database.prepare(`
  UPDATE documents
  SET title = @title, content = @content, updated_at = @updatedAt
  WHERE id = @id
`);

function toPreview(content) {
  return content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

export function listDocuments() {
  return listStatement.all().map((document) => ({
    ...document,
    preview: toPreview(document.content),
  }));
}

export function getDocumentById(id) {
  return getStatement.get(id) || null;
}

export function createDocument({ title, content = "<p></p>" }) {
  const timestamp = new Date().toISOString();
  const document = {
    id: crypto.randomUUID(),
    title,
    content,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  insertStatement.run(document);
  return getDocumentById(document.id);
}

export function updateDocument({ id, title, content }) {
  const updatedAt = new Date().toISOString();
  updateStatement.run({
    id,
    title,
    content,
    updatedAt,
  });
  return getDocumentById(id);
}
