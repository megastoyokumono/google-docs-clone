import { Router } from "express";
import { z } from "zod";
import { config } from "../config.js";
import {
  createDocument,
  getDocumentById,
  listDocuments,
  updateDocument,
} from "../db/documentsRepository.js";

const router = Router();

const documentSchema = z.object({
  title: z.string().trim().min(1).max(120),
  content: z.string().max(config.maxDocumentLength).optional(),
});

const updateSchema = z.object({
  title: z.string().trim().min(1).max(120),
  content: z.string().max(config.maxDocumentLength),
});

router.get("/", (_request, response) => {
  response.json(listDocuments());
});

router.post("/", (request, response) => {
  const parsed = documentSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({ error: "Invalid document payload or document content is too large" });
  }

  const document = createDocument(parsed.data);
  return response.status(201).json(document);
});

router.get("/:id", (request, response) => {
  const document = getDocumentById(request.params.id);

  if (!document) {
    return response.status(404).json({ error: "Document not found" });
  }

  return response.json(document);
});

router.put("/:id", (request, response) => {
  const parsed = updateSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({ error: "Invalid document payload or document content is too large" });
  }

  const existingDocument = getDocumentById(request.params.id);
  if (!existingDocument) {
    return response.status(404).json({ error: "Document not found" });
  }

  const document = updateDocument({
    id: request.params.id,
    ...parsed.data,
  });

  return response.json(document);
});

export default router;
