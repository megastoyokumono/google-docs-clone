import crypto from "node:crypto";
import database from "./database.js";

const listStatement = database.prepare(`
  SELECT id, title, content, lineSpacing, margins, created_at AS createdAt, updated_at AS updatedAt
  FROM documents
  WHERE owner_id = ?
  ORDER BY datetime(updated_at) DESC
`);

const getStatement = database.prepare(`
  SELECT id, title, content, lineSpacing, margins, created_at AS createdAt, updated_at AS updatedAt
  FROM documents
  WHERE id = ? AND owner_id = ?
`);

const insertStatement = database.prepare(`
  INSERT INTO documents (id, owner_id, title, content, lineSpacing, margins, created_at, updated_at)
  VALUES (@id, @ownerId, @title, @content, @lineSpacing, @margins, @createdAt, @updatedAt)
`);

const updateStatement = database.prepare(`
  UPDATE documents
  SET title = @title, content = @content, lineSpacing = @lineSpacing, margins = @margins, updated_at = @updatedAt
  WHERE id = @id AND owner_id = @ownerId
`);

const deleteStatement = database.prepare(`
  DELETE FROM documents
  WHERE id = ? AND owner_id = ?
`);

function toPreview(content) {
  let text = "";
  try {
    const pages = JSON.parse(content);
    text = pages[0] || "";
  } catch (e) {
    text = content || "";
  }
  return text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

export function listDocuments(ownerId) {
  return listStatement.all(ownerId).map((document) => ({
    ...document,
    preview: toPreview(document.content),
  }));
}

export function getDocumentById(id, ownerId) {
  return getStatement.get(id, ownerId) || null;
}

export function createDocument({ title, content, lineSpacing = "1.6", margins }, ownerId) {
  const timestamp = new Date().toISOString();
  const document = {
    id: crypto.randomUUID(),
    ownerId,
    title,
    content: content || JSON.stringify(["<p></p>"]),
    lineSpacing,
    margins: margins || JSON.stringify({ top: 72, right: 72, bottom: 72, left: 72 }),
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  insertStatement.run(document);
  return getDocumentById(document.id, ownerId);
}

export function updateDocument({ id, title, content, lineSpacing = "1.6", margins }, ownerId) {
  const updatedAt = new Date().toISOString();
  updateStatement.run({ id, ownerId, title, content, lineSpacing, margins, updatedAt });
  return getDocumentById(id, ownerId);
}

export function deleteDocumentById(id, ownerId) {
  return deleteStatement.run(id, ownerId);
}
